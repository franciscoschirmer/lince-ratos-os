# Postagem automática · Instagram, Google Meu Negócio e TikTok a custo zero

Plano de 2026-10-07 (revisado na mesma noite com o que o Francisco contou: Meta já conectado em quase
todas as contas, operacional@ gerente de todos os perfis do GMN). Objetivo: a peça aprovada no ClickUp é
**agendada** quando o status vira "agendamento de postagem" e sai sozinha na data e hora do campo
Data de Postagem. A automação nunca escreve nem aprova conteúdo.

## O fluxo, do jeito que o Francisco descreveu

1. Peça aprovada no Calendário Editorial. Ele põe **data e hora** em Data de Postagem, marca a
   PLATAFORMA (Instagram, Reels, GMN, TikTok), a pasta do Drive em LINK DAS PEÇAS e a legenda.
2. Troca o status pra **"agendamento de postagem"**.
3. Em segundos (webhook do ClickUp) o Worker confere tudo, copia a arte da pasta pro R2 e responde
   **na própria tarefa**:
   - ✅ status vira **"postagem cadastrada"** + comentário: quando, onde, quais arquivos, começo da legenda
   - ❌ status fica onde está + comentário com o que falta (sem hora, sem legenda, pasta vazia, conta
     não conectada). Ele corrige e o Worker reconfere sozinho em até 5 min
4. Na hora marcada o cron (a cada 5 min) publica em cada plataforma marcada, muda pra
   **"postado/subido"** e comenta o link. Falhou: comenta na tarefa, avisa no canal Fila de Aprovação
   e tenta de novo a cada 5 min até ele mudar o status.
5. Mudou a data depois de cadastrar: o Worker percebe e manda de volta pra "agendamento de postagem".

Os status já existem no Calendário Editorial. O Farol já conta "postado/subido".

## Onde cada coisa mora na peça (achado nas peças reais de set/out)

| coisa | onde | regra |
|---|---|---|
| arte final | **só** a pasta do Drive em **LINK DAS PEÇAS** | imagens e vídeos da pasta, em ordem de nome. 1 imagem = post, 2 a 10 = carrossel, 1 vídeo = reels. Anexo da tarefa nunca é arte (print de alteração, referência): regra do Francisco, 2026-10-07 |
| legenda | campo **LEGENDA** (a criar) ou uma linha `LEGENDA` na descrição com o texto embaixo | a descrição hoje é o roteiro, não serve inteira como legenda |
| data e hora | **Data de Postagem** com horário | sem horário o ClickUp grava 04:00 UTC e a peça é recusada com aviso |
| rede | **PLATAFORMA** | INSTAGRAM e REELS = Instagram · GMN · TIKTOK. YouTube, LinkedIn etc. são ignorados e o comentário avisa |
| conta | **👔 Clientes** | liga a peça aos tokens daquele cliente |

Os anexos da tarefa são referência (print, rascunho), não a arte: por isso o Drive é a fonte.

## Arquitetura (R$ 0, tudo no que já existe)

```
ClickUp (webhook em status) ──► Worker filas-lince · src/postar.js ──► Instagram Graph API
cron */5 min ─────────────────►      KV (peças, tokens)              ──► Google Business Profile API
                                     R2 (arte com URL pública)      ──► TikTok Content Posting API
                                                 ▲
                                      Drive (pasta do LINK DAS PEÇAS)
```

| peça | serviço | custo |
|---|---|---|
| fila, aprovação e retorno | ClickUp | 0 |
| motor, webhook e cron | Cloudflare Worker `filas-lince` (grátis: 100 mil requisições/dia) | 0 |
| URL pública das artes (IG e GMN exigem) | Cloudflare R2 (10 GB grátis), apaga depois de postar | 0 |
| memória das peças e tokens | Cloudflare KV (grátis) | 0 |
| ler a pasta do Drive e postar no GMN | uma autorização OAuth da conta operacional@ (Google Cloud grátis) | 0 |
| APIs das redes | gratuitas | 0 |

## No ar desde 2026-10-07 (noite)

