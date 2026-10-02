// ClickUp da /captura-reunioes pela API direta (fora do limite de 1.000 chamadas/dia do conector).
// Token: variável de ambiente CLICKUP_API_TOKEN (nuvem) ou o .env da raiz (este computador). Nunca imprime o token.
// Tudo que entra texto (create, desc, comment) lê do stdin, em UTF-8. Uso, na raiz do repo:
//   node .claude/skills/captura-reunioes/cu.mjs check                  confere token e rede
//   node .claude/skills/captura-reunioes/cu.mjs get <id>               tarefa + subtarefas (resumo)
//   node .claude/skills/captura-reunioes/cu.mjs desc <id>              descrição completa (markdown)
//   node .claude/skills/captura-reunioes/cu.mjs search <termo> [...]   tarefas abertas do workspace com todos os termos no nome
//   node .claude/skills/captura-reunioes/cu.mjs create  < json         {name,parent,assignees:[ids],due:"AAAA-MM-DD",priority,description,tags}
//   node .claude/skills/captura-reunioes/cu.mjs setdesc <id> < texto   troca a descrição (ler antes, mandar a versão completa)
//   node .claude/skills/captura-reunioes/cu.mjs comment <id> < texto   [@Nome](#user_mention#ID) vira menção de verdade
//   node .claude/skills/captura-reunioes/cu.mjs status <id> <status>
//   node .claude/skills/captura-reunioes/cu.mjs tag <id> <tag>
//   node .claude/skills/captura-reunioes/cu.mjs statuses <id>          status válidos da lista da tarefa
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const envFile = process.env.ENVFILE || '.env';
const env = !fs.existsSync(envFile) ? {} : Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const TOKEN = process.env.CLICKUP_API_TOKEN || env.CLICKUP_API_TOKEN;
const WS = '90132863446', LISTA = '901325858557', API = 'https://api.clickup.com/api/v2';
const falha = m => { console.error('ERRO: ' + m); process.exit(1); };
if (!TOKEN) falha('CLICKUP_API_TOKEN ausente (nem variável de ambiente, nem .env)');
const j = (u, o = {}) => {
  const a = ['-s', '--fail-with-body', '--max-time', '60', '-H', `Authorization: ${TOKEN}`, '-H', 'Content-Type: application/json; charset=utf-8'];
  if (o.method) a.push('-X', o.method);
  if (o.body) a.push('--data-binary', '@-');
  let out;
  try { out = execFileSync('curl', [...a, API + u], { input: o.body, encoding: 'utf8', maxBuffer: 64e6 }); }
  catch (e) { falha(`${o.method || 'GET'} ${u}: ${String(e.stdout || e.message).slice(0, 300)}`); }
  return out ? JSON.parse(out) : {};
};
const stdin = () => fs.readFileSync(0, 'utf8').replace(/^﻿/, '').trimEnd();
const tz = 'America/Sao_Paulo';
const dia = ms => ms ? new Date(Number(ms)).toLocaleDateString('pt-BR', { timeZone: tz }) : 'sem prazo';
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const linha = t => `${t.id} · ${t.status?.status} · ${t.name.trim()} · ${(t.assignees || []).map(a => a.username).join(', ') || 'sem responsável'} · ${dia(t.due_date)} · ${t.list?.name || ''} · ${t.url || 'https://app.clickup.com/t/' + t.id}`;
const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'check') {
  const u = j('/user');
  console.log('ok: API do ClickUp respondendo como ' + u.user.username);
} else if (cmd === 'get') {
  const t = j(`/task/${args[0]}?include_subtasks=true`);
  console.log(linha(t) + ' · tags: ' + (t.tags || []).map(x => x.name).join(', ') + ' · parent: ' + (t.parent || '-'));
  for (const s of t.subtasks || []) console.log('  └ ' + linha(s));
} else if (cmd === 'desc') {
  const t = j(`/task/${args[0]}?include_markdown_description=true`);
  console.log(t.markdown_description ?? t.description ?? '');
} else if (cmd === 'search') {
  // cache de 30 min das tarefas abertas do workspace: uma varredura serve pra todas as buscas da execução
  const cache = path.join(os.tmpdir(), 'cu-abertas.json');
  let tasks;
  if (fs.existsSync(cache) && Date.now() - fs.statSync(cache).mtimeMs < 30 * 60e3) tasks = JSON.parse(fs.readFileSync(cache, 'utf8'));
  else {
    tasks = [];
    for (let p = 0; p < 100; p++) {
      const r = j(`/team/${WS}/task?subtasks=true&include_closed=false&page=${p}`);
      tasks.push(...r.tasks.filter(t => !['closed', 'done'].includes(t.status?.type)).map(t => ({ id: t.id, name: t.name, status: { status: t.status?.status }, assignees: (t.assignees || []).map(a => ({ username: a.username })), due_date: t.due_date, list: { name: t.list?.name }, url: t.url, parent: t.parent })));
      if (r.last_page !== false || !r.tasks.length) break;
    }
    fs.writeFileSync(cache, JSON.stringify(tasks));
  }
  const termos = args.map(norm);
  const achou = tasks.filter(t => termos.every(x => norm(t.name).includes(x)));
  console.log(`${achou.length} de ${tasks.length} abertas`);
  achou.slice(0, 40).forEach(t => console.log(linha(t) + (t.parent ? ' · sub de ' + t.parent : '')));
} else if (cmd === 'create') {
  const d = JSON.parse(stdin());
  const pri = { urgent: 1, high: 2, normal: 3, low: 4 }[d.priority] ?? 3;
  const body = { name: d.name, markdown_content: d.description || '', assignees: (d.assignees || []).map(Number), priority: pri, tags: d.tags || ['captura-ia'] };
  if (d.parent) body.parent = d.parent;
  if (d.due) { body.due_date = new Date(d.due + 'T12:00:00-03:00').getTime(); body.due_date_time = false; }
  const t = j(`/list/${d.list || LISTA}/task`, { method: 'POST', body: JSON.stringify(body) });
  console.log(`criada: ${t.id} · ${t.name} · ${t.url}`);
} else if (cmd === 'setdesc') {
  const texto = stdin();
  if (!texto) falha('descrição vazia: nada foi alterado');
  j(`/task/${args[0]}`, { method: 'PUT', body: JSON.stringify({ markdown_content: texto }) });
  console.log(`descrição atualizada: ${args[0]} (${texto.length} caracteres)`);
} else if (cmd === 'comment') {
  const texto = stdin(), partes = [];
  let i = 0;
  for (const m of texto.matchAll(/\[@([^\]]+)\]\(#user_mention#(\d+)\)/g)) {
    if (m.index > i) partes.push({ text: texto.slice(i, m.index) });
    partes.push({ type: 'tag', user: { id: Number(m[2]) } });
    i = m.index + m[0].length;
  }
  if (i < texto.length) partes.push({ text: texto.slice(i) });
  const r = j(`/task/${args[0]}/comment`, { method: 'POST', body: JSON.stringify({ comment: partes, notify_all: false }) });
  console.log(`comentado: ${args[0]} · comentário ${r.id}`);
} else if (cmd === 'status') {
  const t = j(`/task/${args[0]}`, { method: 'PUT', body: JSON.stringify({ status: args.slice(1).join(' ') }) });
  console.log(`status: ${t.id} → ${t.status?.status}`);
} else if (cmd === 'tag') {
  j(`/task/${args[0]}/tag/${encodeURIComponent(args.slice(1).join(' '))}`, { method: 'POST', body: '{}' });
  console.log(`tag ${args.slice(1).join(' ')}: ${args[0]}`);
} else if (cmd === 'statuses') {
  const t = j(`/task/${args[0]}`);
  const l = j(`/list/${t.list.id}`);
  console.log(l.statuses.map(s => `${s.status} (${s.type})`).join(' · '));
} else falha('comando desconhecido. Ver o cabeçalho do script.');
