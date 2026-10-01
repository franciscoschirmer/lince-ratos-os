// GET /api/dados · eventos de produção e custos. Só chega aqui quem passou pelo login (_middleware.js).
//
// Segredos do projeto (nunca no código):
//   SUPABASE_URL   https://axilzquaqtppqjkbqqca.supabase.co
//   SUPABASE_KEY   chave publicável do Supabase (só executa public.produtividade_dados_painel)
//   CUSTOS_JSON    {"Victor":{"modo":"peca","valor":40}, "Pamela":{"modo":"mes","valor":...}, ...}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export async function onRequestGet({ env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) return json(503, { erro: "banco ainda não configurado" });

  // public.produtividade_dados_painel só repassa a leitura de produtividade.dados_painel
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/produtividade_dados_painel`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_KEY, "content-type": "application/json" },
    body: JSON.stringify({ dias: 400 }),
  });
  if (!r.ok) return json(502, { erro: `banco respondeu ${r.status}` });
  const rows = await r.json();

  let custos = {};
  try { custos = JSON.parse(env.CUSTOS_JSON || "{}"); } catch { custos = {}; }
  return json(200, { valores: true, rows: Array.isArray(rows) ? rows : [], custos });
}
