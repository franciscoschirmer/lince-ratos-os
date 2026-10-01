// Configura os segredos do projeto acessos-lince no Cloudflare. Rodar uma vez, da raiz do sistema:
//   node operacao/acessos/configurar.mjs
// Pergunta o usuário e a senha do painel (o login único da equipe), gera a assinatura do cookie e a
// chave que criptografa os acessos, e manda tudo pro Cloudflare. A chave fica guardada também no
// .env da raiz (ACESSOS_CHAVE): sem ela, os dados gravados não abrem mais.

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const PROJETO = "acessos-lince";
const rl = createInterface({ input: process.stdin, output: process.stdout });

function enviar(nome, valor) {
  execSync(`npx wrangler pages secret put ${nome} --project-name ${PROJETO}`, { input: valor, stdio: ["pipe", "ignore", "inherit"] });
  console.log(`  ok: ${nome}`);
}

const usuario = (await rl.question("Usuário do painel (ex.: lince): ")).trim();
const senha = (await rl.question("Senha do painel (mínimo 10 caracteres): ")).trim();
rl.close();
if (!usuario || senha.length < 10) {
  console.log("Nada foi enviado: preencha o usuário e uma senha com pelo menos 10 caracteres.");
  process.exit(1);
}

const env = existsSync(".env") ? readFileSync(".env", "utf8") : "";
let chave = (env.match(/^ACESSOS_CHAVE=(.+)$/m) || [])[1];
if (!chave) {
  chave = randomBytes(32).toString("base64");
  appendFileSync(".env", `${env && !env.endsWith("\n") ? "\n" : ""}# formulário de acessos (Cloudflare acessos-lince): perder esta chave = perder os dados\nACESSOS_CHAVE=${chave}\n`);
  console.log("Chave nova gerada e guardada no .env (ACESSOS_CHAVE).");
} else {
  console.log("Usando a ACESSOS_CHAVE que já estava no .env.");
}

console.log("Enviando pro Cloudflare:");
enviar("PAINEL_USUARIO", usuario);
enviar("PAINEL_SENHA", senha);
enviar("PAINEL_SEGREDO", randomBytes(32).toString("base64url"));
enviar("ACESSOS_CHAVE", chave);
console.log("Pronto. Os segredos valem a partir da próxima publicação (push no GitHub ou 'Retry deployment' no painel).");
