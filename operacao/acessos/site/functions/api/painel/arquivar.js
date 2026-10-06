// Arquiva ou desarquiva um envio. Não existe apagar: arquivado some da lista principal e continua
// no banco e na exportação (o banco recusa DELETE). Só com login.

import { json } from "../../_lib/comum.js";

export async function onRequestPost({ request, env }) {
  const { id, arquivar } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id)) return json({ erro: "id inválido" }, 400);
  const quando = arquivar === false ? null : new Date().toISOString();
  const r = await env.DB.prepare("UPDATE envios SET arquivado_em = ? WHERE id = ?").bind(quando, id).run();
  return json({ ok: true, arquivado_em: quando, alterados: r.meta.changes });
}
