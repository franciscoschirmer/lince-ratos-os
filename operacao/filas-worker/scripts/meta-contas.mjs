// Troca o token de usuário do Meta (curto, do Graph API Explorer) por um de longa duração e lista as
// Páginas com Instagram que a Lince administra, com o token de página de cada uma (não vence).
// Lê do .env da raiz: META_APP_ID, META_APP_SECRET, META_USER_TOKEN. Nunca imprime token inteiro.
//   node operacao/filas-worker/scripts/meta-contas.mjs            lista as contas
//   node operacao/filas-worker/scripts/meta-contas.mjs --kv       grava operacao/filas-worker/contas-meta.json (fora do git) pra subir no KV
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
for (const k of ['META_APP_ID', 'META_APP_SECRET', 'META_USER_TOKEN']) if (!env[k]) { console.error(`falta ${k} no .env`); process.exit(1); }
const mascarar = s => String(s).replace(new RegExp([env.META_USER_TOKEN, env.META_APP_SECRET].join('|'), 'g'), '***');
const get = url => { // o Node daqui só sai pra internet via curl
  const txt = execFileSync('curl', ['-sS', '-g', url], { encoding: 'utf8' });
  const j = JSON.parse(txt);
  if (j.error) throw new Error(mascarar(j.error.message || JSON.stringify(j.error)));
  return j;
};
const G = 'https://graph.facebook.com/v21.0';

try {
  const longo = get(`${G}/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${env.META_USER_TOKEN}`).access_token;
  console.log('token de usuário trocado por um de longa duração (60 dias); os tokens de página gerados dele não vencem');
  const contas = {};
  let url = `${G}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${longo}`;
  while (url) {
    const r = get(url);
    for (const p of r.data) {
      const ig = p.instagram_business_account;
      console.log(`- Página "${p.name}" · Instagram: ${ig ? '@' + ig.username + ' (' + ig.id + ')' : 'nenhum ligado'}`);
      if (ig) contas[ig.username] = { pagina: p.name, instagram: { ig_user_id: ig.id, token: p.access_token } };
    }
    url = r.paging && r.paging.next;
  }
  console.log(`\n${Object.keys(contas).length} contas de Instagram alcançáveis.`);
  if (process.argv.includes('--kv')) {
    writeFileSync('operacao/filas-worker/contas-meta.json', JSON.stringify(contas, null, 2));
    console.log('gravado em operacao/filas-worker/contas-meta.json (tem token: fica fora do git)');
  }
} catch (e) { console.error('ERRO:', mascarar(e.message)); process.exit(1); }
