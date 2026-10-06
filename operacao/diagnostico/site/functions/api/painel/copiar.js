// Reenvia a cópia de um diagnóstico pro Doc privado do ClickUp (quando a primeira falhou). Só com login.

import { json, abrir, copiarEAnotar } from "../../_lib/comum.js";

export async function onRequestPost({ request, env }) {
  const { id } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id)) return json({ erro: "id inválido" }, 400);
  const linha = await env.DB.prepare("SELECT * FROM diagnosticos WHERE id = ?").bind(id).first();
  if (!linha) return json({ erro: "não encontrado" }, 404);
  const status = await copiarEAnotar(env, abrir(linha));
  return json({ ok: status === "ok", copia_status: status });
}
