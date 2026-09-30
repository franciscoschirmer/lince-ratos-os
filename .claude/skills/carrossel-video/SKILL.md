---
name: carrossel-video-ratos
description: >
  Transforma um vídeo (do YouTube, de qualquer plataforma, ou um arquivo local)
  num carrossel do Instagram em que alguns slides levam um corte do próprio
  vídeo dentro de uma moldura. A identidade visual vem de um design-guide que a
  skill detecta ou preenche num setup na primeira vez, e o corte é escolhido
  pelo sentido da fala, sem depender de pontuação na legenda. Para no MP4, não
  publica.
  Use quando pedirem "carrossel com vídeo", "carrossel de um vídeo do YouTube",
  "carrossel de um vídeo local", "slide com corte do vídeo", "carrossel misto",
  ou mandarem um link de vídeo pedindo carrossel.
  Para carrossel 100% imagem, usar a skill `carrossel`.
description_pt-BR: >
  Carrossel com slides em MP4 a partir de um vídeo publicado ou local, com a
  marca de quem pediu: acha o corte pelo sentido, ancora na linha do tempo real,
  confere o que aparece na tela, e escreve o texto depois de ler a fala.
---

# Carrossel com vídeo

Recebe um vídeo e devolve os slides de um carrossel do Instagram em MP4, prontos
pra subir. O vídeo pode vir de três lugares: um **link do YouTube**, um **link
de outra plataforma** (Instagram, TikTok, Vimeo... via yt-dlp) ou um **arquivo
local** na máquina. **Para no MP4 por decisão de escopo: esta skill não publica,
não pede chave de API obrigatória e não cria automação de DM.**

