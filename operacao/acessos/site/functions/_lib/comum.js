// Peças comuns às Functions do formulário de acessos.
//
// Segredos do projeto (`npx wrangler pages secret put NOME --project-name acessos-lince`):
//   PAINEL_USUARIO  usuário do painel (um só, compartilhado pela equipe)
//   PAINEL_SENHA    senha do painel
//   PAINEL_SEGREDO  texto aleatório longo que assina o cookie (trocar derruba todas as sessões)
//   ACESSOS_CHAVE   chave AES-256 em base64 que criptografa os acessos no banco.
//                   Perder essa chave = perder os dados gravados. Cópia no .env da raiz.
// Banco: D1 ligado como `DB` (ver wrangler.toml e schema.sql).

const enc = new TextEncoder();
const dec = new TextDecoder();

// As contas que o formulário pede, na ordem em que aparecem.
// `campos` diz o que cada uma guarda; `endereco` e `hospedagem` só existem no site, `conta_id` só no Google Ads.
export const PLATAFORMAS = [
  { id: "instagram", nome: "Instagram", campos: ["login", "senha", "obs"] },
  { id: "facebook", nome: "Facebook", campos: ["login", "senha", "obs"] },
  { id: "google", nome: "Google Meu Negócio", campos: ["login", "senha", "obs"] },
  { id: "googleads", nome: "Google Ads", campos: ["conta_id", "login", "senha", "obs"] },
  { id: "site", nome: "Site", campos: ["endereco", "login", "senha", "hospedagem", "obs"] },
  { id: "tiktok", nome: "TikTok", campos: ["login", "senha", "obs"] },
  { id: "youtube", nome: "YouTube", campos: ["login", "senha", "obs"] },
  { id: "linktree", nome: "Linktree", campos: ["login", "senha", "obs"] },
];

export const MAX_OUTROS = 15;
export const MAX_CAMPO = 500;

export function json(dados, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

export const texto = (v, max = MAX_CAMPO) => String(v ?? "").trim().slice(0, max);

const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function chave(env) {
  if (!env.ACESSOS_CHAVE) throw new Error("ACESSOS_CHAVE não definida");
  return crypto.subtle.importKey("raw", deB64(env.ACESSOS_CHAVE), "AES-GCM", false, ["encrypt", "decrypt"]);
}

// grava como "iv.cifra", os dois em base64
export async function cifrar(env, objeto) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await chave(env), enc.encode(JSON.stringify(objeto))));
  return `${b64(iv)}.${b64(c)}`;
}

export async function decifrar(env, guardado) {
  const [iv, c] = String(guardado).split(".");
  const p = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(iv) }, await chave(env), deB64(c));
  return JSON.parse(dec.decode(p));
}

// lê um envio do banco já aberto, no formato que o painel e o CSV usam
export async function abrir(env, linha) {
  let itens = [];
  let erro = "";
  try {
    itens = await decifrar(env, linha.dados);
  } catch {
    erro = "Não foi possível abrir este envio (chave diferente da que gravou).";
  }
  return { id: linha.id, criado_em: linha.criado_em, nome: linha.nome, itens, erro };
}
