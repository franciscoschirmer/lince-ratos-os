// Recebe o formulário do cliente (público, sem login) e grava no banco criptografado.
// Defesas: campo-isca contra robô, tamanho máximo e no máximo 20 envios por hora do mesmo IP.

import { PLATAFORMAS, MAX_OUTROS, json, texto, cifrar } from "../_lib/comum.js";

const MAX_BYTES = 40_000;
const MAX_POR_HORA = 20;

const chaveIp = (ip) => new Request(`https://envios.acessos.interno/${encodeURIComponent(ip)}`);

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
  const atual = await caches.default.match(chaveIp(ip));
  const n = atual ? Number(await atual.text()) || 0 : 0;
  if (n >= MAX_POR_HORA) return json({ erro: "Muitos envios seguidos. Tente de novo em uma hora." }, 429);

  const bruto = await request.text();
  if (bruto.length > MAX_BYTES) return json({ erro: "Envio grande demais." }, 413);

  let f;
  try {
    f = JSON.parse(bruto);
  } catch {
    return json({ erro: "Envio inválido." }, 400);
  }

  // robô preenche o campo escondido; finge que deu certo e não grava
  if (texto(f.site_empresa)) return json({ ok: true });

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

  await env.DB.prepare("INSERT INTO envios (criado_em, nome, plataformas, dados) VALUES (?, ?, ?, ?)")
    .bind(new Date().toISOString(), nome, plataformas, await cifrar(env, itens))
    .run();

  await caches.default.put(chaveIp(ip), new Response(String(n + 1), { headers: { "Cache-Control": "max-age=3600" } }));
  return json({ ok: true });
}
