// GET /api/dados · devolve os eventos de produção e, só para quem pode ver valores, os custos.
// Quem entrou vem do Cloudflare Access (token assinado no cabeçalho Cf-Access-Jwt-Assertion).
//
// Variáveis do projeto (segredos ficam no Cloudflare, nunca no código):
//   ACCESS_TEAM     nome da equipe do Zero Trust (o "xxx" de xxx.cloudflareaccess.com)
//   ACCESS_AUD      Application Audience (AUD) da aplicação do Access
//   SUPABASE_URL    https://axilzquaqtppqjkbqqca.supabase.co
//   SUPABASE_KEY    chave publicável do Supabase (só executa public.produtividade_dados_painel)
//   EMAILS_VALORES  e-mails que veem custos, separados por vírgula
//   CUSTOS_JSON     {"Victor":{"modo":"peca","valor":40}, ...}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

let certsCache = { at: 0, keys: [] };

async function chaves(team) {
  if (Date.now() - certsCache.at < 10 * 60 * 1000 && certsCache.keys.length) return certsCache.keys;
  const r = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("certs " + r.status);
  const { keys } = await r.json();
  certsCache = { at: Date.now(), keys: keys || [] };
  return certsCache.keys;
}

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0));

async function verificar(token, env) {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  const header = JSON.parse(new TextDecoder().decode(b64url(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
  const jwk = (await chaves(env.ACCESS_TEAM)).find(k => k.kid === header.kid);
  if (!jwk || header.alg !== "RS256") return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) return null;
  if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

export async function onRequestGet({ request, env }) {
  if (!env.ACCESS_TEAM || !env.ACCESS_AUD || !env.SUPABASE_URL || !env.SUPABASE_KEY) {
    return json(503, { erro: "acesso ainda não configurado" });
  }
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return json(401, { erro: "sem sessão do Access" });
  let ident;
  try { ident = await verificar(token, env); } catch (e) { return json(401, { erro: "não consegui validar a sessão" }); }
  if (!ident) return json(403, { erro: "sessão inválida" });

  const email = String(ident.email || "").toLowerCase();
  const valores = String(env.EMAILS_VALORES || "").toLowerCase().split(",").map(x => x.trim()).filter(Boolean).includes(email);

  // public.produtividade_dados_painel só repassa a leitura de produtividade.dados_painel (sem dado financeiro)
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/produtividade_dados_painel`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ dias: 400 }),
  });
  if (!r.ok) return json(502, { erro: `banco respondeu ${r.status}` });
  const rows = await r.json();

  let custos = null;
  if (valores) { try { custos = JSON.parse(env.CUSTOS_JSON || "{}"); } catch { custos = {}; } }
  return json(200, { email, valores, rows: Array.isArray(rows) ? rows : [], custos });
}
