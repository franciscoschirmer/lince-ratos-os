// Todos os envios, do mais novo pro mais antigo, já abertos. Só com login (o middleware confere).

import { json, abrir } from "../../_lib/comum.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT id, criado_em, nome, dados FROM envios ORDER BY criado_em DESC").all();
  return json({ envios: await Promise.all(results.map((l) => abrir(env, l))) });
}
