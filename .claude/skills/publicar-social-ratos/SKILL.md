---
name: publicar-social-ratos
description: >
  Publica e AGENDA carrosséis, imagens e vídeos no Instagram e TikTok direto do Claude Code,
  e gera um painel HTML com a semana de posts (o que está agendado e o que já saiu).
  Suporta dois métodos: Post for Me (mais simples, multi-plataforma, agenda) ou
  Graph API do Instagram (direto, gratuito, só publica na hora).
  Inclui setup guiado na primeira vez pra configurar credenciais.
  Use quando o usuário mencionar "publicar", "postar no instagram", "publicar carrossel",
  "publicar no tiktok", "agendar post", "agenda pra sexta", "monta a semana de posts",
  "reels de teste", "painel de posts", "o que tá agendado", "calendário de posts",
  ou pedir pra enviar imagens ou vídeos pro Instagram/TikTok.
---

# /publicar — Publicar e agendar no Instagram e TikTok

## Setup (primeira vez)

Na primeira vez, guiar o usuário pra escolher e configurar o método de publicação.

### Perguntar o método

> "Pra publicar direto do Claude Code, tu tem duas opções:
>
> **1. Post for Me** (recomendado)
> - Publica no Instagram, TikTok e LinkedIn com uma API só
> - **Agenda** post pra data e hora que tu quiser, e dá pra ver a semana num painel
> - Setup em 5 minutos, token não expira
> - Plano pago (confere o preço atual em postforme.dev)
>
> **2. Graph API do Instagram** (gratuito)
> - Publica direto pela API oficial do Instagram
> - Só Instagram (TikTok e LinkedIn não)
> - Só publica na hora: não agenda e não tem painel
> - Token expira a cada 60 dias (renovável)
> - Setup mais técnico (~15 min)
> - 100% gratuito, sem criar conta em nada
>
> Qual tu prefere?"

---

### Setup Post for Me

Se escolheu Post for Me:

1. **Criar conta:**
   > "Acessa postforme.dev, cria uma conta e conecta teu Instagram (e TikTok se quiser).
   > Depois vai em Settings > API e copia a API Key. Cola aqui."

2. **Salvar a key:**
   Receber a API key e adicionar no `.env`:
   ```
   POSTFORME_API_KEY=pfm_live_xxxxx
   ```

3. **Testar conexão:**
   ```bash
   curl -s -H "Authorization: Bearer $(grep POSTFORME_API_KEY .env | cut -d= -f2 | tr -d '\r')" \
     "https://api.postforme.dev/v1/social-accounts?platform=instagram" | head -c 300
   ```
   O endereço da API é `api.postforme.dev`. O `app.postforme.dev` é o site e devolve página
   HTML, o que parece chave errada e não é.
   Se retornar conta com `"status":"connected"`, tá pronto. Se não, guiar o usuário pra conectar
   a conta no painel da Post for Me.
   Se retornar `Invalid or expired token` com a chave recém-copiada, conferir se a assinatura
   está ativa: conta com pagamento atrasado devolve esse mesmo erro.

4. **Instalar os scripts:**
   Copiar `scripts/publish-postforme.js` e `scripts/painel-agendados.js` (que vêm com esta skill)
   pra pasta `scripts/` do projeto do usuário.

5. **Perguntar o fuso e o começo da semana** e anotar no `.env` (sem segredo, só preferência):
   ```
   POSTFORME_FUSO=-03:00
   POSTFORME_INICIO_SEMANA=segunda
   ```
   O fuso vai no fim de todo horário agendado. O começo da semana (segunda, sabado ou domingo)
   é como o painel monta as colunas.

6. Confirmar:
   > "Pronto! Tua conta tá conectada. Pra publicar agora ou agendar, é só me mandar o conteúdo e o dia e horário."

---

### Setup Graph API (Instagram Login)

Se escolheu Graph API:

