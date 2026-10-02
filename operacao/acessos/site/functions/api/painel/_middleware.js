// Segunda trava: toda rota desta pasta (lista, exportar, apagar) confere a sessão sozinha,
// mesmo que a porta de entrada deixe passar por algum caminho escrito de outro jeito.

import { sessaoValida } from "../../_lib/sessao.js";

export async function onRequest({ request, env, next }) {
  if (await sessaoValida(request, env)) return next();
  return new Response(JSON.stringify({ erro: "faça login" }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
