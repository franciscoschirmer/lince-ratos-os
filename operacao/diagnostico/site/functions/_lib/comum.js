// Peças comuns às Functions do diagnóstico.
//
// Segredos do projeto (o configurar.mjs sobe todos):
//   PAINEL_USUARIO     usuário do painel (um só, compartilhado pela equipe)
//   PAINEL_SENHA       senha do painel
//   PAINEL_SEGREDO     texto aleatório longo que assina o cookie (trocar derruba todas as sessões)
//   CLICKUP_API_TOKEN  token do Francisco: cada diagnóstico vira uma página no Doc privado do ClickUp
// Banco: D1 ligado como `DB` (ver wrangler.toml e schema.sql). As respostas não levam criptografia
// própria (não são senhas; o D1 já guarda criptografado), pra não existir chave que, perdida, perde tudo.

import { SECOES, PERGUNTAS, textoResposta } from "../../public/perguntas.js";

export { SECOES, PERGUNTAS };

// Doc privado "Diagnósticos recebidos (cópia automática)" no workspace da Lince (criado em 2026-10-06)
const WORKSPACE = "90132863446";
const DOC_COPIA = "2ky5cpep-5633";

export function json(dados, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

// código curto do protocolo, o que o cliente vê
export const codigo = (protocolo) => String(protocolo).replace(/-/g, "").slice(0, 8).toUpperCase();

// do jeito que o navegador mandou para a lista guardada: cada resposta leva a pergunta junto
export function montarRespostas(cru) {
  const r = cru && typeof cru === "object" ? cru : {};
  const lista = PERGUNTAS.map((q) => ({ id: q.id, secao: q.secao, secaoTitulo: q.secaoTitulo, pergunta: q.p, resposta: textoResposta(q, r[q.id]) }));
  // qualquer chave que não seja pergunta conhecida também fica guardada (nada se perde)
  const conhecidas = new Set(PERGUNTAS.map((q) => q.id));
  for (const [k, v] of Object.entries(r)) {
    if (!conhecidas.has(k)) lista.push({ id: k, secao: 0, secaoTitulo: "Outros", pergunta: k, resposta: typeof v === "string" ? v : JSON.stringify(v) });
  }
  return lista;
}

// linha do banco no formato que o painel e as exportações usam
export function abrir(linha) {
  let respostas = [];
  let erro = "";
  try { respostas = JSON.parse(linha.respostas); } catch { erro = "Não consegui ler as respostas organizadas; o envio original está no backup (JSON)."; }
  const achar = (id) => (respostas.find((x) => x.id === id) || {}).resposta || "";
  return {
    id: linha.id,
    protocolo: linha.protocolo,
    codigo: codigo(linha.protocolo),
    criado_em: linha.criado_em,
    nome: linha.nome,
    profissao: achar("profissao"),
    cidade: achar("cidade"),
    suspeito: !!linha.suspeito,
    arquivado_em: linha.arquivado_em || null,
    copia_status: linha.copia_status,
    copia_em: linha.copia_em,
    respostas,
    erro,
  };
}

const dataBr = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

// texto em markdown da página no ClickUp; cada resposta vai citada (">") pra não virar formatação
function markdown(e, aviso) {
  const l = [];
  if (aviso) l.push(`**${aviso}**`, "");
  l.push(`**Cliente:** ${e.nome}  `, `**Recebido em:** ${dataBr(e.criado_em)}  `, `**Protocolo:** ${e.codigo}${e.suspeito ? "  \n**Atenção:** marcado como suspeito de robô (campo escondido preenchido)" : ""}`, "");
  let secao = null;
  for (const r of e.respostas) {
    if (r.secao !== secao) {
      secao = r.secao;
      l.push("", `## ${r.secao ? `Seção ${r.secao}: ` : ""}${r.secaoTitulo}`, "");
    }
    l.push(`### ${r.pergunta}`, "");
    const txt = String(r.resposta || "").trim();
    l.push(txt ? txt.split(/\r?\n/).map((x) => `> ${x}`).join("\n") : "_(sem resposta)_", "");
  }
  return l.join("\n");
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// manda a cópia pro Doc privado do ClickUp; até 3 tentativas. Devolve "ok" ou o motivo da falha (sem o token)
export async function copiarClickUp(env, e, aviso = "") {
  if (!env.CLICKUP_API_TOKEN) return "falhou: token do ClickUp não configurado";
  const corpo = JSON.stringify({
    name: `${e.nome} · ${dataBr(e.criado_em)}${aviso ? " · NÃO GRAVOU NO BANCO" : ""}`,
    content: markdown(e, aviso),
    content_format: "text/md",
  });
  let ultimo = "";
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(`https://api.clickup.com/api/v3/workspaces/${WORKSPACE}/docs/${DOC_COPIA}/pages`, {
        method: "POST",
        headers: { Authorization: env.CLICKUP_API_TOKEN, "content-type": "application/json; charset=utf-8" },
        body: corpo,
      });
      if (r.ok) return "ok";
      ultimo = `HTTP ${r.status} ${(await r.text()).slice(0, 120)}`;
      if (r.status === 401 || r.status === 403) break;
    } catch (err) {
      ultimo = String(err && err.message || err).slice(0, 120);
    }
    if (t < 3) await espera(2000 * t);
  }
  return `falhou: ${ultimo}`;
}

// copia e anota no banco como foi
export async function copiarEAnotar(env, e) {
  const status = await copiarClickUp(env, e);
  try {
    await env.DB.prepare("UPDATE diagnosticos SET copia_status = ?, copia_em = ? WHERE id = ?").bind(status, new Date().toISOString(), e.id).run();
  } catch (err) {
    console.error("não anotou o status da cópia", err);
  }
  return status;
}
