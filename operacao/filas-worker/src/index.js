// Filas de aprovação e revisão no chat do ClickUp (mesma lógica de .claude/skills/fila-aprovacao/fila.mjs).
// Roda na Cloudflare por horário (wrangler.toml), seg-sex 10h e 16h30 de Brasília.
// Também roda o Farol de Clientes (src/farol.js): todo dia às 7h e, em até 1 minuto, sempre que uma peça do Calendário
// entra ou sai de "postado/subido" (webhook do ClickUp → marca no KV → cron de 1 min dispara a recontagem numa invocação própria).
// E a postagem automática a cada 1 min (src/postar.js).
// Segredos: CLICKUP_API_TOKEN (token do Francisco) e PREVIEW_CHAVE (só pra ver a prévia sem postar).

import { farol } from './farol.js';
import { cronPostar, webhookPostar, servirMidia, publicarUma } from './postar.js';

const WS = '90132863446';
const LISTAS = ['901325858184', '901325858587', '901325858360'];
const F_CLIENTE = '35443fa6-1e27-466f-9a6b-a2d132237079', F_POST = 'd4806a40-74c1-45fb-9c36-972aca497d00';
const MODOS = {
  aprovacao: { canal: '2ky5cpep-5553', status: 'disponível para aprovação', assignee: '158419961', semCapa: true,
    titulo: '📤 **Fila de aprovação', cheio: 'peças pra enviar', vazio: 'nada pra enviar agora.' },
  revisao: { canal: '2ky5cpep-5533', status: 'revisão de social media', assignee: '81994084', semCapa: false,
    titulo: '🔎 **Fila de revisão', cheio: 'peças pra revisar', vazio: 'nada pra revisar agora.' },
};
const tz = 'America/Sao_Paulo';
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dia = ms => new Date(Number(ms)).toLocaleDateString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit' });
const espera = ms => new Promise(r => setTimeout(r, ms));

// chamada à API com até 3 tentativas; o erro nunca leva o token
async function api(env, url, opts = {}) {
  let ultimo;
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(url, { ...opts, headers: { Authorization: env.CLICKUP_API_TOKEN, 'Content-Type': 'application/json' } });
      const txt = await r.text();
      if (r.ok) return JSON.parse(txt);
      ultimo = `HTTP ${r.status} ${txt.slice(0, 150)}`;
      if (r.status === 401 || r.status === 403) break; // token inválido: não adianta repetir
    } catch (e) { ultimo = String(e.message || e).slice(0, 150); }
    if (t < 3) await espera(15000);
  }
  throw new Error(ultimo);
}

