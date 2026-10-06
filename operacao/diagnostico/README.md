# Diagnóstico de posicionamento e negócio

Formulário que o cliente novo responde uma vez só, no começo do trabalho (substitui o Google Forms
"Diagnóstico de Posicionamento & Negócio"). Mesmo visual e mesmo formato do formulário de acessos.

- **Formulário (público):** https://diagnostico-lince.pages.dev. Sem login; a primeira pergunta é o nome.
- **Painel (equipe):** `/painel`. Login único (usuário e senha no `.env`: `DIAGNOSTICO_PAINEL_USUARIO` e
  `DIAGNOSTICO_PAINEL_SENHA`). Lê cada diagnóstico por seção, copia tudo, exporta planilha (todos ou um),
  baixa o backup completo em JSON, arquiva e reenvia a cópia pro ClickUp.
- **Perguntas:** `site/public/perguntas.js` é a fonte única (o formulário e o servidor leem dali). O `id` de uma
  pergunta publicada nunca muda; o texto pode mudar, porque cada resposta é gravada junto com o texto da pergunta.
- **Onde mora:** Cloudflare Pages `diagnostico-lince` (conta pessoal do Francisco), publicado direto do
  computador (não é ligado ao GitHub). Banco D1 `diagnostico-lince` (ENAM).

## Por que a resposta não se perde

1. **Banco permanente.** O D1 não expira, não pausa por falta de uso e não tem trava de preenchimento.
2. **Nada se apaga.** O painel só arquiva. O próprio banco recusa DELETE (gatilho `diagnosticos_nunca_apagar`).
3. **Sem chave que se perde.** As respostas não levam criptografia própria (o D1 já guarda criptografado).
4. **Rascunho no aparelho do cliente.** Cada campo é salvo no navegador enquanto ele digita; se fechar a aba,
   volta pelo mesmo link e continua. O rascunho só some depois que o banco confirma o envio.
5. **Confirmação real e sem duplicar.** O cliente só vê "recebido" (com protocolo) depois que a linha é lida de volta
   do banco. O protocolo nasce no navegador: reenviar o mesmo diagnóstico não duplica; reenviar com mudança grava de novo.
6. **Sem trava de envio.** O campo-isca contra robô não descarta: grava e marca "possível robô".
7. **Segunda cópia fora da Cloudflare.** Cada diagnóstico vira uma página no Doc privado do ClickUp
   "Diagnósticos recebidos (cópia automática)" (só o Francisco vê). Se o banco falhar, a cópia sai mesmo assim,
   avisando no título. O painel mostra se a cópia saiu e tem o botão de reenviar.
8. **Restauração da Cloudflare.** O D1 guarda o histórico pra voltar no tempo (`wrangler d1 time-travel`):
   7 dias no plano gratuito.
9. **Backup na mão.** Botão "Backup completo" no painel: JSON com tudo, inclusive o envio bruto.

## Mexer

- Mudou pergunta, texto ou visual: `node operacao/diagnostico/configurar.mjs --publicar` (da raiz).
- Trocar usuário/senha do painel ou o token do ClickUp: `node operacao/diagnostico/configurar.mjs` (da raiz).
  O token vem do `.env` (`CLICKUP_API_TOKEN`); trocou o token, roda de novo.
- Testar local: em `site/`, criar `.dev.vars` com `PAINEL_USUARIO`, `PAINEL_SENHA` e `PAINEL_SEGREDO`, rodar
  `npx wrangler d1 execute diagnostico-lince --local --file=schema.sql` e `npx wrangler pages dev public --port 8791`.
- O primeiro envio do banco (id 1, "TESTE CLAUDE (arquivar)", de 2026-10-06) é o teste de produção, arquivado.
