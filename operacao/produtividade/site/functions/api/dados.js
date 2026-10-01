// GET /api/dados · eventos de produção e custos. Só chega aqui quem passou pelo login (_middleware.js).
//
// Segredos do projeto (nunca no código):
//   SUPABASE_URL   endereço do projeto Supabase
//   SUPABASE_KEY   chave publicável do Supabase
//   PAINEL_TOKEN   chave do painel; o banco guarda só o hash dela e recusa qualquer chamada sem ela
//   CUSTOS_JSON    {"Victor":{"modo":"peca","valor":...}, "Pamela":{"modo":"mes","valor":...}, ...}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json(405, { erro: "método não permitido" });
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY || !env.PAINEL_TOKEN) return json(503, { erro: "banco ainda não configurado" });

  let r;
  try {
    r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/produtividade_dados_painel`, {
      method: "POST",
      headers: { apikey: env.SUPABASE_KEY, "content-type": "application/json" },
      body: JSON.stringify({ chave: env.PAINEL_TOKEN, dias: 400 }),
    });
  } catch {
    return json(502, { erro: "banco fora do ar" });
  }
  // não repassa a mensagem do banco para o navegador
  if (!r.ok) return json(502, { erro: `banco respondeu ${r.status}` });
  const rows = await r.json();

  let custos = {};
  try { custos = JSON.parse(env.CUSTOS_JSON || "{}"); } catch { custos = {}; }
  return json(200, { valores: true, rows: Array.isArray(rows) ? rows : [], custos });
}