Feita pela [**Ratos de IA**](https://ratosdeia.com.br), a partir da
`carrossel-video` que a gente usa internamente, com a identidade do canal
removida e o método de corte trocado (ver "Por que o corte mudou").

> **Estado:** validada ponta a ponta em vídeo de apresentador falando pra câmera
> (6 min, sem b-roll, sem legenda queimada), pelo caminho da legenda automática.
> Os caminhos de transcrição (Whisper) e de vídeo local seguem o mesmo método a
> partir do momento em que existe um `.srt` na linha do tempo real. Vídeo com
> corte rápido, trilha por baixo, legenda burnt-in ou muito b-roll ainda pede
> atenção. Tratar os avisos de tela como obrigatórios, não como zelo excessivo.

## A regra que manda em tudo

**O carrossel é conteúdo por si só, não chamada pro vídeo.** Quem só passar o
dedo tem que sair sabendo a coisa inteira.

- nenhum slide cita "vídeo novo no canal" ou "link na bio"
- nenhum corte pega introdução, pedido de inscrição ou créditos finais
- o CTA pede uma ação (salvar, comentar), não um clique pra assistir

---

## Fase 0 — Setup (primeira vez)

A marca dos slides vem de um **design-guide**. Antes de perguntar qualquer coisa,
procurar um já configurado, nesta ordem:

1. `./marca/design-guide.md` (padrão do Ratos OS / Claude Code OS)
2. `./design.md` ou `./design-guide.md` (raiz do projeto)
3. `marca/design-guide.md` dentro da própria pasta da skill (o template que vem junto)

### Cenário A — já existe um design-guide configurado

Se achou um `marca/design-guide.md` (ou `design.md`) **do projeto** com valores
reais (não o template), avisar em uma mensagem curta e seguir:

> Vi que tens um design-guide configurado aqui (`marca/design-guide.md`). Uso ele
> pra montar o carrossel com a tua cara, ou prefere um visual custom pra esse?
>
> 1. Usar o que já tem (recomendado)
> 2. Montar um visual do zero pra esse carrossel

Quem usa **Ratos OS / Claude Code OS** cai aqui: o design da marca já está
descrito e a skill só lê. Derivar os três temas (claro, escuro e cor cheia) a
partir da cor principal e da fonte.

### Cenário B — não achou nada configurado (só o template)

Perguntar de forma conversacional, em UMA mensagem:

> Pra montar o carrossel com a tua cara, me conta:
> 1. Qual a cor principal da marca? (hex, ou descreve: "verde escuro")
> 2. Preferência de fonte? (se não tiver, eu escolho)
> 3. O nome que aparece no topo dos slides
> 4. Estilo: clean, bold, ou editorial?
>
> Ou, se preferir, é só dizer "escolhe pra mim" que eu uso um padrão neutro.

Preencher `marca/design-guide.md` com as respostas (pedindo permissão antes de
salvar) e derivar os três temas. Se a pessoa disser "escolhe pra mim", usar o
padrão do template.

### Cenário C — já rodou nesta sessão

Pular o setup, ir direto pra Fase 1.

**O vídeo é do canal de quem pediu.** Se o link for de terceiro, avisar que
republicar corte de vídeo alheio é decisão dela, e seguir só se ela confirmar.

## Dependências

`yt-dlp`, `ffmpeg`, `node`, `python3`, `npx playwright`.

- **`node`** é o motor de render: `templates/gerar.js` monta os slides em HTML e
  `scripts/compor.js` encaixa o corte na janela (medindo a caixa via Playwright).
- **`python3`** roda a ancoragem (`scripts/ancorar.py`) e, quando não há legenda,
  a transcrição (`scripts/transcrever.py`).
- **`yt-dlp`** só entra quando a fonte é um link (YouTube ou 1000+ sites). Vídeo
  local não precisa dele.

**Transcrição (opcional, só quando não há legenda automática):** por padrão usa
**Whisper local, grátis, sem chave** (`pip install openai-whisper`). Quem tiver
`ASSEMBLYAI_API_KEY` no `.env` pode usar AssemblyAI pra ir mais rápido. Se a
fonte já tem legenda automática (caso comum no YouTube), nada disso é necessário.

---

## Fase 1 — Material

O objetivo desta fase é sempre o mesmo, não importa de onde vem o vídeo: terminar
com **dois arquivos** na pasta de trabalho — o **vídeo** (`video.mp4`) e um
**`.srt` na linha do tempo real** (`video.pt.srt`). A partir daí, todas as fases
seguintes são idênticas.

Escolher **um** dos três caminhos conforme a fonte:

### Caminho 1 — Link do YouTube com legenda automática (o melhor caso)

```bash
yt-dlp -f "bv*[height<=1080]" -o "video.%(ext)s" <url>
yt-dlp -f "ba" -o "audio.%(ext)s" <url>
yt-dlp --write-auto-sub --sub-lang pt --sub-format srt --convert-subs srt \
       --skip-download -o "video" <url>
yt-dlp --write-info-json --skip-download -o "video" <url>
```

**A legenda automática é a fonte de timecode mais confiável quando existe**,
porque já vem na linha do tempo do vídeo publicado. Nunca usar transcrição do
projeto de edição: muito canal publica com correção de velocidade, e o erro
cresce ao longo do vídeo.

O `info.json` costuma valer ouro pro texto dos slides: a descrição já traz a
tese e as perguntas que o vídeo responde, escritas pelo dono do canal. Ler
`description`, `title`, `tags` e `chapters` antes de escrever qualquer slide.
`chapters` é bônus quando existe, nunca dependência: muito vídeo vem sem.

**Confere se a legenda baixou.** Se o `video.pt.srt` não apareceu (o vídeo não
tem auto-sub em pt), cair pro Caminho 2.

### Caminho 2 — Link sem legenda, ou de outra plataforma

Baixa o vídeo por yt-dlp (funciona em 1000+ sites: Instagram, TikTok, Vimeo,
etc.) e **gera o `.srt` transcrevendo o áudio publicado**:

```bash
yt-dlp -f "bv*[height<=1080]+ba/b" -o "video.%(ext)s" <url>
yt-dlp --write-info-json --skip-download -o "video" <url>   # se houver
python3 scripts/transcrever.py video.mp4 -o video.pt.srt --idioma pt --modelo medium
```

Isso **não fere a regra** "nunca usar transcrição": o aviso é contra a
transcrição do projeto de edição (dessincronizada pela correção de velocidade).
Aqui a transcrição é do **áudio já publicado**, então o timecode está na linha
do tempo real, igual a auto-sub seria.

### Caminho 3 — Arquivo de vídeo local na máquina

Nem baixa nada. Usa o arquivo direto e transcreve:

```bash
cp "<caminho do arquivo>" video.mp4          # ou trabalhar no lugar
python3 scripts/transcrever.py video.mp4 -o video.pt.srt --idioma pt --modelo medium
```

> **Sobre o modelo do Whisper:** o default `medium` ancora bem mas é lento num
> Mac sem GPU (~1x a duração do vídeo). O `base` é rápido mas o timecode por
> palavra derrapa e vira corte que abre no meio da oração. Só usar `base` se for
> apenas LER a transcrição pra escolher trecho; pra cortar em cima dela, `medium`.

---

## Fase 2 — Medir o material antes de prometer

Duas medidas antes de qualquer coisa (basta ler o `.srt`):

- **duração do vídeo.** Vídeo de 5 a 8 min entrega 5 a 7 cortes bons. De 20
  min, 7 a 10. Não prometer 10 slides de vídeo pra um vídeo de 6 min
- **pontuação da legenda.** Contar `.` e `?` no `.srt`. Se der **zero**, é
  legenda crua, e nenhum método que dependa de pontuação vai funcionar

> A legenda automática do YouTube **às vezes vem sem um único ponto final**.
> Medido em 08/2026: um vídeo de 2026 trouxe 57 pontos em 1028 palavras, e um
> de 2024 trouxe **0 em 863**. É por isso que esta skill não usa pontuação como
> critério em lugar nenhum. (A transcrição do Whisper costuma pontuar, mas o
> método abaixo não depende disso de qualquer forma.)

## Fase 3 — Achar os cortes pelo SENTIDO

**Ler a transcrição inteira com timecode** e escolher trechos que sejam unidade
de sentido fechada: começam uma ideia e terminam ela. Não escolher por relógio,
não depender de ponto final, não pedir pro script decidir.

Pra cada trecho escolhido, ancorar na linha do tempo real:

```bash
python3 scripts/ancorar.py audio.webm video.pt.srt \
  "<frase que abre>" "<frase que fecha>"
```

> Se estiver no Caminho 2 ou 3 (sem `audio.webm` baixado à parte), passar o
> próprio `video.mp4` como primeiro argumento: o ffmpeg lê o áudio dele igual.

O script faz as duas coisas que leitura nenhuma faz:

1. empurra o ponto pra respiração real mais próxima, **e só se ela estiver
   dentro de uma janela apertada.** Silêncio longe não é a pausa daquela frase,
   e usar ele engole a frase vizinha
2. devolve as palavras que o intervalo **realmente** pega, pra conferir que o
   corte abre e fecha onde se pediu

Saída típica:

```
  entra  33.84  sai  58.17  (24.3s)  respiracao: NAO/NAO
  ABRE:  ninguém nasce com essa disposição e que
  FECHA: ...ter que passar por isso então você
  ffmpeg -ss 33.84 -t 24.33
```

**Sempre conferir a linha `ABRE:`.** Se ela não começa onde se pediu, o corte
vai abrir no meio de uma oração, que é o defeito fatal num slide de carrossel:
não existe rampa, a pessoa desliza o dedo e cai ali.

`respiracao: NAO` não invalida o corte, avisa que ali não havia pausa detectável
e o script usou o tempo da palavra com folga. Em áudio produzido (comprimido,
tratado) isso é comum, porque quase não sobra silêncio abaixo de -32dB.

**Duração:** o teto é 57s (o Instagram corta em 60s por slide). **Não existe
piso fixo.** Slide de 13s costuma ser melhor que de 25s: ninguém para 25
segundos num slide. Deixar a unidade de sentido mandar.

## Fase 4 — Olhar o que aparece na tela (obrigatório)

```bash
ffmpeg -y -ss <t> -i video.mp4 -frames:v 1 -vf scale=320:-1 chk-<t>.jpg
```

Três ou quatro frames por corte finalista, e **olhar de verdade**. Procurar:

- **b-roll**: o texto pode estar ótimo e a imagem ser paisagem, gráfico ou mão
  digitando. A janela mostra a imagem, não o texto
- **créditos e cartelas de fim**: o vídeo encolhe, entra ficha técnica, o rosto
  vira miniatura ilegível
- **legenda queimada**: conflita com o texto do slide, que já carrega o sentido
- **enquadramento**: apresentador pequeno num canto some dentro da janela

> **Não existe atalho barato pra isso.** Testado em 08/2026: `select='gt(scene,0.4)'`
> no vídeo inteiro **não achou nada**, nem os créditos finais nem as trocas de
> plano do multicam, porque a transição era suave em vez de corte seco. O check
> é olhar frame, mesmo. Custa 3 ou 4 JPEGs de 320px por corte.

Achou problema, voltar pra Fase 3 e reancorar fechando antes.

## Fase 5 — O texto vem DEPOIS do corte

Ler o trecho, e só então escrever o slide. O texto é o **degrau que entrega a
fala**, não um resumo dela. Escrever antes e caçar um corte que sirva é o que
produz slide onde o título promete uma coisa e o áudio começa em outra.

- slide de vídeo: corpo curto, uma ou duas linhas. O vídeo carrega
- slide de texto: três ou quatro linhas

**Sem legenda queimada no corte.** O vídeo entra como presença e gesto; quem
carrega o sentido é o texto do slide, lido primeiro. O corte precisa funcionar
mudo.

## O CTA — combinar ANTES de montar (obrigatório)

O último slide é o CTA, e ele não se inventa sozinho. **Antes de montar/renderizar,
perguntar pra pessoa o que ela quer no CTA**, oferecendo os três caminhos:

> Antes de fechar, o CTA (último slide): tu quer
> 1. me dizer o CTA (ex: "salva pra testar", "comenta X", "manda pra um sócio")
> 2. eu te dou 2-3 opções pra escolher (recomendado)
> 3. eu escolho um que combine com o conteúdo

Se a pessoa pedir opções (2) ou deixar comigo (3), **mostrar as opções escritas
antes de montar** — não escolher calado. Lembrar da regra que manda em tudo: o
CTA pede uma ação (salvar, comentar, mandar pra alguém), nunca um clique pra
assistir o vídeo. Só seguir pro render depois que o CTA estiver combinado.

## Fase 6 — Render e composição

Copiar `templates/gerar.js`, preencher `MARCA` a partir do design-guide e
`SLIDES` com o conteúdo. Depois:

```bash
node gerar.js
./cortes.sh video.mp4 audio.webm ./cortes
node scripts/compor.js slide-XX.html cortes/corte-XX.mp4 slide-XX.mp4
npx playwright screenshot --viewport-size=1080,1350 --full-page \
  "file://$PWD/slide-XX.html" slide-XX.png     # slides sem vídeo
```

O `compor.js` renderiza o mesmo HTML em duas passadas (o chassi com a janela
vazia, e uma máscara de alfa) e deixa o ffmpeg encaixar. Ele **mede a caixa da
janela lendo o layout**, então nenhuma coordenada fica chumbada: mexer no CSS
não quebra o encaixe. O contrato são só três classes: `.janela`,
`.janela-barra`, `.janela-midia`.

## Fase 7 — Tudo em MP4

```bash
scripts/png-para-mp4.sh slide-XX.png 4
```

> 🔥 **O Instagram reagrupa carrossel misto por tipo: todas as imagens primeiro,
> depois todos os vídeos.** Herdado da skill original, provado nos dois sentidos
> em post real (05/08/2026): misto embaralha a ordem, tudo em MP4 preserva.
> Por isso os slides de texto viram MP4 de ~4s com a imagem parada. Custa uns
> 300KB por slide e não muda nada visualmente. O script põe trilha muda de
> propósito: item de vídeo sem áudio nenhum é outro jeito de sair estranho.

## Fase 8 — Ver o resultado (padrão, sempre)

Depois que os 10 itens estão em MP4, **gerar e abrir a paginazinha de preview**,
sempre, sem a pessoa precisar pedir:

```bash
node scripts/preview.js . "Carrossel — <tema>"
```

Ela varre os `slide-*.mp4`, monta um `preview.html` com os slides em ordem e abre
no navegador. É onde a pessoa vê que ficou bom antes de publicar (as legendas
animam, a ordem aparece, dá pra passar o mouse pra tocar). Passa a fonte de
verdade da entrega: some com a dúvida de "será que ficou certo?".

Entregar os arquivos e **parar aqui**. A publicação é da pessoa.

---

## Vídeo em outro idioma (cross-language)

Quando o vídeo-fonte está num idioma e o carrossel vai sair em outro (ex: vídeo
em inglês, carrossel em português), duas coisas mudam:

1. **O texto dos slides sai no idioma do carrossel.** Ler a transcrição na língua
   de origem (baixar a auto-sub da língua de origem, ou `transcrever.py --idioma
   <origem>`), entender, e escrever o slide já traduzido/adaptado — não traduzir
   ao pé da letra, adaptar pro jeito de falar do canal.
2. **O clipe embutido ganha legenda queimada no idioma do carrossel.** Aqui a
   regra "sem legenda queimada" se inverte: como o áudio está numa língua que a
   audiência não acompanha, a legenda traduzida no clipe é o que deixa o corte
   fazer sentido. (Em vídeo do mesmo idioma, seguir sem legenda queimada: o texto
   do slide já carrega o sentido.)

Queimar a legenda no clipe, sem depender de libass (muita build de `ffmpeg` não
tem o filtro `subtitles`):

```bash
# 1. um .srt com timecode RELATIVO ao clipe (começa em 00:00:00), traduzido
# 2. queima via Playwright (renderiza cada cue em PNG e sobrepõe com overlay)
node scripts/legendar.js cortes/corte-XX.mp4 legendas/corte-XX.srt cortes/corte-XX-leg.mp4
```

Depois é o clipe **legendado** (`corte-XX-leg.mp4`) que entra no `compor.js`. O
`legendar.js` usa o mesmo Playwright do `compor.js`, então não pede dependência
nova. Estilo da legenda (fonte, caixa, posição) fica no topo do script.

> Provado em 08/2026 num vídeo do Futurepedia (inglês → carrossel pt): os 6
> cortes ganharam legenda pt queimada e o texto dos slides saiu em pt. A caixa
> escura semitransparente da legenda lê bem tanto em clipe de fundo escuro quanto
> claro.

---

## Ritmo

Agrupar os vídeos em pares e trios, não alternar um a um. O leitor entra num
bloco de fala e continua, em vez de trocar de modo a cada slide. Um slide de
texto que repete o que o vídeo do lado falou deve sair, não ser reescrito.

Exemplo de 10 slides que funcionou: vídeo nos 1-2, texto no 3, vídeo nos 4-5-6,
texto no 7, vídeo nos 8-9, CTA no 10.

## Travas que não se negociam

| | |
|---|---|
| **10 itens** por carrossel | doc da Meta: "Carousels are limited to 10 images, videos, or a mix of the two" |
| **60s** por slide de vídeo | acima disso não é carrossel, é Reel |
| **Todo item em MP4** | senão o Instagram reagrupa e embaralha a ordem |
| **1080x1350** | o formato do slide |
| **TikTok fora** | o modo foto de lá não aceita item de vídeo no meio |

## Anatomia do slide-vídeo

Texto em cima, janela com moldura embaixo. Foram testadas e descartadas a
versão full-bleed (encaixar 16:9 num slide 4:5 corta demais) e a bolha no canto
(pequena demais pra ler expressão).

| | |
|---|---|
| slide | 1080 x 1350, padding 72px topo e laterais, 140px embaixo |
| janela | 930px de largura, borda 3px, raio 20px |
| barra | 64px, padding lateral 26px, rótulo 19px peso 700 caixa alta |
| caixa útil | 16:9 exato, pra o 1920x1080 entrar só escalando |

**Nunca botão de play sobre o rosto.** Tapa a cara e é redundante: o Instagram
já desenha o indicador de vídeo por cima.

**Fundos, cada um com uma função:** escuro na capa e nos slides de texto, claro
no miolo com vídeo, cor cheia no slide de soco e no CTA. A capa fica escura
mesmo levando vídeo: se todos os slides com vídeo forem claros, o claro deixa
de marcar coisa nenhuma.

## Por que o corte mudou (em relação à skill interna do Ratos)

A skill original acha os cortes cruzando as pausas do áudio com a **pontuação**
da transcrição, e marca `OK` os que fecham em ponto final. Isso funciona no
material dela: vídeo longo, falado emendado, legenda pontuada.

Em vídeo de canal qualquer, os dois pilares caem. A legenda pode vir sem
pontuação nenhuma, e aí o filtro de qualidade **desliga sem dar erro**: o
script roda, devolve dezenas de candidatos e nenhum marcado `OK`. Medido em
08/2026: 25 candidatos, zero `OK`, e os melhores abriam em "do que andar
rapidamente" e "nasce com essa disposição", no meio da oração.

A saída é inverter os papéis. Quem entende a fala decide onde cortar, lendo a
transcrição, e a pontuação deixa de importar (o sentido está lá mesmo sem
ponto). O script vira **verificador**: mede se ali existe respiração e devolve
as palavras que o intervalo realmente pega. Semântica de quem lê, precisão de
quem mede.

---

## Atualizar a skill

Quando sair uma versão nova, o fluxo é o mesmo das outras skills da Ratos:

1. Ler o `CHANGELOG.md` (um arquivo só) e comparar com o `VERSION` local
2. Aplicar as mudanças por arquivo, da versão mais antiga pra mais nova
3. **Nunca sobrescrever** o `marca/design-guide.md` já preenchido nem o `.env`:
   fazer backup `.bak` antes de editar qualquer coisa e, se o bloco local
   divergir do "ANTES" do changelog, é customização — não sobrescrever cego
4. Validar os scripts no fim (`python3 -m py_compile scripts/*.py`,
   `node --check scripts/*.js templates/*.js`) e atualizar o `VERSION`

Pra pedir: cola "checa a atualização da skill carrossel-video-ratos e aplica".
