# Formulário de acessos

Página única onde o cliente novo manda todos os acessos de uma vez (Instagram, Facebook, Google Meu
Negócio, site, TikTok, YouTube, Linktree e outros), em vez de mandar cada um num canto pelo WhatsApp.

- **Formulário (público):** a raiz do site. Sem login; o primeiro campo é o nome do cliente.
- **Painel (equipe):** `/painel`. Um login só, compartilhado. Lista os envios, mostra e copia cada
  acesso, exporta CSV (tudo ou um envio) e arquiva envio (teste, duplicado, ou já passado pro lugar definitivo). Nada se apaga: o banco recusa DELETE e o arquivado continua guardado.
- **Onde mora:** Cloudflare Pages `acessos-lince` (conta pessoal do Francisco), ligado ao GitHub nesta
  pasta (`operacao/acessos/site`). Banco D1 `acessos-lince`. Os acessos ficam criptografados no banco;
  só o nome do cliente fica aberto.
- **Segredos:** `node operacao/acessos/configurar.mjs` (da raiz). A chave dos dados fica também no
  `.env` como `ACESSOS_CHAVE`; perdê-la significa perder o que foi gravado.

Testar local: em `site/`, criar `.dev.vars` com os quatro segredos, rodar
`npx wrangler d1 execute acessos-lince --local --file=schema.sql` e `npx wrangler pages dev . --port 8790`.
