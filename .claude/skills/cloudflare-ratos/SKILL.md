---
name: cloudflare-ratos
description: Guia o fluxo completo de publicar e operar sites e landing pages no Cloudflare Pages com o método da casa, site conectado ao GitHub, publicação automática a cada push. Cobre conectar a conta (wrangler login ou token), publicar site novo (orientando o passo a passo do painel na conexão com o Git), atualizar o site no ar, apontar domínio e subdomínio (DNS), secrets, banco D1 e debug de deploy. Use quando o usuário pedir pra publicar um site ou landing page, colocar uma página no ar, fazer deploy, subir o site, atualizar o site publicado, hospedar no Cloudflare, conectar o Cloudflare, apontar um domínio ou subdomínio, mexer em DNS, configurar uma senha/secret, criar banco D1, ver logs, ou disser que o build falhou ou o site caiu. Também dispara em "/cloudflare-ratos", "bota no ar", "publica pra mim".
---

# Cloudflare Ratos — publicar e operar sites no Cloudflare

Esta skill guia o jeito da casa de botar sites no ar: **Cloudflare Pages conectado ao GitHub**, publicação automática a cada push, de graça. Ela sabe o que dá pra fazer por comando (e faz) e o que é etapa de painel (e aí orienta o usuário passo a passo, sem enrolar).

## Regras de ouro

1. **Site de verdade = projeto Pages conectado ao Git.** NUNCA publicar o site principal do usuário com `wrangler pages deploy` (direct upload): isso cria um projeto sem vínculo com o GitHub, sem histórico de deploy por push, e não dá pra converter depois. Direct upload é só pra material descartável (um teste, um HTML avulso interno), e mesmo assim avisando a diferença.
2. **O que é painel, orienta; o que é comando, executa.** Conectar o repositório ao Pages e mexer em DNS (no modo básico) são etapas de painel: gerar instruções exatas de onde clicar. Deploy, secret, D1 e logs são comando: fazer direto.
3. **Nunca exibir, imprimir ou commitar token/secret.** `.env` sempre no `.gitignore`.
4. **Nunca inventar resultado.** Rodar o comando de verdade e mostrar a saída real. Se falhar, mostrar a falha e resolver.

## Passo 0 — Detectar o estado (sempre, antes de qualquer fluxo)

1. Conta conectada? `npx wrangler whoami`
   - Não autenticado → fluxo "Conectar a conta".
2. Existe `.env` com `CLOUDFLARE_API_TOKEN` na pasta? → modo avançado disponível (DNS por comando, automação). Sem token → modo básico (OAuth), que cobre quase tudo.
3. A pasta é um repositório git com remote no GitHub? (`git remote -v`) → define se o fluxo de publicar começa criando repo.

## Fluxo: conectar a conta

Modo básico (o padrão, serve pra quase tudo):
```
npx wrangler login    # abre o navegador, botão Allow
npx wrangler whoami   # confirma email e Account ID
```
Se der "missing OAuth scopes", rodar `npx wrangler login` de novo (renova a autorização).

Modo avançado (só se o usuário quiser DNS por comando ou automação sem navegador): orientar a criação de um token custom no painel (My Profile → API Tokens → Create Token → Custom) com **estas permissões e nada mais**:
- Account: Cloudflare Pages **Edit** · Workers Scripts **Edit** · Workers KV Storage **Edit** · D1 **Edit** · Account Settings **Read**
- Zone (All zones): Zone **Read** · DNS **Edit** · Cache Purge **Purge**
- User: User Details **Read**
- NÃO marcar: Billing, Account Members, API Tokens, R2.

Guardar em `.env` (`CLOUDFLARE_API_TOKEN=...` e `CLOUDFLARE_ACCOUNT_ID=...`), conferir que `.env` está no `.gitignore`. O token nunca aparece em tela.

## Fluxo: publicar um site novo (Git-connected)

1. **Repo primeiro.** Se a pasta não tem repo/remote: criar com `gh` (`git init` + commit + `gh repo create <nome> --private --source=. --push`). Se o `gh` não estiver autenticado: `gh auth login` (GitHub.com → HTTPS → navegador).
2. **Conectar no painel (etapa de painel, orientar passo a passo):**
   - dash.cloudflare.com → **Workers & Pages** → **Create** → aba **Pages** → **Connect to Git**
   - Na primeira vez, o Cloudflare pede pra **instalar o GitHub App** dele e autorizar o acesso aos repositórios (fluxo do navegador, uma vez só; recomendar dar acesso a "All repositories" pra não repetir isso a cada site novo)
   - Escolher o repositório → **Begin setup**
   - Build settings: site em HTML puro → framework **None**, build command vazio, output directory `/` (ou a subpasta onde está o `index.html`). Framework (Astro, Next estático etc.) → escolher o preset correspondente
   - **Save and Deploy**
3. **Conferir:** aguardar o primeiro deploy e abrir a URL `*.pages.dev`. Se der tela branca ou 404, o suspeito número 1 é o output directory errado.

> Nota (modo avançado): com o token E o GitHub App já instalado, dá pra criar o projeto Git-connected via API direta, sem painel. Só oferecer se o usuário pedir automação; pro fluxo normal, o painel é mais claro e é uma vez só por site.

## Fluxo: atualizar o site no ar

Editou os arquivos → `git add` + `commit` + `push`. O Cloudflare publica sozinho (1 a 3 min).
- Conferir: `npx wrangler pages deployment list --project-name <nome>` ou o painel do projeto.
- Lembrete que evita confusão: mudança não commitada/pushada NÃO vai pro ar. "Salvou no computador" não é "publicou".

## Fluxo: domínio e subdomínio

1. **Domínio custom no projeto:** painel do projeto → **Custom domains** → Add. Se o domínio já está na conta Cloudflare, ele resolve o DNS sozinho.
2. **Registro DNS manual (subdomínio, apontamentos):** modo básico → dizer EXATAMENTE o que criar (tipo, nome, alvo, proxy on/off) pro usuário colar no painel (zona → DNS → Records). Modo avançado (token) → oferecer criar o registro via API, mostrando antes o que vai criar e confirmando.
3. Avisar da propagação (minutos até algumas horas) e NUNCA apagar registros existentes que não se conhece (email do domínio pode depender deles).

## Fluxo: secrets (senha, chave de API do projeto)

```
npx wrangler pages secret put NOME --project-name <nome>
```
Secret vive no Cloudflare, nunca no código. Vale lembrar: secret novo só é lido no PRÓXIMO deploy.

## Fluxo: banco D1 (formulário, dados simples)

```
npx wrangler d1 create <nome-do-banco>
```
Vincular ao projeto Pages (painel do projeto → Settings → Bindings, ou `wrangler.toml`). Consultas: `npx wrangler d1 execute <banco> --command "SELECT ..."`. Pra formulário de lead: Function em `functions/` recebendo o POST e gravando no D1.

## Fluxo: debug (build falhou / site fora do ar / Function com erro)

1. **Build falhou:** abrir o log do deploy (painel do projeto → deploy com erro → View build log). Causas comuns: output directory errado, comando de build errado, versão do Node (setar env `NODE_VERSION` no projeto).
2. **Function com erro em produção:** `npx wrangler pages deployment tail --project-name <nome>` e reproduzir o erro no site pra ver o log ao vivo.
3. **Testar local com Functions:** `npx wrangler pages dev <pasta>` antes de publicar.

## Atualizar a skill

Rode "checa a atualização da skill cloudflare-ratos": ler o `CHANGELOG.md` do repositório de origem, comparar com o `VERSION` local e aplicar as mudanças preservando customizações locais.
