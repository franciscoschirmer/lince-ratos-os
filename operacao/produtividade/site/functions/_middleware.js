// Tela de login simples para o painel. A senha é conferida aqui, no servidor da Cloudflare:
// sem login, nem a página de dados nem a API respondem.
//
// Segredos do projeto (gravados com `npx wrangler pages secret put NOME --project-name producao-lince`):
//   PAINEL_USUARIO  usuário de acesso (ex.: lince)
//   PAINEL_SENHA    senha de acesso
//   PAINEL_SEGREDO  texto aleatório longo, usado para assinar o cookie de sessão

const COOKIE = "painel_sessao";
const DIAS = 30;

const enc = new TextEncoder();

async function assinar(segredo, texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
  return btoa(String.fromCharCode(...s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// comparação sem atalho, para não vazar por tempo de resposta
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
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return iguais(sig, await assinar(env.PAINEL_SEGREDO, exp));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function telaLogin(erro = "", status = 200) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Entrar · Produção de Conteúdo Lince</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&display=swap">
<style>
:root{--bg:#f7f6f2;--surface:#fcfcfb;--ink:#16150f;--ink-2:#52514e;--ring:rgba(22,21,15,.12);--accent:#6b4f2a;--crit:#b3261e;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#11110f;--surface:#1a1a19;--ink:#f4f3ee;--ink-2:#c3c2b7;--ring:rgba(255,255,255,.12);--accent:#d4b48a;--crit:#f2827a;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px 16px}
form{width:100%;max-width:360px;background:var(--surface);border:1px solid var(--ring);border-radius:14px;padding:28px;display:grid;gap:14px}
.eyebrow{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-2)}
h1{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:1.6rem;margin:0}
label{display:grid;gap:5px;font-size:.88rem;color:var(--ink-2)}
input{font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--ring);border-radius:8px;padding:10px 12px}
input:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:11px;background:var(--ink);color:var(--bg);cursor:pointer}
.erro{color:var(--crit);font-size:.9rem;margin:0}
</style></head><body>
<form method="post" action="/login">
  <div class="eyebrow">Lince &amp; Co · operação</div>
  <h1>Produção de Conteúdo</h1>
  ${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ""}
  <label for="usuario">Usuário<input id="usuario" name="usuario" autocomplete="username" required autofocus></label>
  <label for="senha">Senha<input id="senha" name="senha" type="password" autocomplete="current-password" required></label>
  <button type="submit">Entrar</button>
</form></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (!env.PAINEL_USUARIO || !env.PAINEL_SENHA || !env.PAINEL_SEGREDO) {
    return new Response("Painel ainda não configurado: falta definir o usuário e a senha.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  if (url.pathname === "/login" && request.method === "POST") {
    const form = await request.formData();
    const ok = iguais(form.get("usuario") || "", env.PAINEL_USUARIO) & iguais(form.get("senha") || "", env.PAINEL_SENHA);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 800)); // freia tentativas em sequência
      return telaLogin("Usuário ou senha incorretos.", 401);
    }
    const exp = String(Date.now() + DIAS * 864e5);
    const valor = `${exp}.${await assinar(env.PAINEL_SEGREDO, exp)}`;
    return new Response(null, {
      status: 303,
      headers: {
        location: "/",
        "set-cookie": `${COOKIE}=${valor}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  if (url.pathname === "/sair") {
    return new Response(null, { status: 303, headers: { location: "/", "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (await sessaoValida(request, env)) return next();

  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ erro: "faça login" }), { status: 401, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }
  return telaLogin();
}
