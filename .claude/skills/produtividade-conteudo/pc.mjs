// Coletor da /produtividade-conteudo pela API direta do ClickUp (fora do limite de 1.000 chamadas/dia do conector).
// Token: variável de ambiente CLICKUP_API_TOKEN (nuvem) ou o .env da raiz (este computador). Nunca imprime o token.
// Uso, na raiz do repo:
//   node .claude/skills/produtividade-conteudo/pc.mjs check
//   node .claude/skills/produtividade-conteudo/pc.mjs coletar <AAAA-MM-DD> > coleta.json   peças das 3 listas atualizadas desde a data
//   node .claude/skills/produtividade-conteudo/pc.mjs sql < coleta.json > lote.sql          SQL de gravação (upsert de peças, insert de eventos)
// O SQL sai em blocos separados por uma linha "-- LOTE"; cada bloco vai numa chamada do execute_sql do Supabase.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const envFile = process.env.ENVFILE || '.env';
const env = !fs.existsSync(envFile) ? {} : Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const TOKEN = process.env.CLICKUP_API_TOKEN || env.CLICKUP_API_TOKEN;
const WS = '90132863446', API = 'https://api.clickup.com/api/v2';
const LISTAS = { '901325858184': 'Calendário Editorial', '901325858587': 'Lince & Co. (Cliente 00)', '901325858360': 'Peças de Design' };
const P = { Pamela: 284651027, Mateus: 118126212, Francisco: 158419961, Giovanna: 284462463 };
const CAMPO_CLIENTE = '35443fa6-1e27-466f-9a6b-a2d132237079';
const falha = m => { console.error('ERRO: ' + String(m).split(TOKEN || '\u0000').join('***')); process.exit(1); };
if (!TOKEN) falha('CLICKUP_API_TOKEN ausente (nem variável de ambiente, nem .env)');

