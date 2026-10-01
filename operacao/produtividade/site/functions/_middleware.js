// Porta de entrada do painel. Tudo passa por aqui:
// - confere a sessão (cookie assinado) antes de entregar a página ou os dados;
// - bloqueia 15 min depois de 5 senhas erradas seguidas do mesmo IP;
// - põe cabeçalhos de proteção em todas as respostas.
//
// Segredos do projeto (`npx wrangler pages secret put NOME --project-name producao-lince`):
//   PAINEL_USUARIO  usuário de acesso
//   PAINEL_SENHA    senha de acesso
//   PAINEL_SEGREDO  texto aleatório longo que assina o cookie (trocar derruba todas as sessões)

const COOKIE = "painel_sessao";
const DIAS = 30;
const MAX_ERROS = 5;
const BLOQUEIO_SEG = 15 * 60;
const PUBLICO = ["/marca/"]; // selo da marca, usado na tela de login

const enc = new TextEncoder();

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

function protegido(resp, { cache = false } = {}) {
  const r = new Response(resp.body, resp);
  r.headers.set("Content-Security-Policy", CSP);
  r.headers.set("X-Frame-Options", "DENY");
  r.headers.set("X-Content-Type-Options", "nosniff");
  r.headers.set("Referrer-Policy", "no-referrer");
  r.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  r.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  r.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  r.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (!cache) r.headers.set("Cache-Control", "no-store");
  return r;
}

async function assinar(segredo, texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
  return btoa(String.fromCharCode(...s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// comparação sem atalho, para não vazar informação pelo tempo de resposta
function iguais(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

function lerCookie(request) {
  const c = request.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  return m ? m[1] : "";
}

async function sessaoValida(request, env) {
  const [exp, sig] = lerCookie(request).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return iguais(sig, await assinar(env.PAINEL_SEGREDO, exp));
}

// contador de erros por IP no cache da borda da Cloudflare (gratuito, sem banco)
const chaveErros = (ip) => new Request(`https://bloqueio.painel.interno/${encodeURIComponent(ip)}`);
async function lerErros(ip) {
  const r = await caches.default.match(chaveErros(ip));
  return r ? Number(await r.text()) || 0 : 0;
}
async function gravarErros(ip, n) {
  await caches.default.put(chaveErros(ip), new Response(String(n), { headers: { "Cache-Control": `max-age=${BLOQUEIO_SEG}` } }));
}
async function zerarErros(ip) { await caches.default.delete(chaveErros(ip)); }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function telaLogin(erro = "", status = 200) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Entrar · Produção Lince</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;500&family=Italianno&display=swap">
<style>
:root{--bg:#110B08;--card:#1D1511;--ink:#F1EDE5;--ink-2:#988E84;--bronze:#BAA079;--ouro:#D6C294;--linha:rgba(214,203,182,.18);--erro:#E0A3A6;color-scheme:dark}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;display:grid;place-items:center;padding:32px 16px;color:var(--ink);font:15px/1.5 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  background:var(--bg) radial-gradient(120% 80% at 50% 0%,#2a1c15 0%,var(--bg) 60%) fixed}
main{width:100%;max-width:380px;display:grid;gap:28px;justify-items:center}
.selo{width:112px;height:112px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 1px var(--linha)}
.marca{text-align:center;display:grid;gap:2px}
.marca .nome{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:1.05rem;letter-spacing:.42em;text-transform:uppercase;color:var(--ouro);padding-left:.42em}
.marca h1{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;font-size:2.3rem;line-height:1.1;margin:6px 0 0;text-wrap:balance}
form{width:100%;background:var(--card);border:1px solid var(--linha);border-radius:4px;padding:28px;display:grid;gap:16px}
label{display:grid;gap:6px;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2)}
input{font:inherit;font-size:.95rem;letter-spacing:0;text-transform:none;color:var(--ink);background:transparent;border:0;border-bottom:1px solid var(--linha);border-radius:0;padding:8px 2px}
input:focus{outline:none;border-bottom-color:var(--bronze)}
button{margin-top:6px;font:500 .78rem/1 Inter,system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:var(--bg);background:var(--bronze);border:1px solid var(--bronze);border-radius:2px;padding:14px;cursor:pointer}
button:hover{background:var(--ouro);border-color:var(--ouro)}
button:focus-visible,input:focus-visible{outline:1px solid var(--ouro);outline-offset:3px}
.erro{margin:0;color:var(--erro);font-size:.88rem}
.rodape{font-size:.78rem;color:var(--ink-2);text-align:center;font-style:italic;font-family:"Cormorant Garamond",Georgia,serif;font-size:1rem}
</style></head><body><main>
  <img class="selo" src="/marca/selo-lince.jpg" alt="Selo Lince &amp; Co.">
  <div class="marca"><span class="nome">Lince</span><h1>Produção de Conteúdo</h1></div>
  <form method="post" action="/login">
    ${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ""}
    <label for="usuario">Usuário<input id="usuario" name="usuario" autocomplete="username" required autofocus></label>
    <label for="senha">Senha<input id="senha" name="senha" type="password" autocomplete="current-password" required></label>
    <button type="submit">Entrar</button>
  </form>
  <p class="rodape">For those who see further</p>
</main></body></html>`;
  return protegido(new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } }));
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (PUBLICO.some((p) => url.pathname.startsWith(p))) return protegido(await next(), { cache: true });

  if (!env.PAINEL_USUARIO || !env.PAINEL_SENHA || !env.PAINEL_SEGREDO) {
    return protegido(new Response("Painel ainda não configurado: falta definir o usuário e a senha.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }));
  }

  if (url.pathname === "/login" && request.method === "POST") {
    const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
    if ((await lerErros(ip)) >= MAX_ERROS) {
      return telaLogin("Muitas tentativas erradas. Aguarde 15 minutos e tente de novo.", 429);
    }
    const form = await request.formData();
    const okUsuario = iguais(form.get("usuario") || "", env.PAINEL_USUARIO);
    const okSenha = iguais(form.get("senha") || "", env.PAINEL_SENHA);
    if (!(okUsuario && okSenha)) {
      const n = (await lerErros(ip)) + 1;
      await gravarErros(ip, n);
      await new Promise((r) => setTimeout(r, 800));
      const resta = MAX_ERROS - n;
      return telaLogin(resta > 0 ? `Usuário ou senha incorretos. Restam ${resta} tentativa${resta > 1 ? "s" : ""}.` : "Muitas tentativas erradas. Aguarde 15 minutos e tente de novo.", 401);
    }
    await zerarErros(ip);
    const exp = String(Date.now() + DIAS * 864e5);
    const valor = `${exp}.${await assinar(env.PAINEL_SEGREDO, exp)}`;
    return protegido(new Response(null, {
      status: 303,
      headers: { location: "/", "set-cookie": `${COOKIE}=${valor}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Strict` },
    }));
  }

  if (url.pathname === "/sair") {
    return protegido(new Response(null, { status: 303, headers: { location: "/", "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` } }));
  }

  if (await sessaoValida(request, env)) return protegido(await next());

  if (url.pathname.startsWith("/api/")) {
    return protegido(new Response(JSON.stringify({ erro: "faça login" }), { status: 401, headers: { "content-type": "application/json; charset=utf-8" } }));
  }
  return telaLogin();
}
