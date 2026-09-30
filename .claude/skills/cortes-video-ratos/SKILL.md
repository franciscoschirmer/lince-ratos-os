---
name: cortes-video-ratos
description: Transforma um video longo em cortes curtos prontos pra postar no TikTok, Reels e Shorts, com hook na abertura. Dois modos: acha os melhores momentos que se sustentam sozinhos (podcast, live, aula, talking head) ou fatia nos blocos tematicos quando a fonte ja tem virada de assunto. Corta, reenquadra pra vertical, queima o hook, verifica e nomeia os arquivos, e entrega as legendas de post. Funciona com ffmpeg (qualquer OS) ou com o editor Palmier Pro (Mac). Use quando o usuario pedir pra cortar um video longo em cortes, fazer reels/shorts de um video, achar os melhores trechos, transformar live/podcast/aula em conteudo curto, reaproveitar video longo, ou mencionar "corta esse video em reels", "melhores momentos", "clips pro TikTok", "cortes com hook". Pra limpar a gravacao bruta (tirar erro e pausa) antes de cortar, usa a skill editar-video-ratos.
---

# Cortes Video Ratos

Pega um video longo e devolve **cortes prontos pra postar**: reenquadrados, com hook
na abertura, verificados, nomeados, e um `.md` com a legenda de cada post.

## Escolhe o modo antes de qualquer coisa

Essa e a decisao que muda tudo, e ela depende da FONTE:

| | **destaques** | **blocos** |
|---|---|---|
| Quando | a fonte e corrida: podcast, live, aula, talking head, entrevista | a fonte JA tem virada de assunto: compilado de noticias, aula com modulos, review de varios produtos |
| O trabalho | **achar** os momentos que se sustentam sozinhos | **encontrar as fronteiras** que ja existem |
| Duracao | 20-60s (o ponto doce e 20-40s) | 3-8min |
| Vai pra | Reels, TikTok, Shorts | TikTok longo, YouTube |

Na duvida, **destaques**. E o caso da maioria dos videos, e e o mais dificil: em
blocos as fronteiras te esperam, em destaques tu tem que achar valor.

Se o usuario nao disser, **olha a transcricao e decide**, depois confirma numa linha
("teu video tem 6 assuntos separados, faz mais sentido cortar em blocos, fecha?").

---

## Setup (primeira vez)

Sem `config.json`, faz o setup conversando. Copia o `config.example.json`. Pergunta so
o que nao da pra deduzir:

1. **Modo** (se nao for obvio pela transcricao).
2. **Formato**: vertical (1080x1920) ou original. Se vertical, **olha um frame da
   fonte antes de decidir**: o crop e central e destroi gravacao de tela com o
   rostinho no canto (pega o meio do slide e devolve retangulo vazio). Se o assunto
   nao esta no centro, mede o x e usa `--crop-x`. Se nao cabe em 9:16 de jeito
   nenhum, fala isso pro usuario em vez de entregar corte vazio.
3. **Hook**: quer texto queimado na abertura? (default sim)
4. **Backend**: detecta antes de perguntar.

Grava e nao pergunta mais.

## Detectar o ambiente

- Palmier: `claude mcp list` mostra `palmier-pro`?
- `ffmpeg` no PATH? Sem ele nao roda nada.
- Pillow: `python3 -c "import PIL"`? Precisa pro hook no backend ffmpeg.
- Transcricao: `ASSEMBLYAI_API_KEY` no `.env`? `import whisper` passa?

Achou um backend so, usa e avisa. Os dois, pergunta.

---

## Fase 1: transcrever e mapear

```bash
python3 helpers/transcribe.py fonte.mp4 --unit s -o flat.txt
```

**Despacha um subagente.** Video de 30min da 5000-6000 palavras e enche teu contexto
a toa. O subagente devolve o caminho do arquivo e um resumo do que tem no video.

### Modo blocos: achar as fronteiras

Agrupa por assunto. Acha o timestamp EXATO da virada procurando a primeira palavra do
proximo assunto. **Corta entre frases, nunca no meio de palavra.**

### Modo destaques: achar o valor

O que procurar (um trecho forte costuma ter mais de um destes):

- **Frase de impacto ou provocacao** que gera reacao
- **Revelacao ou virada**: "e foi ai que eu descobri que..."
- **Numero concreto**: "isso me economiza 4 horas por semana"
- **Contradicao do senso comum**: "todo mundo faz X, mas..."
- **Historia pessoal com virada**
- **Demonstracao com resultado visivel**
- **Reacao espontanea**: risada, espanto