1. **Guiar configuração do Meta Developer:**
   > "Vou te guiar passo a passo. Primeiro:
   > 1. Acessa developers.facebook.com e cria um app tipo 'Business'
   > 2. No app, adiciona o produto 'Instagram' (Instagram API with Instagram Login)
   > 3. Na tela de setup do Instagram, clica em 'Add all required permissions'
   > 4. Na seção 'Gerar tokens de acesso', adiciona tua conta do Instagram
   > 5. Gera o token — ele começa com IGA..."
   > 6. Cola o token aqui"

2. **Pegar Instagram User ID:**
   ```bash
   curl -s "https://graph.instagram.com/v21.0/me?fields=id,username&access_token=TOKEN_IGA" | python3 -m json.tool
   ```
   O campo `id` é o Instagram User ID. O `username` serve pra confirmar que é a conta certa.

3. **Salvar no `.env`:**
   ```
   INSTAGRAM_ACCESS_TOKEN=IGA...
   INSTAGRAM_USER_ID=26186...
   ```
   Só essas 2 variáveis. Não precisa de imgbb, catbox key, nem nada a mais.

4. **Instalar o script:**
   Copiar `scripts/publish-graph-api.js` (que vem com esta skill) pra pasta `scripts/` do projeto do usuário.

5. **Testar conexão:**
   ```bash
   curl -s "https://graph.instagram.com/v21.0/me?fields=id,username&access_token=$(grep INSTAGRAM_ACCESS_TOKEN .env | cut -d= -f2)" | python3 -m json.tool
   ```
   Se retornar `username`, tá pronto.

6. **Avisar sobre renovação:**
   > "Teu token dura 60 dias. Quando expirar, renova com:
   > `curl -s 'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TEU_TOKEN'`
   > Ou roda /publicar que eu te guio."

---

## Detalhes técnicos da Graph API

### Endpoints
- Base: `https://graph.instagram.com/v21.0`
- Criar container: `POST /{user_id}/media`
- Publicar: `POST /{user_id}/media_publish`
- Status: `GET /{container_id}?fields=status_code`
- Permalink: `GET /{media_id}?fields=permalink`

### Host de imagens
O Instagram não aceita upload direto de imagens — precisa de URL pública.
O script usa **catbox.moe** (gratuito, sem conta, sem API key):
```bash
curl -s -F "reqtype=fileupload" -F "fileToUpload=@imagem.png" "https://catbox.moe/user/api.php"
# retorna: https://files.catbox.moe/abc123.png
```

### Tipos de publicação suportados

**Carrossel (2-10 imagens):**
1. Upload imagens pro catbox
2. Criar container por imagem com `is_carousel_item=true`
3. Poll status até FINISHED
4. Criar carousel container com `media_type=CAROUSEL`, `children=id1,id2,...`, `caption=...`
5. Poll status até FINISHED
6. Publicar com `creation_id`

**Imagem única:**
1. Upload imagem pro catbox
2. Criar container com `image_url` e `caption` (sem is_carousel_item)
3. Poll status até FINISHED
4. Publicar com `creation_id`

**Vídeo (Reels):**
1. Upload vídeo pro catbox
2. Criar container com `media_type=REELS`, `video_url`, `caption`
3. Poll status até FINISHED (pode levar 2-3 min)
4. Publicar com `creation_id`

### Notas importantes
- `media_type` do carrossel é `CAROUSEL`, não `CAROUSEL_ALBUM` (esse era da API antiga)
- Tokens IGA já vêm de longa duração (60 dias), não precisa converter
- Poll de status a cada 3s com timeout de 60s (vídeos: 180s)

---

## Workflow de publicação (após setup)

### 1. Detectar o que publicar

Se o usuário chamou `/publicar` sem argumentos, verificar:
- Existe `conteudo/carrosseis/` (ou pasta parecida) com PNG ou MP4 recente? Se sim, oferecer o mais recente
- Se não, perguntar: "O que tu quer publicar? Me passa o caminho das imagens ou do vídeo"

Se chamou com caminho (ex: `/publicar conteudo/carrosseis/ia-no-varejo/instagram/`):
- Usar os PNG (em ordem de nome) ou o MP4, e a legenda do `carousel-text.md` daquela pasta, se existir

