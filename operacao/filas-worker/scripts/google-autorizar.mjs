// Autoriza a conta operacional@ uma vez (Drive leitura + Business Profile) e guarda o refresh token no .env.
// Lê do .env: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET (credencial OAuth tipo "app para computador").
//   node operacao/filas-worker/scripts/google-autorizar.mjs
// Abre o link no navegador, entra com operacional@linceco.com.br, aceita, e o script recebe o código sozinho.
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
const postForm = async (url, dados) => (await fetch(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(dados) })).json();
const getJson = async (url, token) => (await fetch(url, { headers: { Authorization: 'Bearer ' + token } })).text();

const raw = readFileSync('.env', 'utf8');
const env = Object.fromEntries(raw.split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
for (const k of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) if (!env[k]) { console.error(`falta ${k} no .env`); process.exit(1); }

const PORTA = 8765, REDIRECT = `http://localhost:${PORTA}/`;
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/business.manage'].join(' ');
const link = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: REDIRECT, response_type: 'code', scope: SCOPES, access_type: 'offline', prompt: 'consent', login_hint: 'operacional@linceco.com.br' });

const servidor = createServer(async (req, res) => {
  const code = new URL(req.url, REDIRECT).searchParams.get('code');
  if (!code) { res.end('sem código'); return; }
  try {
    const j = await postForm('https://oauth2.googleapis.com/token', { code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: 'authorization_code' });
    if (!j.refresh_token) throw new Error((j.error_description || j.error || 'sem refresh_token').toString().replace(env.GOOGLE_CLIENT_SECRET, '***'));
    const novo = raw.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, '').trimEnd() + `\nGOOGLE_REFRESH_TOKEN=${j.refresh_token}\n`;
    writeFileSync('.env', novo);
    res.end('Pronto. Pode fechar esta aba e voltar pro terminal.');
    console.log('refresh token guardado no .env (GOOGLE_REFRESH_TOKEN). Teste: node operacao/filas-worker/scripts/google-autorizar.mjs --testar');
  } catch (e) { res.end('deu erro, olha o terminal'); console.error('ERRO:', String(e.message).split(env.GOOGLE_CLIENT_SECRET).join('***')); }
  setTimeout(() => process.exit(0), 500);
});

if (process.argv.includes('--testar')) {
  if (!env.GOOGLE_REFRESH_TOKEN) { console.error('ainda não autorizou'); process.exit(1); }
  const j = await postForm('https://oauth2.googleapis.com/token', { client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  if (!j.access_token) { console.error('token não renovou:', j.error_description || j.error); process.exit(1); }
  const sobre = JSON.parse(await getJson('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', j.access_token));
  console.log('Drive OK como', sobre.user && sobre.user.emailAddress);
  const gmn = await getJson('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', j.access_token);
  console.log('Business Profile:', gmn.includes('"accounts"') ? 'liberado, contas: ' + JSON.parse(gmn).accounts.map(a => a.accountName).join(', ') : 'ainda sem cota (esperando a aprovação do formulário)');
  process.exit(0);
}

servidor.listen(PORTA, () => {
  console.log('Abre este link no navegador (conta operacional@linceco.com.br) e aceita:\n\n' + link + '\n\nEsperando o retorno...');
});
