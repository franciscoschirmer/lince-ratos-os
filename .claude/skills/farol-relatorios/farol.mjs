// Apoio da /farol-relatorios: fala com o ClickUp pela API direta (token em CLICKUP_API_TOKEN, no ambiente ou no .env da raiz).
// O erro nunca repete o token.
//   node .claude/skills/farol-relatorios/farol.mjs relatorios            lista as tarefas [RELATÓRIO] com o último comentário e o que ele traz
//   node .claude/skills/farol-relatorios/farol.mjs baixar <task> <pasta>  baixa os anexos (PDF) dos 3 últimos comentários
//   node .claude/skills/farol-relatorios/farol.mjs linhas <Mmm/aa>        linhas do Farol daquele mês (id, cliente, conversão, leads, conversas, agendamentos)
//   node .claude/skills/farol-relatorios/farol.mjs gravar <task>         grava campos; JSON no stdin: {"Leads":144,"Conversas iniciadas":null,"Agendamentos":31,"Observação":"..."}
//   node .claude/skills/farol-relatorios/farol.mjs comentar <task>       comenta na linha (texto no stdin)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const envFile = fs.existsSync('.env') ? Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])) : {};
const TOKEN = process.env.CLICKUP_API_TOKEN || envFile.CLICKUP_API_TOKEN;
if (!TOKEN) { console.log('ERRO: CLICKUP_API_TOKEN ausente'); process.exit(1); }
const L_FAROL = '901329216299', L_CAMP = '901325858404';
const j = (path, method, body) => {
  const a = ['-sS', '-H', `Authorization: ${TOKEN}`, '-H', 'Content-Type: application/json'];
  if (method) a.push('-X', method);
  if (body) a.push('--data-binary', '@-');
  try {
    const out = execFileSync('curl', [...a, 'https://api.clickup.com/api/v2' + path], { input: body ? JSON.stringify(body) : undefined, encoding: 'utf8', maxBuffer: 6e7, stdio: ['pipe', 'pipe', 'pipe'] });
    const r = JSON.parse(out || '{}'); if (r.err) throw new Error(r.err); return r;
  } catch (e) { console.log(`ERRO: ${method || 'GET'} ${path}: ${String(e.message).split(TOKEN).join('***').slice(0, 200)}`); process.exit(1); }
};
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const [cmd, ...args] = process.argv.slice(2);
const campos = () => j(`/list/${L_FAROL}/field`).fields;

if (cmd === 'relatorios') {
  const ts = j(`/list/${L_CAMP}/task?include_closed=true&subtasks=true`).tasks.filter(t => /^\[RELAT[OÓ]RIO\]/i.test(t.name));
  for (const t of ts) {
    const cs = j(`/task/${t.id}/comment`).comments;
    const c = cs[0];
    const anexos = c ? c.comment.filter(x => x.type === 'attachment').map(x => x.attachment.title) : [];
    const links = c ? (c.comment_text.match(/(docs|drive)\.google\.com\/\S+/g) || []) : [];
    console.log(`${t.id} · ${t.name.replace(/^\[RELAT[OÓ]RIO\]\s*Relatório Semanal de Performance\s*-\s*/i, '')} · ${t.status.status} · último comentário: ${c ? new Date(Number(c.date)).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'nenhum'} · "${c ? c.comment_text.replace(/\s+/g, ' ').slice(0, 80) : ''}" · anexos: ${anexos.join(', ') || '-'} · links: ${links.join(' ') || '-'}`);
  }
} else if (cmd === 'baixar') {
  const [task, pasta] = args; fs.mkdirSync(pasta, { recursive: true });
  for (const c of j(`/task/${task}/comment`).comments.slice(0, 3))
    for (const x of c.comment.filter(x => x.type === 'attachment')) {
      const dest = `${pasta}/${c.id}-${x.attachment.title}`;
      try {
        execFileSync('curl', ['-sS', '-L', '-o', dest, '-H', `Authorization: ${TOKEN}`, x.attachment.url], { stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (e) {
        console.log(`ERRO: não baixou ${x.attachment.title}: ${String(e.stderr || e.message).split(TOKEN).join('***').trim().slice(0, 200)}`);
        process.exit(1);
      }
      console.log(`baixado: ${dest} (comentário de ${new Date(Number(c.date)).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}: "${c.comment_text.replace(/\s+/g, ' ').slice(0, 60)}")`);
    }
} else if (cmd === 'linhas') {
  const F = campos(); const f = n => F.find(x => x.name === n);
  const val = (t, n) => { const c = t.custom_fields.find(x => x.id === f(n).id); if (!c || c.value == null) return null; if (f(n).type === 'drop_down') return (f(n).type_config.options.find(o => o.orderindex == c.value) || {}).name; return c.value; };
  for (let p = 0; ; p++) {
    const r = j(`/list/${L_FAROL}/task?include_closed=true&page=${p}`);
    for (const t of r.tasks) if (val(t, 'Mês') === args[0])
      console.log(`${t.id} · ${val(t, '👔 Clientes')} · conversão: ${val(t, 'O que é conversão') || '(não definida)'} · leads ${val(t, 'Leads') ?? '-'} · conversas ${val(t, 'Conversas iniciadas') ?? '-'} · agendamentos ${val(t, 'Agendamentos') ?? '-'} · obs: ${val(t, 'Observação') || '-'}`);
    if (r.last_page !== false || !r.tasks.length) break;
  }
} else if (cmd === 'gravar') {
  const F = campos(); const dados = JSON.parse(fs.readFileSync(0, 'utf8'));
  for (const [n, v] of Object.entries(dados)) {
    if (v == null) continue;
    const f = F.find(x => x.name === n); if (!f) { console.log(`ERRO: campo ${n} não existe`); process.exit(1); }
    j(`/task/${args[0]}/field/${f.id}`, 'POST', { value: v });
  }
  console.log(`gravado: ${args[0]} · ${JSON.stringify(dados)}`);
} else if (cmd === 'comentar') {
  j(`/task/${args[0]}/comment`, 'POST', { comment_text: fs.readFileSync(0, 'utf8'), notify_all: false });
  console.log(`comentado: ${args[0]}`);
} else console.log('uso: relatorios | baixar <task> <pasta> | linhas <Mmm/aa> | gravar <task> | comentar <task>');