async function montar(env, nome) {
  const M = MODOS[nome];
  const avisos = [];
  // trava: o status ainda existe nas listas de conteúdo?
  try {
    const listas = await Promise.all(LISTAS.map(l => api(env, `https://api.clickup.com/api/v2/list/${l}`)));
    const existe = listas.some(l => (l.statuses || []).some(s => norm(s.status) === norm(M.status)));
    if (!existe) avisos.push(`status "${M.status}" não existe mais nas listas de conteúdo (renomeado?)`);
  } catch (e) { avisos.push(`conferência do status: ${e.message}`); }

  let tasks = [];
  const vistos = new Set();
  let buscaFalhou = false;
  for (let p = 0; ; p++) {
    let r;
    try { r = await api(env, `https://api.clickup.com/api/v2/team/${WS}/task?statuses[]=${encodeURIComponent(M.status)}&subtasks=true&page=${p}`); }
    catch (e) { avisos.push(`busca, página ${p + 1}: ${e.message}`); buscaFalhou = true; break; }
    for (const t of r.tasks) if (!vistos.has(t.id)) { vistos.add(t.id); tasks.push(t); }
    if (r.last_page !== false || !r.tasks.length) break;
  }
  tasks = tasks.filter(t => (!M.semCapa || !norm(t.name).includes('capa')) && !/calendario editorial$/.test(norm(t.name).trim()));

  const hojeStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });
  const hoje0 = new Date(hojeStr + 'T00:00:00-03:00').getTime();
  const pecas = tasks.map(t => {
    const fc = (t.custom_fields || []).find(f => f.id === F_CLIENTE);
    const fp = (t.custom_fields || []).find(f => f.id === F_POST && f.value) || (t.custom_fields || []).find(f => /^data d[ea] postagem$/.test(norm(f.name || '').trim()) && f.value);
    let cliente = fc && fc.value != null ? (fc.type_config.options.find(o => o.orderindex == fc.value) || {}).name : null;
    if (!cliente) { const m = t.name.match(/^\s*\[([^\]]+)\]/); cliente = m ? m[1] : 'Sem cliente'; }
    if (!fc) avisos.push(`sem campo cliente: ${t.name.trim().slice(0, 60)}`);
    const extra = LISTAS.includes(t.list.id) ? '' : ` (lista: ${t.list.name})`;
    const ms = fp ? Number(fp.value) : null;
    const dias = ms ? Math.round((new Date(new Date(ms).toLocaleDateString('en-CA', { timeZone: tz }) + 'T00:00:00-03:00').getTime() - hoje0) / 864e5) : null;
    const quando = dias == null ? '' : dias < 0 ? ` · venceu há ${-dias} ${-dias === 1 ? 'dia' : 'dias'}` : dias === 0 ? ' · hoje' : dias === 1 ? ' · amanhã' : ` · em ${dias} dias`;
    const urg = ms && Number(ms) < hoje0 + 3 * 864e5;
    return { cliente, nome: t.name.replace(/\s+/g, ' ').trim(), url: t.url, ms, rot: (ms ? `posta ${dia(ms)}${quando}` : '⚠️ sem data de postagem') + extra, urg };
  });

  const ord = (a, b) => (a.ms ?? 9e15) - (b.ms ?? 9e15);
  const agora = new Date().toLocaleString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
  let out = `${M.titulo} · ${agora}** · ` + (pecas.length ? `${pecas.length} ${M.cheio}` : (buscaFalhou ? '⚠️ busca falhou, a lista pode estar incompleta' : M.vazio));
  const urg = pecas.filter(p => p.urg).sort(ord);
  if (urg.length) out += `\n\n**⚠️ Postagem vencida ou em até 2 dias**\n` + urg.map(p => `- ${p.cliente} · [${p.nome}](${p.url}) · ${p.rot}`).join('\n');
  const grupos = {};
  pecas.filter(p => !p.urg).forEach(p => (grupos[p.cliente] ||= []).push(p));
  for (const c of Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'pt-BR')))
    out += `\n\n**${c}** (${grupos[c].length})\n` + grupos[c].sort(ord).map(p => `- [${p.nome}](${p.url}) · ${p.rot}`).join('\n');
  if (avisos.length) out += `\n\n**⚠️ Não consegui ler**\n` + avisos.map(a => `- ${a}`).join('\n');
  return out;
}

async function postar(env, nome, texto) {
  const M = MODOS[nome];
  return api(env, `https://api.clickup.com/api/v3/workspaces/${WS}/chat/channels/${M.canal}/messages`,
    { method: 'POST', body: JSON.stringify({ type: 'message', content: texto, content_format: 'text/md', assignee: M.assignee }) });
}

async function rodar(env, nome) {
  try {
    await postar(env, nome, await montar(env, nome));
    console.log(`fila ${nome}: postada`);
  } catch (e) {
    console.error(`fila ${nome}: falhou · ${e.message}`);
    // última tentativa: avisar no próprio canal que a fila não rodou
    try { await postar(env, nome, `⚠️ **Fila não rodou** · ${new Date().toLocaleString('pt-BR', { timeZone: tz })}\nMotivo: ${e.message}`); }
    catch (e2) { console.error(`aviso de falha também não saiu · ${e2.message}`); }
  }
}

