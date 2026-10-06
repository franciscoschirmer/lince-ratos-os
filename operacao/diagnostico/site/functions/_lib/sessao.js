// Sessão do painel: cookie com a validade assinada por HMAC (PAINEL_SEGREDO).
// Usada pela porta de entrada (functions/_middleware.js) e pela segunda trava da API
// (functions/api/painel/_middleware.js).

export const COOKIE = "diagnostico_sessao";

const enc = new TextEncoder();

export async function assinar(segredo, texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
  return btoa(String.fromCharCode(...s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// comparação sem atalho, para não vazar informação pelo tempo de resposta
export function iguais(a, b) {
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

export async function sessaoValida(request, env) {
  if (!env.PAINEL_SEGREDO) return false;
  const [exp, sig] = lerCookie(request).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return iguais(sig, await assinar(env.PAINEL_SEGREDO, exp));
}

// caminho como o servidor enxerga: sem %xx, sem barra dobrada, em minúsculas
// (as rotas da Cloudflare não diferenciam maiúscula de minúscula)
export function caminho(url) {
  let p = url.pathname;
  try { p = decodeURIComponent(p); } catch {}
  return p.replace(/\\/g, "/").replace(/\/{2,}/g, "/").toLowerCase();
}