- Worker `filas-lince` publicado com o módulo (`https://filas-lince.franciscoschirmer.workers.dev`), cron `*/5 * * * *`
- KV `POSTAR` (`a95ad6126cfb457082a87cbe9d405473`) com as 14 contas de Instagram (`contas.json` → `kv-contas.mjs --subir`)
- Webhook do ClickUp `df0e1b95-5ba0-427f-8b8c-091958d0b677` (workspace 90132863446, lista Calendário Editorial,
  evento taskStatusUpdated) → `POST /webhook/clickup`; segredo em `CLICKUP_WEBHOOK_SECRET`. Apagar:
  `DELETE /api/v2/webhook/<id>`
- Sem R2: a arte é servida do Drive pelo próprio Worker em `GET /midia/<segredo>/<n>` (var `WORKER_URL`)
- Trava de teste: var `POSTAR_APENAS = "Lince & Co."`; Lince & Co. aponta pro @francisco.schirmer (conta de teste
  permanente, decisão do Francisco em 2026-10-07). Pra liberar os clientes: apagar a var no wrangler.toml e publicar
- Teste 1 feito: status → "agendamento de postagem" e em 10 s o Worker comentou o que faltava (Google não autorizado).
  Tarefa de teste: 17trfwhkv88 (apagar depois)
- 2026-10-07 19h: Google adiado (decisão do Francisco: hoje só Meta). Teste 2 cadastrado com a arte anexada à mão só desta vez (o fallback por anexo foi removido em seguida, a pedido dele):
  carrossel de 4 anexado na tarefa 17trfwhkv88, sai 07/10 20h00 no @francisco.schirmer. Chave do app Meta mantida (decisão dele)
- Falta: passos do Google (então `wrangler secret put` GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN),
  trocar a chave secreta do app Meta (passou pelo chat), formulário do GMN, app do TikTok

## Incidente de 2026-10-07 20h e o que mudou

