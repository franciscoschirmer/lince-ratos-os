// Apaga um envio de vez (teste, duplicado, ou já passado pro lugar definitivo). Só com login.

import { json } from "../../_lib/comum.js";

export async function onRequestPost({ request, env }) {
  const { id } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id)) return json({ erro: "id inválido" }, 400);
  const r = await env.DB.prepare("DELETE FROM envios WHERE id = ?").bind(id).run();
  return json({ ok: true, apagados: r.meta.changes });
}
