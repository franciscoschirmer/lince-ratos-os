// Recebe o formulário do cliente (público, sem login) e grava no banco criptografado.
// Sem trava de quantidade de envios. O campo-isca contra robô não descarta: grava e marca como suspeito
// (o preenchimento automático do navegador pode cair nele, e envio de cliente nunca se perde).

import { PLATAFORMAS, MAX_OUTROS, json, texto, cifrar } from "../_lib/comum.js";

const MAX_BYTES = 40_000;

export async function onRequestPost({ request, env }) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES) return json({ erro: "Envio grande demais." }, 413);
  const bruto = await request.text();
  if (bruto.length > MAX_BYTES) return json({ erro: "Envio grande demais." }, 413);

  let f;
  try {
    f = JSON.parse(bruto);
  } catch {
    return json({ erro: "Envio inválido." }, 400);
  }

  const suspeito = texto(f.site_empresa) ? 1 : 0;

  const nome = texto(f.nome, 120);
  if (!nome) return json({ erro: "Preencha o seu nome." }, 400);

  const itens = [];
  for (const p of PLATAFORMAS) {
    const d = (f.contas && f.contas[p.id]) || {};
    if (d.nao_tem) {
      itens.push({ plataforma: p.nome, nao_tem: true });
      continue;
    }
    const item = { plataforma: p.nome };
    for (const c of p.campos) item[c] = texto(d[c]);
    if (p.campos.some((c) => item[c])) itens.push(item);
  }

  for (const o of (Array.isArray(f.outros) ? f.outros : []).slice(0, MAX_OUTROS)) {
    const item = {
      plataforma: texto(o.servico, 80) || "Outro",
      outro: true,
      endereco: texto(o.endereco),
      login: texto(o.login),
      senha: texto(o.senha),
      obs: texto(o.obs),
    };
    if (item.endereco || item.login || item.senha || item.obs) itens.push(item);
  }

  const verificacao = texto(f.verificacao);
  if (verificacao) itens.push({ plataforma: "Verificação em duas etapas", geral: true, obs: verificacao });
  const observacoes = texto(f.observacoes, 2000);
  if (observacoes) itens.push({ plataforma: "Observações", geral: true, obs: observacoes });

  if (!itens.length) return json({ erro: "Preencha ao menos um acesso ou marque as contas que você não tem." }, 400);

  const plataformas = itens.filter((i) => !i.geral && !i.nao_tem).map((i) => i.plataforma).join(", ");

  try {
    await env.DB.prepare("INSERT INTO envios (criado_em, nome, plataformas, dados, suspeito) VALUES (?, ?, ?, ?, ?)")
      .bind(new Date().toISOString(), nome, plataformas, await cifrar(env, itens), suspeito)
      .run();
  } catch (e) {
    console.error("falha ao gravar envio", e);
    return json({ erro: "Não conseguimos registrar agora." }, 500);
  }

  return json({ ok: true });
}