Criterios tecnicos de um corte que presta:

- **Se sustenta sozinho.** Se precisa de contexto do que veio antes, nao e corte.
  Esse e o criterio que mais reprova candidato bom no papel.
- **Abertura forte e fim natural.** Nunca comeca ou termina no meio de um raciocinio.
- Duracao no range do config.
- Preserva o pico: se tem risada ou punchline, **estende pra incluir a reacao**. A
  risada E a batida, cortar nela mata a piada.

Quantidade por duracao da fonte:

| Fonte | Cortes |
|---|---|
| ate 5min | 2-4 |
| 5-20min | 4-8 |
| 20min+ | 6-12 |

**Nunca força corte fraco pra bater numero.** Entregar 4 bons e melhor que 8 com 4
ruins no meio: o feed pune o ruim e o perfil paga.

## Fase 2: hook

Um por corte. Regras de tom:

- **Curto**: max 2-3 linhas na tela, ~10-14 chars por linha
- **Minusculo** (padrao atual do feed)
- **Gera curiosidade ou espanto imediato**, ou promete um resultado
- Sai em ~3s

Nao usa chavao, nao usa metafora batida, e **nao usa a formula "nao e A, e B"** (ta
gasta). Nao promete o que o corte nao entrega: hook que mente derruba retencao no
segundo 4 e o algoritmo aprende.

Onde por o hook depende do que abre na tela. Le o backend.

## Fase 3: cortar, verificar, entregar

Segue `backends/ffmpeg.md` ou `backends/palmier.md`.

Nome do arquivo descritivo: `01-tema-do-corte.mp4`. Nao `corte1.mp4`.

**Verifica sempre**, nos dois backends: duracao real contra a pedida, e abre pelo
menos um arquivo. Render trunca as vezes e finaliza curto, cortando o fim no meio da
frase. Codigo de saida 0 nao prova que o video presta.

## Fase 4: entregar

Na pasta de saida:

1. Os `.mp4` nomeados
2. Um `HOOKS-E-LEGENDAS.md`: por corte, o hook que ficou na tela + a legenda de post
   (com hashtags) + o timestamp na fonte + por que esse trecho funciona

Ranqueia os cortes por potencial e diz qual postar primeiro, com o motivo. Se ele so
puder postar um, ele quer saber qual.

## Fase 5: postar (opcional, delegado)

Ao terminar, oferece postar como **rascunho**.

Isso nao e trabalho dessa skill: quem faz e a
`publicar-social-ratos`. Se estiver
instalada, chama ela com os arquivos e as legendas do `HOOKS-E-LEGENDAS.md`. Se nao,
avisa que existe.

**Sempre rascunho, nunca publica direto.** O usuario escolhe musica e revisa no app.
E **confirma antes de subir**: sao uploads grandes.

---

## Gotchas

- **Corte tem que se sustentar sozinho.** O criterio mais ignorado e o que mais mata.
- **Estende pra incluir a reacao.** Cortar na risada mata a piada.
- **Nunca corta no meio de palavra.** Fronteira de frase, sempre.
- **Verifica a duracao do export.** Render trunca.
- **Crop central decepa.** Olha um frame ANTES do lote. O `ffprobe` aprova corte
  vazio: duracao certa e imagem inutil passam na verificacao automatica. Gravacao de
  tela com rostinho no canto precisa de `--crop-x`.
- **A/V offset se mede, nao se chuta.** E da tua cadeia de captura, nao do universo.
- **Nao força corte fraco pra bater numero.**
- **Transcricao grande estoura contexto.** Subagente, sempre.

## Referencia rapida

| Item | Valor |
|---|---|
| Modo | `destaques` (achar momento) ou `blocos` (fatiar assunto) |
| Duracao | destaques 20-60s (doce: 20-40s), blocos 3-8min |
| Quantidade | ate 5min: 2-4, 5-20min: 4-8, 20min+: 6-12 |
| Corte | `cortar.sh` re-encoda sempre (`-c copy` erra o inicio e quebra o hook) |
| Hook | PNG + overlay com contorno (drawtext nao existe em todo ffmpeg) |
| Verificar | duracao real vs pedida, e abrir um arquivo |
| Postar | delega pra `publicar-social-ratos`, sempre rascunho |
| Ordem | transcrever -> modo -> selecionar -> hook -> cortar -> verificar -> entregar |
