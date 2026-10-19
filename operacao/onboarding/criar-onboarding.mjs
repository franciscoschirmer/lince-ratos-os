// Cria um onboarding no ClickUp a partir de um arquivo de especificação (JSON), no modelo enxuto de 2026-10-19:
// uma tarefa-mãe + uma subtarefa por entregável (dono, prazo, "pronto quando"), com os micro passos em checklist.
// Uso, na raiz do repo:  node operacao/onboarding/criar-onboarding.mjs operacao/onboarding/specs/<cliente>.json [--seco]
// --seco só mostra o que seria criado. Fala com o ClickUp pelo operacao/clickup/cu.mjs (API direta, token do .env).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [arq, flag] = process.argv.slice(2);
if (!arq) { console.error('uso: node operacao/onboarding/criar-onboarding.mjs <spec.json> [--seco]'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(arq, 'utf8').replace(/^﻿/, ''));
const seco = flag === '--seco';
const LISTA = spec.lista || '901325858469'; // Onboardings em Andamento
const CAMPO_FASE = 'c43def5c-d5ac-4eac-bf9d-1aa17b5c9d0d';
const FASES = { 0: 'a329d792-5023-4f4b-a9a4-9a574669c4a9', 1: '0bf72e74-42a2-452a-bb91-3b8327576686', 2: '74895539-c5bc-4705-9b79-f34155fd95a8', 3: 'b2e24f0d-e558-4ef5-9393-13a1e4d9e354', 4: '02b37866-e312-4783-bbd8-72cc85f52961', 5: '5e5967a9-95c0-4e8d-aa04-83f5d2b7cd1c' };
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };
const cu = (args, input) => execFileSync('node', ['operacao/clickup/cu.mjs', ...args], { input, encoding: 'utf8', env, stdio: ['pipe', 'pipe', 'inherit'] }).trim();
const api = (m, p, body) => JSON.parse(cu(['api', m, p], body ? JSON.stringify(body) : undefined) || '{}');
const idDe = saida => (saida.match(/criada: (\S+)/) || [])[1];

function cria(t, parent) {
  if (seco) { console.log(`${parent ? '  └' : '■'} ${t.name} · ${t.due || 'sem prazo'} · ${(t.checklist || []).length} itens`); return 'SECO'; }
  const id = idDe(cu(['create'], JSON.stringify({ name: t.name, list: LISTA, parent, assignees: t.assignees || [], due: t.due, description: t.description || '', tags: t.tags || [] })));
  if (!id) throw new Error('não criou: ' + t.name);
  if (t.status) cu(['status', id, t.status]);
  if (t.fase !== undefined) api('POST', `/v2/task/${id}/field/${CAMPO_FASE}`, { value: FASES[t.fase] });
  if (t.checklist?.length) {
    const cl = api('POST', `/v2/task/${id}/checklist`, { name: t.checklistNome || 'Passos' }).checklist;
    // o ClickUp embaralha a ordem quando os itens entram rápido: orderindex explícito em cada um
    t.checklist.forEach((it, k) => {
      const [nome, ok] = Array.isArray(it) ? it : [it, false];
      const r = api('POST', `/v2/checklist/${cl.id}/checklist_item`, { name: nome });
      const item = r.checklist.items.find(x => x.name === nome);
      if (item) api('PUT', `/v2/checklist/${cl.id}/checklist_item/${item.id}`, { orderindex: k, ...(ok ? { resolved: true } : {}) });
    });
  }
  console.log(`${parent ? '  └' : '■'} ${id} · ${t.name} · https://app.clickup.com/t/${id}`);
  return id;
}

// Retomada: com spec.mae.id, usa a mãe existente e pula subtarefa que já existe com o mesmo nome (não duplica).
// O espaço aceita um responsável só por tarefa: o segundo envolvido vai no checklist ou na descrição.
const mae = spec.mae.id || cria(spec.mae);
const existentes = spec.mae.id && !seco ? new Set((api('GET', `/v2/task/${mae}?include_subtasks=true`).subtasks || []).map(x => x.name.trim())) : new Set();
for (const s of spec.subtarefas) existentes.has(s.name) ? console.log('  = já existe: ' + s.name) : cria(s, mae);
