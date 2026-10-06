// Backup completo do banco em JSON: todas as linhas, todas as colunas, inclusive o envio bruto
// exatamente como chegou do navegador. É o arquivo pra guardar fora (Drive, HD) de tempos em tempos.

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM diagnosticos ORDER BY id").all();
  const dia = new Date().toISOString().slice(0, 10);
  const corpo = JSON.stringify({ gerado_em: new Date().toISOString(), total: results.length, diagnosticos: results }, null, 2);
  return new Response(corpo, {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="diagnosticos-backup-${dia}.json"` },
  });
}