// a API aceita 100 chamadas por minuto por token: espaça as chamadas e repete uma vez em 429
const pausa = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
let ultima = 0;
const j = (u, tentativa = 0) => {
  const espera = 650 - (Date.now() - ultima); if (espera > 0) pausa(espera);
  ultima = Date.now();
  let out;
  try {
    out = execFileSync('curl', ['-sS', '--max-time', '60', '-w', '\n%{http_code}', '-H', `Authorization: ${TOKEN}`, API + u], { encoding: 'utf8', maxBuffer: 64e6, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) { falha(`GET ${u}: curl saiu com código ${e.status} · ${String(e.stderr || '').trim()}`); }
  const i = out.lastIndexOf('\n'), corpo = out.slice(0, i), cod = Number(out.slice(i + 1));
  if (cod === 429 && tentativa < 2) { pausa(30000); return j(u, tentativa + 1); }
  if (cod >= 400) falha(`GET ${u}: HTTP ${cod} · ${corpo.slice(0, 200)}`);
  return JSON.parse(corpo);
};

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function tipoDe(nome, lista) {
  const n = norm(nome);
  if (/^\W*capa\b/.test(n)) return 'capa'; // "CAPA - Vídeo 01" é a capa (design), não o vídeo
  if (/\broteiro\b/.test(n)) return 'roteiro';
  if (/\bcorte\b/.test(n)) return 'corte';
  if (/\b(reels?|rells|video|extracao|pergunta extra|sessao)\b/.test(n)) return 'reels';
  if (/\bcarrossel\b/.test(n)) return 'carrossel';
  if (/\bcard\b/.test(n)) return 'card';
  if (/\bcapa\b/.test(n)) return 'capa';
  if (/\b(estatico|post)\b/.test(n)) return 'estatico';
  if (/\bcaixinha\b/.test(n)) return 'caixinha';
  if (/\b(logotipo|logo|guia|comunicado|folder|cartao|jogo americano)\b/.test(n) || lista === '901325858360') return 'design';
  return 'outro';
}
const DESIGN = new Set(['carrossel', 'card', 'capa', 'estatico', 'design']);
const VIDEO = new Set(['reels', 'corte', 'roteiro']);

// "repassado" do Francisco marca o Victor (decisão do Francisco, 2026-10-08), salvo se o mesmo comentário fala do Mateus ou da Pâmela
const repassadoVictor = comentarios => comentarios.some(c => c.user === P.Francisco &&
  (/\brepassad[oa]\b/.test(norm(c.texto)) || /\bvh\b/.test(norm(c.texto)) || /\bvictor\b/.test(norm(c.texto))) &&
  !/\b(mateus|pamela)\b/.test(norm(c.texto)));

function atribuir(t, tipo, comentarios, chegouRevisao) {
  const ids = new Set([...(t.watchers || []), ...(t.assignees || [])].map(x => x.id));
  const pam = ids.has(P.Pamela), mat = ids.has(P.Mateus) || comentarios.some(c => c.user === P.Mateus);
  if (!DESIGN.has(tipo) && repassadoVictor(comentarios)) return ['Victor', 'repassado'];
  if (pam && !mat && !VIDEO.has(tipo)) return ['Pamela', 'watcher'];
  if (mat && !pam && !DESIGN.has(tipo)) return ['Mateus', ids.has(P.Mateus) ? 'watcher' : 'comentario'];
  if (pam && mat) return DESIGN.has(tipo) ? ['Pamela', 'tipo'] : VIDEO.has(tipo) ? ['Mateus', 'tipo'] : ['outro', 'tipo'];
  if (!pam && !mat && VIDEO.has(tipo) && tipo !== 'roteiro' && chegouRevisao) {
    if (/\b(enviad[oa]s?|bruto|avaliar)\b/.test(norm(t.name))) return ['outro', 'video-cliente'];
    return ['Victor', 'sem-mateus'];
  }
  if (ids.has(P.Giovanna)) return ['outro', 'giovanna'];
  return ['outro', 'sem-regra'];
}

function clienteDe(t) {
  const f = (t.custom_fields || []).find(c => c.id === CAMPO_CLIENTE);
  if (f && f.value !== undefined && f.value !== null) {
    const op = (f.type_config?.options || []).find(o => o.orderindex === Number(f.value) || o.id === f.value);
    if (op) return op.name;
  }
  if (t.list?.id === '901325858587') return 'Lince & Co.';
  const m = String(t.name).match(/^\s*\[([^\]]+)\]/);
  return m ? m[1].trim() : null;
}

function eventosDe(tis) {
  const hist = [...(tis.status_history || [])];
  if (tis.current_status && !hist.some(h => norm(h.status) === norm(tis.current_status.status))) hist.push(tis.current_status);
  const since = s => Number(s?.total_time?.since || s?.since || 0);
  const por = {}; for (const h of hist) por[norm(h.status)] = since(h);
  const ev = [];
  const add = (evento, ms) => { if (ms) ev.push({ evento, ms }); };
  add('entrega_revisao', por['revisao de social media']);
  add('aprovado_sm', por['disponivel para aprovacao']);
  add('enviado_cliente', por['enviado para aprovacao']);
  add('aprovado_cliente', por['agendamento de postagem']);
  add('alteracao_interna', por['alteracao interna']);
  add('alteracao_cliente', por['alteracao do cliente'] || por['alteracao cliente']);
  const velha = por['alteracao necessaria'];
  if (velha) add(por['enviado para aprovacao'] && por['enviado para aprovacao'] < velha ? 'alteracao_cliente' : 'alteracao_interna', velha);
  return { ev, statuses: Object.keys(por) };
}

const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'check') {
  console.log('ok: API do ClickUp respondendo como ' + j('/user').user.username);
} else if (cmd === 'coletar') {
  const desde = args[0] ? new Date(args[0] + 'T00:00:00-03:00').getTime() : Date.now() - 3 * 864e5;
  const listas = Object.keys(LISTAS).map(l => `list_ids[]=${l}`).join('&');
  const tarefas = [];
  for (let p = 0; p < 50; p++) {
    const r = j(`/team/${WS}/task?${listas}&subtasks=true&include_closed=true&order_by=updated&date_updated_gt=${desde}&page=${p}`);
    tarefas.push(...(r.tasks || []));
    if (!r.tasks?.length || r.last_page) break;
  }
  const pecas = tarefas.filter(t => !/calend[aá]rio editorial/i.test(t.name) && !/^\W*teste\b/.test(norm(t.name))); // tarefas de teste ("TESTE ...") não são produção
  const tis = {};
  for (let i = 0; i < pecas.length; i += 100) {
    const ids = pecas.slice(i, i + 100).map(t => `task_ids=${t.id}`).join('&');
    Object.assign(tis, j(`/task/bulk_time_in_status/task_ids?${ids}`));
  }
  const saida = { desde: new Date(desde).toISOString(), coletado_em: new Date().toISOString(), pecas: [], eventos: [], status_vistos: {} };
  for (const t0 of pecas) {
    const t = j(`/task/${t0.id}`); // watchers e campos personalizados
    const tipo = tipoDe(t.name, t.list?.id);
    const { ev, statuses } = eventosDe(tis[t.id] || {});
    for (const s of statuses) saida.status_vistos[s] = (saida.status_vistos[s] || 0) + 1;
    const chegouRevisao = ev.some(e => e.evento === 'entrega_revisao');
    let comentarios = [];
    if (!DESIGN.has(tipo)) comentarios = (j(`/task/${t.id}/comment`).comments || []).map(c => ({ user: c.user?.id, texto: c.comment_text || '' }));
    const [produtor, atribuicao] = atribuir(t, tipo, comentarios, chegouRevisao);
    saida.pecas.push({ task_id: t.id, nome: t.name.trim(), lista: LISTAS[t.list?.id] || t.list?.name || null, cliente: clienteDe(t), tipo, produtor, atribuicao, status_atual: t.status?.status || null, url: t.url });
    for (const e of ev) saida.eventos.push({ task_id: t.id, evento: e.evento, ocorrido_em: new Date(e.ms).toISOString(), produtor });
  }
  process.stdout.write(JSON.stringify(saida));
} else if (cmd === 'sql') {
  const c = JSON.parse(fs.readFileSync(0, 'utf8'));
  const q = v => v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
  const blocos = [];
  for (let i = 0; i < c.pecas.length; i += 80) {
    const v = c.pecas.slice(i, i + 80).map(p => `(${[p.task_id, p.nome, p.lista, p.cliente, p.tipo, p.produtor, p.atribuicao, p.status_atual, p.url].map(q).join(',')},now())`).join(',\n');
    blocos.push(`insert into produtividade.pecas (task_id,nome,lista,cliente,tipo,produtor,atribuicao,status_atual,url,atualizado_em) values\n${v}\non conflict (task_id) do update set nome=excluded.nome, lista=excluded.lista, cliente=coalesce(excluded.cliente, produtividade.pecas.cliente), tipo=excluded.tipo, produtor=excluded.produtor, atribuicao=excluded.atribuicao, status_atual=excluded.status_atual, url=excluded.url, atualizado_em=now();`);
  }
  for (let i = 0; i < c.eventos.length; i += 150) {
    const v = c.eventos.slice(i, i + 150).map(e => `(${q(e.task_id)},${q(e.evento)},${q(e.ocorrido_em)}::timestamptz,${q(e.produtor)},'foto')`).join(',\n');
    blocos.push(`insert into produtividade.eventos (task_id,evento,ocorrido_em,produtor,origem) values\n${v}\non conflict do nothing;`);
  }
  blocos.push(`update produtividade.eventos e set produtor = p.produtor from produtividade.pecas p where p.task_id = e.task_id and e.produtor is distinct from p.produtor;`);
  process.stdout.write(blocos.join('\n-- LOTE\n') + '\n');
} else {
  falha('comando desconhecido. Use: check | coletar <AAAA-MM-DD> | sql');
}
