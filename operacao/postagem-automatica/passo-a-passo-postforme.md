# Post for Me + ClickUp · passo a passo da primeira versão

Escrito em 2026-10-22, a partir do que já existe: Worker `filas-lince` na Cloudflare com webhook do ClickUp,
validação da peça, KV, Google autorizado (Drive lido com operacional@) e trava de teste `POSTAR_APENAS`.
O que muda é o motor de publicação: sai a Graph API própria, entra a Post for Me.

## 1. O plano de US$ 10 serve?

Serve pra esta operação. Pelo que a página de preços dizia em 2026-10-14 (confirmar em postforme.dev/pricing
antes de contar com isso):

| item | plano de US$ 10 | nossa necessidade |
|---|---|---|
| contas sociais conectadas | ilimitadas em todos os planos | ~15 clientes × 2 a 3 redes = 30 a 45 contas |
| posts por mês | 1.000 posts bem-sucedidos | ~15 clientes × 12 a 20 posts = 180 a 300, mais TikTok em dobro: menos de 600 |
| API | incluída, chave no painel | é tudo o que usamos |
| webhooks | o produto tem (`social.post.result.created`); não achei no site se existe limite por plano | **verificar no painel**: se não houver webhook no plano, o Worker consulta o resultado por cron (funciona igual, só avisa alguns minutos depois) |
| estouro do limite | o site diz que não corta nem cobra sozinho; eles entram em contato | ok |
| Google Meu Negócio | **não existe** na Post for Me | fica no caminho próprio (API do Business Profile, depende da aprovação do Google) |

Não confirmado: limite de requisições por minuto da API (a skill `publicar-social-ratos` registrou `429` depois
de uns 5 posts seguidos e recomenda ~75 s entre posts), e se a conexão do Instagram usa o login do Instagram
ou o do Facebook. Tratados na seção 4.

## 2. Configuração

### 2.1 Conta e chave (5 min · você)
Tem em mãos: a conta da Post for Me já contratada.
1. Painel → Settings → API Keys → Create. Copia a chave.
2. Cola no `.env` da raiz: `POSTFORME_API_KEY=pfm_live_...`. Nunca no chat, nunca no ClickUp.
3. Teste (eu rodo): `GET https://api.postforme.dev/v1/social-accounts` responde com a lista (vazia no começo).
Resultado esperado: chave válida, assinatura ativa. `Invalid or expired token` com chave recém-criada = pagamento pendente.

### 2.2 Conectar as contas dos clientes (1 a 2 min por conta · você)
Tem em mãos: o celular com os Instagrams dos clientes logados; os grupos de WhatsApp pro TikTok.
- **Instagram:** painel → Social Accounts → Connect → Instagram. Cada fluxo conecta uma conta. Faz no celular:
  entra na conta do cliente, aceita, volta, próxima. Começa pelo **@francisco.schirmer** (conta de teste) e pela Lince.
  Se o fluxo pedir Facebook em vez de Instagram, entra com o teu usuário do Facebook (está nos portfólios dos
  clientes) e escolhe a Página do cliente.
- **TikTok:** só com o login do médico. Pra cada cliente eu gero um link (`POST /v1/social-accounts/auth-url`,
  platform `tiktok`, `external_id` = nome do cliente no ClickUp) e tu manda no grupo: "toca aqui, entra com o
  TikTok da clínica, aceita". Uma vez só; a Post for Me renova o token. Quem não usa TikTok, pula.
- **Facebook, LinkedIn, YouTube, Threads:** mesmo esquema, quando quiser.
Resultado esperado: `GET /v1/social-accounts` lista cada conta com `id` (`sa_...`), `platform`, `username` e
`status: connected`. É por esse `username` que eu caso com o cliente do ClickUp.

### 2.3 ClickUp (10 min · você, com a equipe avisada)
Já existe e fica como está: status "agendamento de postagem" → "postagem cadastrada" → "postado/subido";
campos PLATAFORMA, Data de Postagem, LINK DAS PEÇAS, 👔 Clientes.
1. Criar o campo de texto longo **LEGENDA** no Calendário Editorial (hoje a legenda vai num bloco "LEGENDA" na
   descrição; o campo é mais visível e evita roteiro virar legenda).
2. Combinar com quem agenda: Data de Postagem **com hora**; PLATAFORMA marcada (INSTAGRAM ou REELS, TIKTOK...);
   LINK DAS PEÇAS = pasta do Drive só com a arte final, nomes em ordem (01, 02...), visível pra operacional@;
   JPG de preferência; vídeo MP4 até 64 MB pro TikTok.
3. Regra que já vale: anexo da tarefa nunca é arte. Pasta vazia ou sem link = recusa com aviso.
Resultado esperado: peça pronta vira "agendamento de postagem" e em segundos recebe ✅ ou ❌ no comentário.

### 2.4 Ligar os dois: Make, n8n ou script?

| opção | prós | contras | custo |
|---|---|---|---|
| Make | sem código, visual | 1.000 operações grátis/mês acabam rápido (cada peça gasta 10+); lógica de validação e retomada fica frágil; mais um lugar pra olhar | US$ 9+/mês passado o grátis |
| n8n | poderoso, nó HTTP livre | precisa hospedar (VPS ou nuvem deles, US$ 20+/mês) e manter | 0 a 20+/mês |
| **script próprio no Worker que já existe** | já roda, já tem webhook do ClickUp, Drive, KV, trava de teste e retorno na tarefa; custo zero; um operador só precisa de um lugar | é código (eu mantenho) | 0 |

