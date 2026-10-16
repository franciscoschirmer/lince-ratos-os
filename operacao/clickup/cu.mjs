// ClickUp pela API direta, com o token pessoal do Francisco. Caminho principal nesta máquina: o conector MCP
// do claude.ai tem limite de 1.000 chamadas/dia pro workspace inteiro e vive estourado; a API direta não conta nele.
// Token: variável CLICKUP_API_TOKEN ou o .env da raiz (fora do git). O script nunca imprime o token, nem em erro.
// Texto que entra (create, setdesc, comment, api com corpo) vem do stdin em UTF-8. Uso, na raiz do repo:
//   node operacao/clickup/cu.mjs check                         confere token e rede
//   node operacao/clickup/cu.mjs get <id>                      tarefa + subtarefas (resumo)
//   node operacao/clickup/cu.mjs desc <id>                     descrição completa (markdown)
//   node operacao/clickup/cu.mjs fields <id>                   campos personalizados com valor
//   node operacao/clickup/cu.mjs comments <id>                 comentários, do mais antigo pro mais novo
//   node operacao/clickup/cu.mjs list <list_id> [--fechadas] [--status "x"]   tarefas de uma lista
//   node operacao/clickup/cu.mjs search <termo> [...] [--fechadas]   tarefas do workspace com todos os termos no nome (cache 30 min)
//   node operacao/clickup/cu.mjs hier                          espaços → pastas → listas, com ids (cache 1 dia)
//   node operacao/clickup/cu.mjs statuses <id>                 status válidos da lista da tarefa
//   node operacao/clickup/cu.mjs create  < json                {name,list?,parent?,assignees:[ids],due:"AAAA-MM-DD",priority,description,tags}
//   node operacao/clickup/cu.mjs setdesc <id> < texto          troca a descrição (ler antes, mandar a versão completa)
//   node operacao/clickup/cu.mjs comment <id> < texto          [@Nome](#user_mention#ID) vira menção de verdade
//   node operacao/clickup/cu.mjs status <id> <status>
//   node operacao/clickup/cu.mjs due <id> <AAAA-MM-DD|limpar>
//   node operacao/clickup/cu.mjs assign <id> <user_id> [...]   (prefixo - tira: -158419961)
//   node operacao/clickup/cu.mjs tag <id> <tag>
//   node operacao/clickup/cu.mjs api <GET|POST|PUT|DELETE> </v2/... | /v3/...> [< json]   chamada crua, devolve o JSON
// IDs de usuário em _contexto/ferramentas.md. Workspace 90132863446.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const envFile = process.env.ENVFILE || '.env';
const env = !fs.existsSync(envFile) ? {} : Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const TOKEN = process.env.CLICKUP_API_TOKEN || env.CLICKUP_API_TOKEN;
const WS = '90132863446', LISTA_PADRAO = '901325858557', API = 'https://api.clickup.com/api';
const falha = m => { console.error('ERRO: ' + (TOKEN ? String(m).split(TOKEN).join('***') : String(m))); process.exit(1); };
if (!TOKEN) falha('CLICKUP_API_TOKEN ausente (nem variável de ambiente, nem .env)');
const j = (u, o = {}) => {
  const a = ['-sS', '--fail-with-body', '--max-time', '60', '-H', `Authorization: ${TOKEN}`, '-H', 'Content-Type: application/json; charset=utf-8'];
  if (o.method) a.push('-X', o.method);
  if (o.body) a.push('--data-binary', '@-');
  let out;
  // erro nunca repete o comando (ele leva o token): só código de saída, stderr e começo do corpo, filtrados
  try { out = execFileSync('curl', [...a, API + (u.startsWith('/v') ? u : '/v2' + u)], { input: o.body, encoding: 'utf8', maxBuffer: 64e6, stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch (e) { falha(`${o.method || 'GET'} ${u}: curl saiu com código ${e.status} · ${String(e.stderr || '').trim()} · ${String(e.stdout || '').slice(0, 300)}`); }
  return out ? JSON.parse(out) : {};
};
const stdin = () => fs.readFileSync(0, 'utf8').replace(/^﻿/, '').trimEnd();
const tz = 'America/Sao_Paulo';
const dia = ms => ms ? new Date(Number(ms)).toLocaleDateString('pt-BR', { timeZone: tz }) : 'sem prazo';
const quando = ms => ms ? new Date(Number(ms)).toLocaleString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : '?';
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const linha = t => `${t.id} · ${t.status?.status} · ${t.name.trim()} · ${(t.assignees || []).map(a => a.username).join(', ') || 'sem responsável'} · ${dia(t.due_date)} · ${t.list?.name || ''} · ${t.url || 'https://app.clickup.com/t/' + t.id}`;
const enxuta = t => ({ id: t.id, name: t.name, status: { status: t.status?.status, type: t.status?.type }, assignees: (t.assignees || []).map(a => ({ username: a.username })), due_date: t.due_date, list: { id: t.list?.id, name: t.list?.name }, url: t.url, parent: t.parent });
const cache = (nome, ttlMs, gera) => {
  const f = path.join(os.tmpdir(), 'cu-' + nome + '.json');
  if (fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs < ttlMs) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const v = gera(); fs.writeFileSync(f, JSON.stringify(v)); return v;
};
const paginas = base => {
  const out = [], vistos = new Set();
  for (let p = 0; p < 200; p++) {
    const r = j(`${base}&page=${p}`);
    for (const t of r.tasks || []) if (!vistos.has(t.id)) { vistos.add(t.id); out.push(t); }
    if (r.last_page !== false || !(r.tasks || []).length) break;
  }
  return out;
};
const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const args = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--status');
const [cmd, ...rest] = args;
const fechadas = flags.has('--fechadas');

if (cmd === 'check') {
  const u = j('/user');
  console.log('ok: API do ClickUp respondendo como ' + u.user.username);
} else if (cmd === 'get') {
  const t = j(`/task/${rest[0]}?include_subtasks=true`);
  console.log(linha(t) + ' · tags: ' + (t.tags || []).map(x => x.name).join(', ') + ' · parent: ' + (t.parent || '-') + ' · criada ' + dia(t.date_created) + ' · atualizada ' + dia(t.date_updated));
  for (const s of t.subtasks || []) console.log('  └ ' + linha(s));
} else if (cmd === 'desc') {
  const t = j(`/task/${rest[0]}?include_markdown_description=true`);
  console.log(t.markdown_description ?? t.description ?? '');
} else if (cmd === 'fields') {
  const t = j(`/task/${rest[0]}`);
  for (const f of t.custom_fields || []) {
    let v = f.value;
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    if (f.type === 'drop_down') v = (f.type_config?.options || []).find(o => o.orderindex == v || o.id == v)?.name ?? v;
    else if (f.type === 'labels') v = (Array.isArray(v) ? v : []).map(id => (f.type_config?.options || []).find(o => o.id === id)?.label ?? id).join(', ');
    else if (f.type === 'date') v = dia(v);
    else if (f.type === 'users') v = (v || []).map(u => u.username).join(', ');
    else if (typeof v === 'object') v = JSON.stringify(v);
    console.log(`${f.name} (${f.type}, ${f.id}): ${v}`);
  }
} else if (cmd === 'comments') {
  const r = j(`/task/${rest[0]}/comment`);
  const cs = (r.comments || []).slice().reverse();
  if (!cs.length) console.log('sem comentários');
  for (const c of cs) console.log(`[${quando(c.date)}] ${c.user?.username || '?'} (${c.id}):\n${(c.comment_text || '').trim()}\n`);
} else if (cmd === 'list') {
  const st = opt('--status');
  let q = `/list/${rest[0]}/task?subtasks=true&include_closed=${fechadas}`;
  if (st) q += `&statuses[]=${encodeURIComponent(st)}`;
  const ts = paginas(q);
  console.log(`${ts.length} tarefas`);
  ts.forEach(t => console.log(linha(t) + (t.parent ? ' · sub de ' + t.parent : '')));
} else if (cmd === 'search') {
  const tasks = cache(fechadas ? 'todas' : 'abertas', 30 * 60e3, () => paginas(`/team/${WS}/task?subtasks=true&include_closed=${fechadas}`).filter(t => fechadas || !['closed', 'done'].includes(t.status?.type)).map(enxuta));
  const termos = rest.map(norm);
  const achou = tasks.filter(t => termos.every(x => norm(t.name).includes(x)));
  console.log(`${achou.length} de ${tasks.length} ${fechadas ? 'tarefas' : 'abertas'}`);
  achou.slice(0, 60).forEach(t => console.log(linha(t) + (t.parent ? ' · sub de ' + t.parent : '')));
} else if (cmd === 'hier') {
  const h = cache('hier', 24 * 3600e3, () => (j(`/team/${WS}/space?archived=false`).spaces || []).map(s => ({ id: s.id, name: s.name,
    folders: (j(`/space/${s.id}/folder?archived=false`).folders || []).map(f => ({ id: f.id, name: f.name, lists: (f.lists || []).map(l => ({ id: l.id, name: l.name })) })),
    lists: (j(`/space/${s.id}/list?archived=false`).lists || []).map(l => ({ id: l.id, name: l.name })) })));
  for (const s of h) {
    console.log(`${s.name} (${s.id})`);
    for (const l of s.lists) console.log(`  · ${l.name} (${l.id})`);
    for (const f of s.folders) { console.log(`  ▸ ${f.name} (${f.id})`); for (const l of f.lists) console.log(`      · ${l.name} (${l.id})`); }
  }
} else if (cmd === 'statuses') {
  const t = j(`/task/${rest[0]}`);
  const l = j(`/list/${t.list.id}`);
  console.log(l.statuses.map(s => `${s.status} (${s.type})`).join(' · '));
} else if (cmd === 'create') {
  const d = JSON.parse(stdin());
  const pri = { urgent: 1, high: 2, normal: 3, low: 4 }[d.priority] ?? 3;
  const body = { name: d.name, markdown_content: d.description || '', assignees: (d.assignees || []).map(Number), priority: pri, tags: d.tags || [] };
  if (d.parent) body.parent = d.parent;
  if (d.due) { body.due_date = new Date(d.due + 'T12:00:00-03:00').getTime(); body.due_date_time = false; }
  const t = j(`/list/${d.list || LISTA_PADRAO}/task`, { method: 'POST', body: JSON.stringify(body) });
  console.log(`criada: ${t.id} · ${t.name} · ${t.url}`);
} else if (cmd === 'setdesc') {
  const texto = stdin();
  if (!texto) falha('descrição vazia: nada foi alterado');
  j(`/task/${rest[0]}`, { method: 'PUT', body: JSON.stringify({ markdown_content: texto }) });
  console.log(`descrição atualizada: ${rest[0]} (${texto.length} caracteres)`);
} else if (cmd === 'comment') {
  const texto = stdin(), partes = [];
  let i = 0;
  for (const m of texto.matchAll(/\[@([^\]]+)\]\(#user_mention#(\d+)\)/g)) {
    if (m.index > i) partes.push({ text: texto.slice(i, m.index) });
    partes.push({ type: 'tag', user: { id: Number(m[2]) } });
    i = m.index + m[0].length;
  }
  if (i < texto.length) partes.push({ text: texto.slice(i) });
  const r = j(`/task/${rest[0]}/comment`, { method: 'POST', body: JSON.stringify({ comment: partes, notify_all: false }) });
  console.log(`comentado: ${rest[0]} · comentário ${r.id}`);
} else if (cmd === 'status') {
  const t = j(`/task/${rest[0]}`, { method: 'PUT', body: JSON.stringify({ status: rest.slice(1).join(' ') }) });
  console.log(`status: ${t.id} → ${t.status?.status}`);
} else if (cmd === 'due') {
  const body = rest[1] === 'limpar' ? { due_date: null } : { due_date: new Date(rest[1] + 'T12:00:00-03:00').getTime(), due_date_time: false };
  const t = j(`/task/${rest[0]}`, { method: 'PUT', body: JSON.stringify(body) });
  console.log(`prazo: ${t.id} → ${dia(t.due_date)}`);
} else if (cmd === 'assign') {
  const add = rest.slice(1).filter(x => !x.startsWith('-')).map(Number), rem = rest.slice(1).filter(x => x.startsWith('-')).map(x => Number(x.slice(1)));
  const t = j(`/task/${rest[0]}`, { method: 'PUT', body: JSON.stringify({ assignees: { add, rem } }) });
  console.log(`responsáveis: ${t.id} → ${(t.assignees || []).map(a => a.username).join(', ') || 'ninguém'}`);
} else if (cmd === 'tag') {
  j(`/task/${rest[0]}/tag/${encodeURIComponent(rest.slice(1).join(' '))}`, { method: 'POST', body: '{}' });
  console.log(`tag ${rest.slice(1).join(' ')}: ${rest[0]}`);
} else if (cmd === 'api') {
  const [m, p] = rest;
  if (!m || !p || !p.startsWith('/v')) falha('uso: api <GET|POST|PUT|DELETE> </v2/... | /v3/...> [< json]');
  const body = ['POST', 'PUT'].includes(m.toUpperCase()) && !process.stdin.isTTY ? stdin() : undefined;
  console.log(JSON.stringify(j(p, { method: m.toUpperCase(), body: body || undefined }), null, 2));
} else falha('comando desconhecido. Ver o cabeçalho do script.');