- O teste saiu (https://www.instagram.com/p/DeNgEJfIN6q/), mas só às 20:07, e no mesmo minuto o Worker comentou
  "❌ Não cadastrei" em 23 peças de clientes que a equipe tinha em "agendamento de postagem" à mão. Nenhuma peça de
  cliente teve status alterado nem foi publicada (a trava `POSTAR_APENAS` segurou), mas o comentário foi ruído.
- Não há nenhum rastro do cron entre 18h30 e 20h05 (os 23 comentários são todos de 20:06–20:07): os Cron Triggers
  da Cloudflare atrasaram (a API da Cloudflare também deu timeout em três deploys na mesma noite). A publicação em
  si levou cerca de 1 minuto.
- Mudanças publicadas em seguida: peça de cliente fora de `POSTAR_APENAS` é ignorada em silêncio (sem comentário,
  sem status); peça em "postagem cadastrada" que o Worker não cadastrou é da equipe e não é tocada; cron a cada
  1 minuto; cada publicação roda numa invocação própria (`POST /publicar?id=`), porque no plano grátis cada
  invocação tem 50 subrequisições e um carrossel de 10 + várias peças no mesmo minuto estourava isso.

## Limites que podem travar (plano grátis da Cloudflare e APIs)

| limite | efeito | mitigação |
|---|---|---|
| Cron Triggers atrasam (minutos, sem garantia) | post sai alguns minutos depois da hora | cron de 1 min; horário "cheio" é aproximado |
| 50 subrequisições por invocação (free) | carrossel grande + várias peças na mesma invocação falham no meio | uma invocação por peça |
| 10 ms de CPU por invocação (free) | só processamento; espera de rede não conta | ok |
| Instagram: 100 publicações por conta a cada 24 h; carrossel 2–10; imagem JPEG (PNG aceitou no teste) | peça recusada | o cadastro avisa |
| Instagram: token de página morre se o Francisco sair do portfólio do cliente | aquele cliente para | rodar `meta-contas.mjs --kv` e `kv-contas.mjs --subir` |
| Drive: pasta precisa estar visível pra operacional@ | cadastro recusa | avisa na tarefa |
| ClickUp: webhook é desativado pela ClickUp depois de muitas falhas seguidas | cadastro só pelo cron (1 min) | conferir `health` do webhook |
| KV: leitura com até 60 s de atraso entre regiões | nada, o mínimo entre cadastro e post é 10 min | ok |
| TikTok sem auditoria | só privado | auditoria |
| GMN sem aprovação | cota zero | formulário |

## Código

- `operacao/filas-worker/src/postar.js`: cadastro, publicação, webhook e cron
- `operacao/filas-worker/src/index.js`: rota `POST /webhook/clickup`, cron `*/5 * * * *`, prévia `?postar=1`
- `operacao/filas-worker/wrangler.toml`: cron novo, binding KV `POSTAR`, bucket R2 `midias-lince`, var `R2_URL_PUBLICA`

Segredos do Worker: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (operacional@),
`TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `CLICKUP_WEBHOOK_SECRET`. Token do Instagram vai no KV, por cliente
(`conta:<nome>` = `{ instagram: { ig_user_id, token }, gmn: { location }, tiktok: { refresh_token } }`).

## O que cada rede exige

### Instagram
- Não existe um portfólio da Lince com todas as contas: o usuário do Francisco é convidado em cada
  portfólio de cliente (2026-10-07). Isso não muda o caminho: no **Instagram API com Facebook Login** quem
  manda é o usuário que gera o token, não o portfólio dono do app. O token do Francisco enxerga toda Página
  em que ele tem papel, venha do portfólio que vier, e dela sai o token de página (não vence). Um por cliente no KV.
  Se o Francisco sair do portfólio de um cliente, o token daquele cliente morre junto (esperado).
- Em modo de desenvolvimento o app publica nas contas em que o usuário do token tem papel. Como o acesso
  vem pelo Business Manager, deve cobrir os clientes; se alguma conta recusar, o plano B é o convite de
  tester e, no fim, o App Review (grátis, semanas) pra ficar redondo.
- Fonte: https://developers.facebook.com/docs/instagram-platform/app-review

### Google Meu Negócio
- A conta operacional@ já é gerente de todos os perfis: **uma autorização OAuth cobre todos**. A mesma
  autorização lê a pasta do Drive.
- A API nasce com cota zero: só libera depois do formulário "Application for Basic API Access" (dias a
  semanas). Pedir já. O projeto no Google Cloud precisa ir pra "produção" (em "teste" o token morre em 7 dias).
- Fonte: https://developers.google.com/my-business/content/prereqs

### TikTok
- Dá pra fazer: API oficial, grátis. Cada médico autoriza uma vez (link de OAuth, aceita no celular) e o
  refresh token dura 1 ano.
- A pegadinha: app sem auditoria só publica em modo **privado** (erro
  `unaudited_client_can_only_post_to_private_accounts` em conta pública). A auditoria é grátis e demora
  semanas: pedir no dia em que o app nascer. Até lá, o app do TikTok agenda nativamente até 10 dias à frente.
- Foto no TikTok pela API exige domínio verificado pra puxar a URL; só vídeo por enquanto.
- Fonte: https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post

## Pra botar pra rodar (ordem)

1. **Francisco cria o app no Meta** (developers.facebook.com → Create App → Business, dentro do Business
   Manager da Lince) e gera o token com `pages_show_list`, `instagram_basic`, `instagram_content_publish`,
   `pages_read_engagement`, `business_management`. Eu guio e transformo em tokens de página no KV.
2. **Francisco cria o projeto no Google Cloud** com operacional@, ativa Drive API, cria a credencial OAuth
   (app desktop) e autoriza uma vez. Eu guio. Com isso o Drive já funciona. Enviar o formulário do GMN
   no mesmo dia.
3. **Eu:** `wrangler kv namespace create`, `r2 bucket create`, acesso público do bucket, segredos, deploy,
   webhook no ClickUp (lista Calendário Editorial, evento taskStatusUpdated).
4. **Teste 1 (só ClickUp + Drive):** peça da Lince & Co. com data daqui a 20 min → ver o ✅ na tarefa.
5. **Teste 2:** o mesmo post saindo no Instagram da Lince.
6. **Clientes:** um por vez, Potência Médica primeiro.
7. **TikTok:** registrar o app e pedir auditoria quando o Instagram estiver redondo.

## Decisões em aberto
- Legenda: campo LEGENDA novo (recomendado: fica visível na tabela) ou bloco na descrição?
- Reels: o Instagram precisa de capa separada? Hoje o Worker manda só o vídeo (o Instagram pega o primeiro quadro)
- Quem orienta o médico no OAuth do TikTok quando chegar a hora (sugestão: Henri, no grupo)
