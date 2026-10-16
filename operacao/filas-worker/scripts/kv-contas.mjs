// Monta as entradas conta:<cliente> do KV a partir de contas.json (cliente -> @) e contas-meta.json (@ -> token)
// e sobe pro KV do Worker com o wrangler (precisa do id do namespace POSTAR no wrangler.toml).
//   node operacao/filas-worker/scripts/kv-contas.mjs            só mostra o que subiria (sem token)
//   node operacao/filas-worker/scripts/kv-contas.mjs --subir    grava no KV
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const dir = 'operacao/filas-worker';
const mapa = JSON.parse(readFileSync(`${dir}/contas.json`, 'utf8'));
const meta = JSON.parse(readFileSync(`${dir}/contas-meta.json`, 'utf8'));
const subir = process.argv.includes('--subir');
const ig = u => { const c = meta[u]; if (!c) throw new Error(`@${u} não está em contas-meta.json (roda meta-contas.mjs --kv de novo)`); return c.instagram; };

const entradas = [];
for (const [cliente, cfg] of Object.entries(mapa)) {
  if (cliente.startsWith('_')) continue;
  const conta = {};
  if (typeof cfg.instagram === 'string') conta.instagram = ig(cfg.instagram);
  else if (Array.isArray(cfg.instagram)) conta.instagram = cfg.instagram.map(x => ({ ...ig(x.conta), se: x.se, usuario: x.conta }));
  if (cfg.gmn) conta.gmn = { location: cfg.gmn };
  if (cfg.tiktok) conta.tiktok = cfg.tiktok;
  entradas.push({ chave: `conta:${cliente}`, valor: conta });
  const resumo = Array.isArray(conta.instagram) ? conta.instagram.map(x => `@${x.usuario}${x.se ? ` (se "${x.se}")` : ' (padrão)'}`).join(' · ') : conta.instagram ? `@${cfg.instagram}` : '-';
  console.log(`- ${cliente}: instagram ${resumo}${conta.gmn ? ' · gmn ok' : ''}${conta.tiktok ? ' · tiktok ok' : ''}`);
}
if (!subir) { console.log(`\n${entradas.length} clientes. Pra gravar no KV: --subir`); process.exit(0); }

mkdirSync(`${dir}/.tmp`, { recursive: true });
const arq = `${dir}/.tmp/kv.json`;
writeFileSync(arq, JSON.stringify(entradas.map(e => ({ key: e.chave, value: JSON.stringify(e.valor) }))));
try {
  execFileSync('npx', ['wrangler', 'kv', 'bulk', 'put', '.tmp/kv.json', '--binding', 'POSTAR', '--remote'], { cwd: dir, stdio: 'inherit', shell: true });
  console.log(`${entradas.length} entradas gravadas no KV`);
} finally { writeFileSync(arq, ''); }
