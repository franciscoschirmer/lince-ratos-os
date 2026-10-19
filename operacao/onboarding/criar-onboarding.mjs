// Cria um onboarding no ClickUp a partir do modelo completo (operacao/onboarding/modelo.json) + o spec do cliente
// (operacao/onboarding/specs/<cliente>.json). O spec diz o D0, os módulos do contrato e as especificidades; o script
// tira o que não está no contrato, conta os prazos em dias úteis a partir do D0 e cria mãe + subtarefas com checklist.
// Uso, na raiz do repo:
//   node operacao/onboarding/criar-onboarding.mjs operacao/onboarding/specs/<cliente>.json --seco   mostra o plano, não cria
//   node operacao/onboarding/criar-onboarding.mjs operacao/onboarding/specs/<cliente>.json          cria
// Retomada: com "maeId" no spec, usa a mãe existente e pula subtarefa que já existe com o mesmo nome.
// Fala com o ClickUp pelo operacao/clickup/cu.mjs (API direta, token do .env). Um responsável por tarefa (limite do espaço).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [arq, flag] = process.argv.slice(2);
if (!arq) { console.error('uso: node operacao/onboarding/criar-onboarding.mjs <spec.json> [--seco]'); process.exit(1); }
const ler = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const spec = ler(arq), modelo = ler(spec.modelo || 'operacao/onboarding/modelo.json');
const seco = flag === '--seco';
const LISTA = spec.lista || '901325858469'; // Onboardings em Andamento
const CAMPO_FASE = 'c43def5c-d5ac-4eac-bf9d-1aa17b5c9d0d';
const FASES = { 0: 'a329d792-5023-4f4b-a9a4-9a574669c4a9', 1: '0bf72e74-42a2-452a-bb91-3b8327576686', 2: '74895539-c5bc-4705-9b79-f34155fd95a8', 3: 'b2e24f0d-e558-4ef5-9393-13a1e4d9e354', 4: '02b37866-e312-4783-bbd8-72cc85f52961', 5: '5e5967a9-95c0-4e8d-aa04-83f5d2b7cd1c' };
const NOMES_FASE = { 1: 'F1 · Boas-vindas e ativos', 2: 'F2 · Setup técnico e comercial', 3: 'F3 · Direção e Estratégia (Opus)', 4: 'F4 · Ativação', 5: 'F5 · Go Live' };
const PESSOAS = { 158419961: 'Francisco', 112000442: 'Ivan', 82001470: 'Júlia', 284651027: 'Pâmela', 48777424: 'Victoria', 81994084: 'Marina', 49036032: 'Jenifer', 164678340: 'Henri', 118092849: 'Cláudio', 118126212: 'Mateus' };

// ---------- calendário: dias úteis a partir do D0, sem fim de semana nem feriado nacional ----------
const FERIADOS = new Set(['2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
  '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21', '2027-05-01', '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25']);
const iso = d => d.toISOString().slice(0, 10);
const util = d => d.getUTCDay() % 6 !== 0 && !FERIADOS.has(iso(d));
const mais = (s, n) => { const d = new Date(s + 'T12:00:00Z'); let k = 0; while (k < n) { d.setUTCDate(d.getUTCDate() + 1); if (util(d)) k++; } return iso(d); };
const SEMANA = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const praDiaLivre = s => { // empurra pro próximo dia livre da cliente (ou fica, se já é)
  if (!spec.diaLivre) return s;
  const d = new Date(s + 'T12:00:00Z'); while (d.getUTCDay() !== SEMANA[spec.diaLivre] || !util(d)) d.setUTCDate(d.getUTCDate() + 1); return iso(d);
};
const br = s => s.slice(8, 10) + '/' + s.slice(5, 7);
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dsem = s => DIAS[new Date(s + 'T12:00:00Z').getUTCDay()];