### 2. Detectar o método configurado

Verificar `.env`:
- Se tem `POSTFORME_API_KEY` -> usar Post for Me
- Se tem `INSTAGRAM_ACCESS_TOKEN` -> usar Graph API
- Se tem os dois -> perguntar qual usar
- Se não tem nenhum -> rodar setup

**Pediu pra agendar?** Só a Post for Me agenda. Se o usuário só tem a Graph API, avisar que ela
publica na hora e oferecer configurar a Post for Me.

### 3. Detectar o tipo e o momento

- 1 imagem -> post único · 2 a 10 imagens -> carrossel · 1 vídeo -> reels
- **Agora ou agendado?** Se o usuário disse dia/hora ("sexta às 18h30", "amanhã de manhã"),
  converter pra ISO 8601 com o fuso do `.env` (`POSTFORME_FUSO`, padrão `-03:00`):
  `2026-10-09T18:30:00-03:00`. Sempre confirmar a data por extenso antes ("sexta, 9 de outubro,
  às 18h30"), porque "sexta" é ambíguo perto da virada da semana
- **Reels de teste?** Se a conta tem 1.000+ seguidores e o usuário quer testar um vídeo sem
  gastar o feed dos seguidores, oferecer `--trial performance` (ver seção 6)

### 4. Preview antes de publicar

> "Vou agendar no Instagram:
> - Tipo: carrossel (8 slides) / imagem / reels
> - Quando: sexta, 9 de outubro, às 18h30 (ou: agora)
> - Legenda: [primeiros 200 chars]...
> - Método: Post for Me
>
> Faço um dry-run primeiro ou manda direto?"

### 5. Dry-run e publicação

```bash
# carrossel agendado
node --env-file=.env scripts/publish-postforme.js \
  --platform instagram \
  --images "slide-01.png,slide-02.png,..." \
  --caption "legenda" \
  --schedule 2026-10-09T18:30:00-03:00 \
  --dry-run

# reels agendado
node --env-file=.env scripts/publish-postforme.js \
  --platform instagram --video corte.mp4 --caption "legenda" \
  --schedule 2026-10-09T09:00:00-03:00

# sem --schedule, publica na hora. Sem --dry-run, cria de verdade.
```

Na Graph API continua igual a antes (publica na hora):

```bash
node --env-file=.env scripts/publish-graph-api.js --images "slide-01.png,..." --caption "legenda"
node --env-file=.env scripts/publish-graph-api.js --video "video.mp4" --caption "legenda"
```

**O script confere a ordem do carrossel sozinho.** A Post for Me às vezes guarda os slides fora
de ordem. Depois de criar, o script baixa o que ficou guardado e compara com os arquivos locais;
se não bater, apaga e cria de novo (até 3 vezes). Leva uns segundos a mais por carrossel. Só
pular (`--sem-conferir`) se o usuário pedir.

### 6. Reels: placement, reels de teste e TikTok

- **Vídeo no Instagram vai como reels** por padrão (`--placement reels`). Pra story: `--placement stories`
- **Reels de teste** (`--trial performance` ou `--trial manual`): o reels aparece só pra quem
  **não segue** a conta. Não entra no perfil nem no feed dos seguidores. Com `performance`, o
  Instagram libera pra todo mundo sozinho se for bem; com `manual`, o usuário libera no app.
  Exige 1.000+ seguidores. Serve pra testar um corte sem queimar o feed
- **O mesmo vídeo no TikTok sem subir de novo:** o upload imprime `-> https://...`. Passar essa
  URL com `--media-url` no post do TikTok:
  ```bash
  node --env-file=.env scripts/publish-postforme.js --platform tiktok \
    --media-url "https://data.postforme.dev/..." --caption "legenda curta" \
    --schedule 2026-10-09T09:00:00-03:00
  ```
- **TikTok: rascunho ou direto?** Publicando na hora, perguntar. Rascunho (`--draft`) cai no
  app do TikTok pro usuário escolher a música e publicar à mão. Agendado, vai direto, senão o
  post nunca sai sozinho no horário

### 7. Agendar a semana inteira (lote)

Quando o usuário mandar vários posts de uma vez ("agenda esses 10 pra semana"):

1. **Listar o que já está agendado antes**, pra não duplicar nem empilhar dois posts no mesmo
   horário: gerar o painel (seção 8) ou `GET /v1/social-posts?status=scheduled&limit=100`
2. **Montar a grade e mostrar antes de criar:** uma linha por post com dia, hora, tipo e o
   começo da legenda. Esperar o OK
3. **Esperar ~75 segundos entre um post e outro.** A Post for Me bloqueia (`429 Too many
   requests`) depois de uns 5 posts seguidos, e cada carrossel já conta vários uploads. Um 429
   no meio **não cria post**, então repetir o que falhou não duplica. Mesmo assim, conferir na
   lista antes de repetir
4. **Guardar o id de cada post** (`sp_...`) numa tabela junto do conteúdo, pra achar depois
5. No fim, gerar o painel e abrir pro usuário conferir

**Sugestão de cadência** (dado de uma conta real de nicho, não regra): 4 a 5 posts por dia
rendeu mais alcance que 1 a 3; o sexto post do dia já piorou. Espalhar em horários diferentes
(manhã, almoço, fim da tarde, noite).

### 8. O painel da semana

```bash
node --env-file=.env scripts/painel-agendados.js --inicio segunda --saida painel-agendados.html
```

Gera **um arquivo HTML só**, que abre no navegador sem servidor. Uma coluna por dia, cada post
com a miniatura, o horário, a rede, o status (agendado ou já saiu), a marca de reels de teste e
o começo da legenda. Clicar no post mostra todos os slides e a legenda inteira. Setas trocam de
semana. Dia sem nada aparece tracejado, pra enxergar o buraco na grade.

- Usar `POSTFORME_INICIO_SEMANA` do `.env` no `--inicio` (segunda, sabado ou domingo)
- `--semanas-antes N` e `--semanas-depois N` mudam o período (padrão: 1 antes, 3 depois)
- **Nada atualiza sozinho.** O painel é uma foto do momento. Rodar de novo atualiza
- Rodar o painel **depois de todo lote** e sempre que o usuário perguntar "o que tá agendado?"
- Abrir no navegador pro usuário (`open painel-agendados.html` no Mac, `start` no Windows,
  `xdg-open` no Linux)
- **Não publicar o painel na internet.** O script descarta os tokens que a API devolve, mas o
  HTML tem as legendas e os links das mídias. É pra uso local

### 9. Confirmar

> "Agendado! 8 posts de terça a sábado. O painel tá aberto no teu navegador."

---

## Regras

- NUNCA publicar nem agendar sem confirmação explícita do usuário
- Horário agendado SEMPRE com fuso no fim (`-03:00`). O script recusa sem fuso: sem ele o post
  sai 3h antes
- Dry-run recomendado na primeira publicação (não obrigatório depois)
- `--trial` só no Instagram e só pra vídeo. A Post for Me aceita qualquer valor sem reclamar, e
  um erro de digitação faria o reels sair normal pra todo mundo: por isso o script confere
- Se a Graph API deu token expirado, guiar a renovação em vez de dar erro genérico
- Legenda máx: 2.200 caracteres (Instagram/TikTok), 3.000 (LinkedIn). Cada quebra de linha do
  texto vira quebra no post: não quebrar parágrafo no meio da frase
- Carrossel: 2 a 10 imagens (Instagram), 4 a 35 (TikTok)
- Nunca commitar `.env` no git, nem o painel

---

## Atualizar a skill

Quando o usuário pedir "checa a atualização da publicar-social-ratos e aplica":

1. Ler `VERSION` local (sem o arquivo, a versão local é anterior à 2.0.0)
2. Ler o `CHANGELOG.md` desta skill e aplicar da versão mais antiga pra mais nova, seguindo as
   regras do topo dele
3. Validar com `node --check scripts/*.js` e atualizar o `VERSION`