Recomendação: o Worker. Pra um operador com vários clientes, o que importa é um único ponto de verdade (a
tarefa do ClickUp) e zero ferramenta a mais. O que eu troco no módulo `postar.js`:
- cadastro: depois de validar e listar a pasta do Drive, sobe cada arquivo pra Post for Me
  (`POST /v1/media/create-upload-url` → `PUT` do arquivo) e cria o post agendado
  (`POST /v1/social-posts` com `social_accounts` do cliente, `caption`, `media`, `scheduled_at` em ISO com
  `-03:00`, `external_id` = id da tarefa, `platform_configurations` pra reels/story e TikTok). Guarda o
  `sp_...` no KV e comenta na tarefa.
- resultado: webhook `social.post.result.created` → `POST /webhook/postforme` no Worker (assinado com o
  `secret` que a Post for Me devolve) → tarefa "postado/subido" + link; falha → comentário + aviso no canal.
  Plano B sem webhook: cron de 5 min consulta `GET /v1/social-post-results?post_id=`.
- mudança depois do cadastro: data alterada → `PATCH /v1/social-posts/{id}`; status tirado de "postagem
  cadastrada" → `DELETE` do post agendado. Nunca cria de novo sem apagar o antigo.

## 3. Teste controlado

Tem em mãos: chave no `.env`, @francisco.schirmer conectado, campo LEGENDA criado, uma pasta de teste no Drive
com 2 a 4 imagens.
1. Trava ligada (`POSTAR_APENAS = "Lince & Co."`, e Lince & Co. aponta pro @francisco.schirmer).
2. Tarefa de teste no Calendário Editorial: cliente Lince & Co., PLATAFORMA Instagram, Data de Postagem daqui
   a 30 min, LINK DAS PEÇAS = pasta de teste, LEGENDA preenchida. Status → "agendamento de postagem".
3. Em até 1 min: comentário ✅ com quando, onde, arquivos e legenda; status "postagem cadastrada". No painel da
   Post for Me o post aparece como `scheduled` no horário certo (em -03:00: conferir que não ficou 3 h antes).
4. Prévia opcional antes da hora: `POST /v1/social-posts/previews` mostra como vai ficar sem publicar.
5. Na hora: o post sai; em até 2 min a tarefa vira "postado/subido" com o link. Abrir o post: ordem dos slides,
   legenda inteira, quebras de linha.
6. Repetir com um reels (vídeo) e com um TikTok em rascunho (`is_draft`) antes de liberar cliente.
7. Primeiro cliente real: adiciona o nome em `POSTAR_APENAS`, uma peça, conferir. Depois tira a trava.
Validação: status e comentários certos na tarefa, post certo na conta certa, nada em conta errada, nenhum post
duplicado na lista `GET /v1/social-posts?status=scheduled`.

## 4. Pra escalar

- **Duplicata:** `external_id` = id da tarefa em todo post; antes de criar, o Worker consulta o KV e a lista de
  posts com aquele `external_id`; `lock` por tarefa enquanto cria; `429` no meio não cria post, então repetir é
  seguro. Trava de teste enquanto a operação não está liberada.
- **Erros:** toda falha vira comentário na tarefa com o motivo em português e aviso no canal Fila de Aprovação;
  o Worker tenta de novo a cada cron até alguém mudar o status. Conta desconectada (`social.account.updated` ou
  `status != connected`) → recusa no cadastro dizendo qual cliente reconectar.
- **Limite de taxa:** um post por invocação e ~75 s entre criações em lote (`429` observado depois de uns 5
  seguidos). Lote grande (semana inteira) vai em fila, não de uma vez.
- **Limites das redes:** Instagram 100 publicações/conta/24 h, carrossel 2 a 10, JPEG; TikTok vídeo até
  64 MB no envio único; legenda 2.200 caracteres. O cadastro recusa antes de agendar.
- **1.000 posts/mês:** o Worker conta no KV e avisa no canal ao passar de 800.
- **Horário:** sempre com `-03:00`; cron da Cloudflare não precisa mais ser pontual, quem publica na hora é a
  Post for Me.
- **Tokens:** Instagram e TikTok renovados pela Post for Me; Google (Drive) é refresh token interno sem vencimento.
- **Acesso ao Drive:** pasta fora do alcance de operacional@ = recusa; padronizar as pastas nos drives
  compartilhados dos clientes.
- **Desligar:** apagar a var do cron e o webhook do ClickUp, ou pôr `POSTAR_APENAS = "ninguem"`.

## Pendências pra isso rodar
1. Francisco: chave no `.env`; conectar @francisco.schirmer e a Lince; criar o campo LEGENDA.
2. Claude: trocar o motor pra Post for Me, cadastrar o webhook de resultado, casar contas × clientes, teste.
3. Francisco: conectar os demais Instagrams e mandar os links de TikTok.
4. Depois: GMN pelo caminho próprio quando o Google aprovar o acesso à API.
