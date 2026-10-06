// Todos os diagnósticos, do mais novo pro mais antigo (arquivados inclusos; o painel filtra). Só com login.

import { json, abrir } from "../../_lib/comum.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, protocolo, criado_em, nome, respostas, suspeito, arquivado_em, copia_status, copia_em FROM diagnosticos ORDER BY criado_em DESC"
  ).all();
  return json({ diagnosticos: results.map(abrir) });
}
