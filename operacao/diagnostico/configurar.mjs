// Configura os segredos do projeto diagnostico-lince no Cloudflare e publica o site. Rodar da raiz do sistema:
//   node operacao/diagnostico/configurar.mjs
// Pergunta o usuário e a senha do painel (Enter mantém o que já está no .env), gera a assinatura do cookie,
// pega o token do ClickUp do .env (CLICKUP_API_TOKEN) e manda tudo pro Cloudflare. No fim, publica.
// O login do painel fica guardado no .env (DIAGNOSTICO_PAINEL_USUARIO e DIAGNOSTICO_PAINEL_SENHA).
// Só publicar, sem mexer em segredo: node operacao/diagnostico/configurar.mjs --publicar

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const PROJETO = "diagnostico-lince";
const SITE = "operacao/diagnostico/site";

// a rede até a Cloudflare às vezes cai no meio: cada passo tenta até 4 vezes antes de desistir
function tentar(rotulo, fazer) {
  for (let t = 1; t <= 4; t++) {
    try { fazer(); return; } catch {
      if (t === 4) {
        console.log(`
Não consegui: ${rotulo}. Nada mudou no .env; o painel segue com o login anterior. Rode de novo em alguns minutos.`);
        process.exit(1);
      }
      console.log(`  ${rotulo}: a Cloudflare não respondeu, tentando de novo (${t + 1} de 4)`);
      execSync(process.platform === "win32" ? "ping -n 6 127.0.0.1 >NUL" : "sleep 5");
    }
  }
}
function publicar() {
  console.log("Publicando...");
  tentar("publicação", () => execSync(`npx wrangler pages deploy public --project-name ${PROJETO} --branch main --commit-dirty=true`, { cwd: SITE, stdio: "inherit" }));
  console.log("Pronto: https://diagnostico-lince.pages.dev (painel em /painel)");
}

if (process.argv.includes("--publicar")) {
  publicar();
  process.exit(0);
}

let env = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const ler = (k) => (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1];
function guardar(k, v) {
  env = new RegExp(`^${k}=`, "m").test(env) ? env.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : `${env}${env && !env.endsWith("\n") ? "\n" : ""}${k}=${v}\n`;
}

// no terminal, pergunta; com entrada redirecionada (duas linhas: usuário e senha), lê de uma vez
let perguntar;
let fechar = () => {};
if (process.stdin.isTTY) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  perguntar = async (p) => rl.question(p);
  fechar = () => rl.close();
} else {
  const linhas = readFileSync(0, "utf8").split(/\r?\n/);
  perguntar = async () => linhas.shift() || "";
}
const usuarioAtual = ler("DIAGNOSTICO_PAINEL_USUARIO");
const usuario = (await perguntar(`Usuário do painel${usuarioAtual ? ` (Enter mantém "${usuarioAtual}")` : ""}: `)).trim() || usuarioAtual;
const senha = (await perguntar(`Senha do painel, mínimo 10 caracteres${ler("DIAGNOSTICO_PAINEL_SENHA") ? " (Enter mantém a do .env)" : ""}: `)).trim() || ler("DIAGNOSTICO_PAINEL_SENHA");
fechar();
if (!usuario || !senha || senha.length < 10) {
  console.log("Nada foi enviado: preencha o usuário e uma senha com pelo menos 10 caracteres.");
  process.exit(1);
}
const token = ler("CLICKUP_API_TOKEN");
if (!token) console.log("Aviso: sem CLICKUP_API_TOKEN no .env; a cópia no ClickUp fica desligada até ele existir.");

function enviar(nome, valor) {
  tentar(nome, () => execSync(`npx wrangler pages secret put ${nome} --project-name ${PROJETO}`, { input: valor, stdio: ["pipe", "ignore", "ignore"] }));
  console.log(`  ok: ${nome}`);
}
console.log("Enviando pro Cloudflare:");
enviar("PAINEL_USUARIO", usuario);
enviar("PAINEL_SENHA", senha);
enviar("PAINEL_SEGREDO", randomBytes(32).toString("base64url"));
if (token) enviar("CLICKUP_API_TOKEN", token);
// só depois de tudo subir o .env passa a valer o login novo
guardar("DIAGNOSTICO_PAINEL_USUARIO", usuario);
guardar("DIAGNOSTICO_PAINEL_SENHA", senha);
writeFileSync(".env", env);
console.log("Login do painel guardado no .env.");
publicar();
