// Limites contra abuso, contados no banco (vale pra todos os data centers da Cloudflare, ao contrário do cache).
// Tabela `tentativas` (ver schema.sql): uma linha por tentativa, guardada por 24 horas e depois apagada.
//
// - Login do painel: 5 erros do mesmo IP em 15 min bloqueiam aquele IP; 30 erros no total em 1 hora
//   bloqueiam o login pra todo mundo por até 1 hora (robô com muitos IPs). O formulário não é afetado.
// - Envio do formulário: 20 por IP por hora e 50 por IP por dia. Cliente de verdade manda 1 ou 2;
//   o limite só existe pra robô não conseguir encher o banco. Quem bate nele vê um aviso e as
//   respostas continuam salvas no aparelho.
// Se o banco falhar na contagem, libera (nunca trava cliente por erro nosso).

const MIN = 60_000;
export const LOGIN_IP = { max: 5, janela: 15 * MIN };
export const LOGIN_GLOBAL = { max: 30, janela: 60 * MIN };
export const ENVIO_HORA = { max: 20, janela: 60 * MIN };
export const ENVIO_DIA = { max: 50, janela: 24 * 60 * MIN };

async function contar(env, tipo, chave, janela) {
  const desde = Date.now() - janela;
  const q = chave
    ? env.DB.prepare("SELECT COUNT(*) AS n FROM tentativas WHERE tipo = ? AND chave = ? AND em > ?").bind(tipo, chave, desde)
    : env.DB.prepare("SELECT COUNT(*) AS n FROM tentativas WHERE tipo = ? AND em > ?").bind(tipo, desde);
  return (await q.first()).n;
}

export async function registrar(env, tipo, chave) {
  try {
    const agora = Date.now();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO tentativas (tipo, chave, em) VALUES (?, ?, ?)").bind(tipo, chave, agora),
      env.DB.prepare("DELETE FROM tentativas WHERE em < ?").bind(agora - ENVIO_DIA.janela),
    ]);
  } catch (e) {
    console.error("limite: não registrou", e);
  }
}

// devolve o motivo do bloqueio, ou "" se pode seguir
export async function loginBloqueado(env, ip) {
  try {
    if ((await contar(env, "login", ip, LOGIN_IP.janela)) >= LOGIN_IP.max) return "Muitas tentativas erradas. Aguarde 15 minutos e tente de novo.";
    if ((await contar(env, "login", null, LOGIN_GLOBAL.janela)) >= LOGIN_GLOBAL.max) return "Login pausado por excesso de tentativas erradas. Tente de novo em até 1 hora.";
  } catch (e) {
    console.error("limite: falhou a contagem do login", e);
  }
  return "";
}

export async function errosRestantes(env, ip) {
  try { return Math.max(0, LOGIN_IP.max - (await contar(env, "login", ip, LOGIN_IP.janela))); } catch { return LOGIN_IP.max; }
}

export async function zerarLogin(env, ip) {
  try { await env.DB.prepare("DELETE FROM tentativas WHERE tipo = 'login' AND chave = ?").bind(ip).run(); } catch {}
}

export async function envioBloqueado(env, ip) {
  try {
    if ((await contar(env, "envio", ip, ENVIO_HORA.janela)) >= ENVIO_HORA.max) return true;
    if ((await contar(env, "envio", ip, ENVIO_DIA.janela)) >= ENVIO_DIA.max) return true;
  } catch (e) {
    console.error("limite: falhou a contagem do envio", e);
  }
  return false;
}
