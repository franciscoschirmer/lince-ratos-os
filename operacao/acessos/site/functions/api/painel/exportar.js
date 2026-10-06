// Planilha (CSV) com uma linha por acesso. `?id=N` exporta um envio só; sem id, exporta tudo.
// Arquivados entram também, com a situação "(arquivado)".
// Separador ";" e BOM pra abrir certo no Excel em português.

import { abrir } from "../../_lib/comum.js";

const COLUNAS = ["Data", "Cliente", "Plataforma", "Situação", "ID da conta", "Endereço", "Login", "Senha", "Observação"];

// valor que começa com = + - @ vira fórmula no Excel; o apóstrofo neutraliza
function celula(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const dataBr = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export async function onRequestGet({ request, env }) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  const q = id
    ? env.DB.prepare("SELECT id, criado_em, nome, dados, arquivado_em FROM envios WHERE id = ?").bind(id)
    : env.DB.prepare("SELECT id, criado_em, nome, dados, arquivado_em FROM envios ORDER BY criado_em DESC");
  const { results } = await q.all();

  const linhas = [COLUNAS];
  for (const l of results) {
    const e = await abrir(env, l);
    if (e.erro) linhas.push([dataBr(e.criado_em), e.nome, "", e.erro, "", "", "", "", ""]);
    for (const i of e.itens) {
      const obs = [i.hospedagem && `Hospedagem: ${i.hospedagem}`, i.obs].filter(Boolean).join(" | ");
      linhas.push([dataBr(e.criado_em), e.nome, i.plataforma, (i.nao_tem ? "Não tem a conta" : i.geral ? "" : "Enviado") + (e.arquivado_em ? " (arquivado)" : ""), i.conta_id, i.endereco, i.login, i.senha, obs]);
    }
  }

  const csv = "﻿" + linhas.map((r) => r.map(celula).join(";")).join("\r\n");
  const slug = id && results[0] ? results[0].nome.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() : "todos";
  const dia = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="acessos-${slug}-${dia}.csv"`,
    },
  });
}
