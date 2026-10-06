// Recebe o diagnóstico do cliente (público, sem login) e grava no banco.
// Regras pra nunca perder resposta:
// - sem trava de quantidade de envios;
// - o campo-isca não descarta: grava e marca como suspeito;
// - o protocolo vem do navegador, então reenviar o mesmo diagnóstico nunca duplica;
// - só responde "ok" depois de ler a linha de volta do banco;
// - a cópia no ClickUp sai sempre; se o banco falhar, a cópia sai mesmo assim, avisando.

import { json, codigo, montarRespostas, abrir, copiarClickUp, copiarEAnotar } from "../_lib/comum.js";

const MAX_BYTES = 1_000_000;
const PROTOCOLO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequestPost({ request, env, waitUntil }) {
  const bruto = await request.text();
  if (bruto.length > MAX_BYTES) return json({ erro: "Envio grande demais." }, 413);

  let f;
  try {
    f = JSON.parse(bruto);
  } catch {
    return json({ erro: "Envio inválido." }, 400);
  }

  const cru = f && typeof f.respostas === "object" && f.respostas ? f.respostas : {};
  const nome = String(cru.nome ?? "").trim().slice(0, 160);
  if (!nome) return json({ erro: "Preencha o seu nome completo." }, 400);

  let protocolo = PROTOCOLO.test(String(f.protocolo)) ? String(f.protocolo).toLowerCase() : crypto.randomUUID();
  const suspeito = String(f.site_empresa ?? "").trim() ? 1 : 0;
  const respostas = montarRespostas(cru);
  const respostasJson = JSON.stringify(respostas);
  const agora = new Date().toISOString();
  const gravar = (p) => env.DB.prepare(
    "INSERT INTO diagnosticos (protocolo, criado_em, nome, respostas, bruto, suspeito) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(protocolo) DO NOTHING"
  ).bind(p, agora, nome, respostasJson, bruto, suspeito).run();
  const ler = (p) => env.DB.prepare("SELECT * FROM diagnosticos WHERE protocolo = ?").bind(p).first();

  let linha = null;
  try {
    await gravar(protocolo);
    linha = await ler(protocolo);
    // mesmo protocolo com respostas diferentes (o cliente voltou e mudou algo): grava como envio novo, nunca descarta
    if (linha && linha.respostas !== respostasJson) {
      protocolo = crypto.randomUUID();
      await gravar(protocolo);
      linha = await ler(protocolo);
    }
  } catch (e) {
    console.error("falha ao gravar diagnóstico", e);
    linha = null;
  }

  if (!linha) {
    // banco fora: a cópia sai mesmo assim, pra resposta não depender só do navegador do cliente
    const e = { nome, criado_em: agora, codigo: codigo(protocolo), suspeito: !!suspeito, respostas };
    await copiarClickUp(env, e, "ATENÇÃO: este diagnóstico NÃO foi gravado no banco (falha no envio). Confira se o cliente reenviou.");
    return json({ erro: "Não conseguimos registrar agora." }, 503);
  }

  // cópia no ClickUp em segundo plano (o cliente não espera); reenvio do mesmo protocolo não copia de novo
  if (linha.copia_status === "pendente") waitUntil(copiarEAnotar(env, abrir(linha)));

  return json({ ok: true, codigo: codigo(protocolo) });
}