// ---------- montar o onboarding do cliente a partir do modelo ----------
if (!spec.d0 || !/^\d{4}-\d{2}-\d{2}$/.test(spec.d0)) { console.error('spec sem "d0" (AAAA-MM-DD, dia da reunião de onboarding)'); process.exit(1); }
const mods = new Set(['base', ...(spec.modulos || [])]);
for (const m of mods) if (!modelo.modulos[m]) { console.error(`módulo desconhecido no spec: ${m} (válidos: ${Object.keys(modelo.modulos).join(', ')})`); process.exit(1); }
const troca = s => String(s).replaceAll('{cliente}', spec.cliente).replaceAll('{conteudos}', spec.conteudos ?? 'os');
const feito = t => (spec.feitos || []).find(f => t.toLowerCase().startsWith((typeof f === 'string' ? f : f.t).toLowerCase()));
const subtarefas = modelo.tarefas.filter(t => mods.has(t.modulo) && !spec.ajustes?.[t.chave]?.fora).map(t => {
  const aj = spec.ajustes?.[t.chave] || {};
  let due = aj.data || mais(spec.d0, aj.dias ?? t.dias);
  if (t.diaLivre && !aj.data) due = praDiaLivre(due);
  const checklist = t.checklist.filter(i => !i.m || mods.has(i.m)).map(i => {
    const f = feito(troca(i.t)); const nota = f && typeof f !== 'string' && f.nota ? ` (${f.nota})` : '';
    return [troca(i.t) + nota, !!f];
  });
  for (const extra of aj.checklist || []) checklist.push([extra, false]);
  const name = troca(aj.nome || t.name) + (t.diaLivre && spec.diaLivre ? ` (${dsem(due)} ${br(due)})` : '');
  return { chave: t.chave, fase: t.fase, due, name, assignees: [aj.dono || t.dono], description: troca(t.description) + (aj.nota ? '\n\n**Desta conta:** ' + aj.nota : ''), checklist, status: aj.status || t.status };
});
const ultima = subtarefas.reduce((a, s) => s.due > a ? s.due : a, spec.d0);
const escopo = [spec.conteudos && mods.has('conteudo') ? `${spec.conteudos} conteúdos` : null, mods.has('lp') ? 'LP' : null, mods.has('trafego') ? (mods.has('google') ? 'tráfego Meta + Google' : 'tráfego') : null, mods.has('comercial') ? 'comercial' : null].filter(Boolean);
const fora = Object.keys(modelo.modulos).filter(m => !mods.has(m));
const porFase = Object.entries(NOMES_FASE).map(([f, nome]) => {
  const ts = subtarefas.filter(s => s.fase === Number(f)); if (!ts.length) return null;
  return `| ${nome} | ${ts.map(s => s.name.replace(/^F\d · /, '')).join('; ')} | ${br(ts.reduce((a, s) => s.due > a ? s.due : a, ''))} |`;
}).filter(Boolean);
const mae = {
  name: `Onboarding · ${spec.cliente} | ${spec.produto || 'Boutique'} (${escopo.join(' + ')})`,
  assignees: [spec.dono || 158419961], due: ultima, status: 'em andamento',
  description: [
    `Tarefa-mãe do onboarding de **${spec.cliente}**. Gerada pela skill /onboarding a partir do modelo completo (\`operacao/onboarding/modelo.json\`). Uma subtarefa por entregável, com dono, prazo e "pronto quando"; os passos pequenos ficam no checklist. As peças de conteúdo andam no Calendário Editorial.`,
    '', `**Escopo (contrato):** ${spec.produto || 'Boutique'} · ${escopo.join(' · ')}.${fora.length ? ` **Fora do contrato:** ${fora.map(m => modelo.modulos[m].split(':')[0]).join('; ')}.` : ''}`,
    spec.contrato ? `**Fonte do escopo:** ${spec.contrato}` : null,
    `**D0:** ${br(spec.d0)}/${spec.d0.slice(0, 4)} (${dsem(spec.d0)}), reunião de onboarding. Prazos em dias úteis a partir do D0, sem fim de semana e feriado.${spec.d0Fonte ? ' Fonte: ' + spec.d0Fonte : ''}`,
    spec.diaLivre ? `**Dia livre da cliente:** ${spec.diaLivre}. Reunião e gravação caem nele.` : null,
    '', '**Jornada:**', '', '| Fase | Entregas | Até |', '| --- | --- | --- |', ...porFase,
    spec.especificidades?.length ? '\n**Especificidades desta conta:**\n' + spec.especificidades.map(e => '* ' + e).join('\n') : null,
  ].filter(x => x !== null).join('\n')
};

// ---------- mostrar ou criar ----------
if (seco) {
  console.log(`■ ${mae.name} · ${PESSOAS[mae.assignees[0]]} · até ${br(mae.due)}\n  D0 ${br(spec.d0)} (${dsem(spec.d0)}) · módulos: ${[...mods].join(', ')}${fora.length ? ' · fora: ' + fora.join(', ') : ''}`);
  for (const s of subtarefas) console.log(`  └ ${dsem(s.due)} ${br(s.due)} · ${s.name} · ${PESSOAS[s.assignees[0]] || s.assignees[0]} · ${s.checklist.length} itens${s.checklist.some(c => c[1]) ? ` (${s.checklist.filter(c => c[1]).length} já feitos)` : ''}`);
  process.exit(0);
}
if (spec.criadoEm && !spec.maeId) { console.error(`este onboarding já foi criado em ${spec.criadoEm}: pra retomar, ponha "maeId" no spec`); process.exit(1); }
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };
const cu = (args, input) => execFileSync('node', ['operacao/clickup/cu.mjs', ...args], { input, encoding: 'utf8', env, stdio: ['pipe', 'pipe', 'inherit'] }).trim();
const api = (m, p, body) => JSON.parse(cu(['api', m, p], body ? JSON.stringify(body) : undefined) || '{}');
function cria(t, parent) {
  const id = (cu(['create'], JSON.stringify({ name: t.name, list: LISTA, parent, assignees: t.assignees, due: t.due, description: t.description })).match(/criada: (\S+)/) || [])[1];
  if (!id) throw new Error('não criou: ' + t.name);
  if (t.status) cu(['status', id, t.status]);
  if (t.fase !== undefined) api('POST', `/v2/task/${id}/field/${CAMPO_FASE}`, { value: FASES[t.fase] });
  if (t.checklist?.length) {
    const cl = api('POST', `/v2/task/${id}/checklist`, { name: 'Passos' }).checklist;
    // o ClickUp embaralha a ordem quando os itens entram rápido: orderindex explícito em cada um
    t.checklist.forEach(([nome, ok], k) => {
      const r = api('POST', `/v2/checklist/${cl.id}/checklist_item`, { name: nome });
      const item = r.checklist.items.find(x => x.name === nome);
      if (item) api('PUT', `/v2/checklist/${cl.id}/checklist_item/${item.id}`, { orderindex: k, ...(ok ? { resolved: true } : {}) });
    });
  }
  console.log(`${parent ? '  └' : '■'} ${id} · ${t.name} · https://app.clickup.com/t/${id}`);
  return id;
}
const maeId = spec.maeId || cria(mae);
const existentes = spec.maeId ? new Set((api('GET', `/v2/task/${maeId}?include_subtasks=true`).subtasks || []).map(x => x.name.trim())) : new Set();
for (const s of subtarefas) existentes.has(s.name) ? console.log('  = já existe: ' + s.name) : cria(s, maeId);