// ---------- Farol em tempo quase real ----------
const STATUS_POSTADO = 'postado/subido';
// roda o Farol numa invocação própria (no plano grátis cada invocação tem 50 subrequisições, e o Farol pode usar até 45)
async function dispararFarol(env) {
  if (!env.WORKER_URL || !env.PREVIEW_CHAVE || !env.SELF) return farol(env, api);
  const r = await env.SELF.fetch(`${env.WORKER_URL.replace(/\/$/, '')}/?farol=1`, { headers: { 'x-chave': env.PREVIEW_CHAVE } });
  if (!r.ok) throw new Error(`farol: HTTP ${r.status}`);
  return r.json();
}
// uma recontagem por vez: o lock dura 60 s; o que mudar enquanto ela roda fica marcado como pendente e o cron de 1 min repesca
async function recontarFarol(env) {
  await env.POSTAR.put('farol:lock', '1', { expirationTtl: 60 });
  await env.POSTAR.delete('farol:pendente');
  const avisos = await dispararFarol(env);
  if (avisos && avisos.length) console.error(`farol (status): ${avisos.join(' · ')}`);
}
// chamado pelo webhook do ClickUp a cada mudança de status no Calendário Editorial
async function pedirFarol(env, antes, depois) {
  if (antes !== STATUS_POSTADO && depois !== STATUS_POSTADO) return;
  await env.POSTAR.put('farol:pendente', '1', { expirationTtl: 3600 });
  if (await env.POSTAR.get('farol:lock')) return;
  await recontarFarol(env);
}

export default {
  async scheduled(evento, env, ctx) {
    if (evento.cron === '* * * * *') {
      ctx.waitUntil(cronPostar(env, api, texto => postar(env, 'aprovacao', texto)).catch(e => console.error(`postagem: ${e.message}`)));
      // Farol pendente (status mudou e a recontagem não saiu na hora, ou mudou durante a anterior)
      ctx.waitUntil((async () => {
        if (await env.POSTAR.get('farol:pendente') && !(await env.POSTAR.get('farol:lock'))) await recontarFarol(env);
      })().catch(e => console.error(`farol pendente: ${e.message}`)));
      return;
    }
    if (evento.cron === '0 10 * * *') {
      ctx.waitUntil((async () => {
        const avisos = await farol(env, api);
        if (avisos.length) {
          try { await postar(env, 'aprovacao', `⚠️ **Farol de Clientes não atualizou direito** · ${new Date().toLocaleString('pt-BR', { timeZone: tz })}\n` + avisos.map(a => `- ${a}`).join('\n')); }
          catch (e) { console.error(`aviso do farol não saiu · ${e.message}`); }
        }
      })());
      return;
    }
    ctx.waitUntil((async () => { await rodar(env, 'aprovacao'); await rodar(env, 'revisao'); })());
  },
  // prévia sem postar, só com a chave: GET /?modo=revisao  (cabeçalho x-chave)
  async fetch(req, env, ctx) {
    // webhook do ClickUp (status -> "agendamento de postagem"): assinado com CLICKUP_WEBHOOK_SECRET
    if (req.method === 'POST' && new URL(req.url).pathname === '/webhook/clickup') return webhookPostar(req, env, api, ctx, (antes, depois) => pedirFarol(env, antes, depois));
    // arte da peça servida do Drive (URL secreta por peça, morre com o post)
    if (req.method === 'GET' && new URL(req.url).pathname.startsWith('/midia/')) return servirMidia(req, env);
    // publicação de uma peça (disparada pelo próprio cron, uma invocação por peça)
    if (req.method === 'POST' && new URL(req.url).pathname === '/publicar') return publicarUma(req, env, api, texto => postar(env, 'aprovacao', texto), ctx);
    if (!env.PREVIEW_CHAVE || req.headers.get('x-chave') !== env.PREVIEW_CHAVE) return new Response('não encontrado', { status: 404 });
    const q = new URL(req.url).searchParams;
    const modo = q.get('modo') === 'revisao' ? 'revisao' : 'aprovacao';
    // teste de postagem ponta a ponta no canal "Fila de Aprovação (antigo)", onde só o Francisco está
    if (q.get('teste') === '1') {
      const r = await api(env, `https://api.clickup.com/api/v3/workspaces/${WS}/chat/channels/2ky5cpep-5513/messages`,
        { method: 'POST', body: JSON.stringify({ type: 'message', content: '🧪 TESTE Cloudflare\n\n' + await montar(env, modo), content_format: 'text/md' }) });
      return new Response('postado no canal de teste: ' + ((r.data || r).id || 'sem id'));
    }
    if (q.get('postar') === '1') { await cronPostar(env, api, null); return new Response('postagem: rodou'); }
    if (q.get('farol') === '1') return new Response(JSON.stringify(await farol(env, api)), { headers: { 'content-type': 'application/json' } });
    return new Response(await montar(env, modo), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};
