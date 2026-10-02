// Plano B da /fila-aprovacao quando o conector ClickUp bate o limite. Lê CLICKUP_API_TOKEN do .env (fora do git).
// Na nuvem a chave vem da variável de ambiente CLICKUP_API_TOKEN da rotina.
// uso, na raiz do repo: node .claude/skills/fila-aprovacao/fila.mjs [revisao] [postar]
import fs from 'node:fs';
const envFile = process.env.ENVFILE || '.env';
const env = !fs.existsSync(envFile) ? {} : Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const H = { Authorization: process.env.CLICKUP_API_TOKEN || env.CLICKUP_API_TOKEN, 'Content-Type': 'application/json' };
const REV = process.argv.includes('revisao');
const WS = '90132863446', CANAL = REV ? '2ky5cpep-5533' : '2ky5cpep-5553';
const STATUS = REV ? 'revisão de social media' : 'disponível para aprovação', ASSIGNEE = REV ? '81994084' : '158419961';
const LISTAS = ['901325858184', '901325858587', '901325858360'];
const F_CLIENTE = '35443fa6-1e27-466f-9a6b-a2d132237079', F_POST = 'd4806a40-74c1-45fb-9c36-972aca497d00';
import { execFileSync } from 'node:child_process';
const j = async (u, o = {}) => {
  const a = ['-sS', '--fail-with-body', '-H', `Authorization: ${H.Authorization}`, '-H', 'Content-Type: application/json'];
  if (o.method) a.push('-X', o.method);
  if (o.body) a.push('--data-binary', '@-');
  // erro nunca repete o comando (ele leva o token)
  try { return JSON.parse(execFileSync('curl', [...a, u], { input: o.body, encoding: 'utf8', maxBuffer: 64e6, stdio: ['pipe', 'pipe', 'pipe'] })); }
  catch (e) { throw new Error(`curl saiu com código ${e.status} · ${String(e.stderr || '').trim()} · ${String(e.stdout || '').slice(0, 300)}`.split(H.Authorization).join('***')); }
};
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const tz = 'America/Sao_Paulo';
const dia = ms => new Date(Number(ms)).toLocaleDateString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit' });
const hojeStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });
const hoje0 = new Date(hojeStr + 'T00:00:00-03:00').getTime();

const canal = await j(`https://api.clickup.com/api/v3/workspaces/${WS}/chat/channels/${CANAL}`);
console.error('canal:', (canal.data || canal).name);

let tasks = [];
const avisos = [];
const vistos = new Set();
for (let p = 0; ; p++) {
  let r;
  try { r = await j(`https://api.clickup.com/api/v2/team/${WS}/task?statuses[]=${encodeURIComponent(STATUS)}&subtasks=true&page=${p}`); }
  catch (e) { avisos.push(`busca, página ${p + 1}: ${String(e.message).slice(0, 120)}`); break; }
  for (const t of r.tasks) if (!vistos.has(t.id)) { vistos.add(t.id); tasks.push(t); }
  if (r.last_page !== false || !r.tasks.length) break;
}
const total = tasks.length;
tasks = tasks.filter(t => (REV || !norm(t.name).includes('capa')) && !/calendario editorial$/.test(norm(t.name).trim()));
const pecas = tasks.map(t => {
  const fc = t.custom_fields.find(f => f.id === F_CLIENTE), fp = t.custom_fields.find(f => f.id === F_POST);
  let cliente = fc && fc.value != null ? (fc.type_config.options.find(o => o.orderindex == fc.value) || {}).name : null;
  if (!cliente) { const m = t.name.match(/^\s*\[([^\]]+)\]/); cliente = m ? m[1] : 'Sem cliente'; }
  if (!fc) avisos.push(`sem campo cliente: ${t.name.trim().slice(0, 60)}`);
  const extra = LISTAS.includes(t.list.id) ? "" : ` (lista: ${t.list.name})`;
  let ms = fp && fp.value ? fp.value : t.due_date, tipo = fp && fp.value ? 'posta' : (t.due_date ? 'prazo' : null);
  const urg = ms && Number(ms) < hoje0 + 3 * 864e5;
  return { cliente, nome: t.name.trim(), url: t.url, ms: ms ? Number(ms) : null, rot: (tipo ? `${tipo} ${dia(ms)}` : 'sem data') + extra, urg };
});
const ord = (a, b) => (a.ms ?? 9e15) - (b.ms ?? 9e15);
const agora = new Date().toLocaleString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
let out = REV ? `🔎 **Fila de revisão · ${agora}** · ${pecas.length ? pecas.length + ' peças pra revisar' : 'nada pra revisar agora.'}` : `📤 **Fila de aprovação · ${agora}** · ${pecas.length ? pecas.length + ' peças pra enviar' : 'nada pra enviar agora.'}`;
const urg = pecas.filter(p => p.urg).sort(ord);
if (urg.length) out += `\n\n**⚠️ Postagem vencida ou em até 2 dias**\n` + urg.map(p => `- ${p.cliente} · [${p.nome}](${p.url}) · ${p.rot}`).join('\n');
const grupos = {};
pecas.filter(p => !p.urg).forEach(p => (grupos[p.cliente] ||= []).push(p));
for (const c of Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'pt-BR')))
  out += `\n\n**${c}** (${grupos[c].length})\n` + grupos[c].sort(ord).map(p => `- [${p.nome}](${p.url}) · ${p.rot}`).join('\n');
if (avisos.length) { if (!pecas.length) out = out.replace(/ · nada pra .*$/, ' · ⚠️ busca falhou, a lista pode estar incompleta'); out += `\n\n**⚠️ Não consegui ler**\n` + avisos.map(a => `- ${a}`).join('\n'); }
console.error(`lidas ${total}, capas/contêineres fora ${total - pecas.length}`);
console.log(out);
if (process.argv.includes('postar')) {
  const r = await j(`https://api.clickup.com/api/v3/workspaces/${WS}/chat/channels/${CANAL}/messages`, { method: 'POST', body: JSON.stringify({ type: 'message', content: out, content_format: 'text/md', assignee: ASSIGNEE }) });
  console.error('postado:', (r.data || r).id || JSON.stringify(r).slice(0, 200));
}
