// Recebe o formulário da página de obrigado e grava no D1 (binding DB).
const LIM = { nome: 120, email: 160, especialidade: 120, cidade: 120, consultorio: 80, objetivo: 600, origem: 300 };

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return new Response("json inválido", { status: 400 }); }
  if (d.site) return new Response("ok"); // armadilha anti-robô
  const v = {};
  for (const k of Object.keys(LIM)) v[k] = String(d[k] ?? "").trim().slice(0, LIM[k]);
  if (!v.nome || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) || !v.especialidade || !v.cidade || !v.consultorio) {
    return new Response("campos obrigatórios", { status: 400 });
  }
  if (!env.DB) return new Response("banco não ligado", { status: 503 });
  await env.DB.prepare(
    "INSERT INTO respostas (nome, email, especialidade, cidade, consultorio, objetivo, origem, criado_em) VALUES (?,?,?,?,?,?,?,datetime('now'))"
  ).bind(v.nome, v.email, v.especialidade, v.cidade, v.consultorio, v.objetivo, v.origem).run();
  return new Response("ok");
}
