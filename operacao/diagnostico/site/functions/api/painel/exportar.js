// Planilha (CSV) com uma linha por diagnóstico e uma coluna por pergunta.
// `?id=N` exporta um só; sem id, exporta todos (arquivados inclusos, com a coluna "Arquivado em").
// Separador ";" e BOM pra abrir certo no Excel em português.

import { abrir } from "../../_lib/comum.js";

// valor que começa com = + - @ vira fórmula no Excel; o apóstrofo neutraliza
function celula(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const dataBr = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "");

export async function onRequestGet({ request, env }) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  const sql = "SELECT id, protocolo, criado_em, nome, respostas, suspeito, arquivado_em, copia_status, copia_em FROM diagnosticos";
  const q = id ? env.DB.prepare(`${sql} WHERE id = ?`).bind(id) : env.DB.prepare(`${sql} ORDER BY criado_em DESC`);
  const { results } = await q.all();
  const ds = results.map(abrir);

  // colunas: as perguntas na ordem em que aparecem (as de diagnósticos antigos entram no fim)
  const colunas = [];
  const vistas = new Set();
  for (const d of ds) for (const r of d.respostas) if (!vistas.has(r.pergunta)) { vistas.add(r.pergunta); colunas.push(r.pergunta); }

  const linhas = [["Recebido em", "Protocolo", "Cliente", "Arquivado em", "Suspeito", ...colunas]];
  for (const d of ds) {
    const m = new Map(d.respostas.map((r) => [r.pergunta, r.resposta]));
    linhas.push([dataBr(d.criado_em), d.codigo, d.nome, dataBr(d.arquivado_em), d.suspeito ? "sim" : "", ...colunas.map((c) => m.get(c) ?? "")]);
  }

  const csv = "﻿" + linhas.map((r) => r.map(celula).join(";")).join("\r\n");
  const slug = id && ds[0] ? ds[0].nome.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() : "todos";
  const dia = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="diagnostico-${slug}-${dia}.csv"` },
  });
}
