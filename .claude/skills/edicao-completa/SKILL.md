---
name: edicao-completa
description: Edita 100% de um vídeo bruto de cliente e entrega o MP4 final pronto pra postar (Reels 1080x1920), no padrão premium da Lince. Recebe o bruto, o direcionamento e a ID visual do cliente; corta erro, repetição e pausa, acelera de leve, alterna tela cheia e tela dividida com inserções animadas (lista, cartões, ilustração), legenda dinâmica palavra a palavra, zoom contínuo e soco de zoom, trilha com ducking e efeitos sonoros, tratamento de cor e de voz, cobre o que veio queimado no vídeo (caixinha, texto do story) e fecha com cartão final animado. Confere sozinha antes de entregar. Use quando o Francisco mandar um vídeo bruto pra editar, disser "edita esse vídeo", "edição completa", "me entrega o vídeo pronto", "caixinha de perguntas pra reels", "deixa mais premium", "vídeo do cliente X pra editar", ou mandar um vídeo junto com a ID de um cliente.
---

# Edição completa

O Francisco manda o bruto, o direcionamento e a ID do cliente. A skill devolve o MP4 final.
Sem pergunta no meio, a não ser que falte algo que só ele sabe (passo 1). As decisões de
corte e de edição ela toma sozinha e justifica na entrega, e ele corrige depois.

Os scripts ficam em `scripts/` desta skill:

| script | faz |
|---|---|
| `transcrever.py` | faster-whisper local, tempo por palavra, JSON |
| `montar_caixinha.py` | **o caminho padrão pra caixinha de perguntas**: estilo da casa medido nos vídeos da cliente (tela cheia, adesivo nativo, salto/aproximação, flash no primeiro corte, legenda Montserrat + Playfair Italic) mais o impacto que o Francisco pediu: inserções de vídeo de banco na metade de baixo, camada de SFX, voz limpa. Formato do plano: `plano-v5.json` do exemplo |
| `gerar_sons.py` + `sons/` | efeitos sintetizados; `clique` nos saltos, `whoosh` na entrada de inserção, `ding` na frase-chave, `boom` na ênfase, `flash` no flash |
| `montar.py` | o motor "editorial" (tela dividida com inserções, legenda palavra a palavra, cartão final). Serve pra vídeo de extração ou quando o cliente não tem design system de vídeo |
| `apagar_texto.py` | apaga texto queimado e parado (legenda do story) por inpainting, só nos traços das letras. Gera o `bruto-limpo.mp4` que vira a fonte |
| `gerar_sons.py` | sintetiza os efeitos (clique, flash de câmera, boom, ding, pop, sino, subida, impacto, whoosh) e uma trilha de teste com pulso em `sons/`. Roda uma vez por máquina, porque os `.wav` ficam fora do git |
| `montar_v1.py` | a versão antiga, com tarja de legenda e sem tela dividida. Só pra referência |
| `palavras_para_words.py` | converte o JSON do `transcrever.py` pro formato `--words` da ffmpeg-skill (ver "A conferência usa a ffmpeg-skill", abaixo) |

Precisa de ffmpeg, Python com `faster-whisper` e numpy, e os modelos em
`~/.cache/huggingface`. Nesta máquina tudo isso já está instalado. O Whisper roda na CPU,
porque a GPU não tem as DLLs do CUDA: o large-v3 leva uns 2 minutos e meio por minuto de
vídeo, sempre em segundo plano. Se `sons/` estiver vazia, roda o
`gerar_sons.py <skill>/sons` antes.

**A conferência usa a ffmpeg-skill** (`~/.claude/skills/ffmpeg-skill`, instalada em
2026-10-21 com `npx ffmpeg-skill`; `npx ffmpeg-skill doctor` confere a máquina). Ela só mede e
corrige formato: `check.py`, `look.py`, `loudness.py`, `audio.py`. Quem decide o corte e a
edição continua sendo esta skill. Se a pasta não existir, instala com o mesmo comando; se
faltar, a conferência volta a ser à mão (`ffprobe`, `ebur128`, folha com ffmpeg). Dois
cuidados: nesta máquina o Python é `python`, não `python3`, e o `--transcribe` embutido dela
quebra com o `huggingface_hub` 1.33 (`metadata_errors`). Transcrição é sempre do
`transcrever.py`; pra ela ler, passa pelo `palavras_para_words.py` e `--words`.

**Antes de qualquer edição, ler `historico/licoes.md`**: é a lista do que o Francisco já
reprovou. O histórico de cada vídeo fica em `historico/<data>-<cliente>-<assunto>.md`, versão
a versão, com o comentário dele e o que mudou; toda entrega nova acrescenta uma entrada lá.

## 1. Receber

- **Bruto**: o caminho do arquivo, em geral na pasta "vídeo pro claude code editar" da área
  de trabalho. Copia pra `clientes/<cliente>/conteudos/AAAA-MM-DD-<assunto>/bruto.<ext>`.
  Vídeo e áudio ficam fora do git (já estão no `.gitignore`).
- **Direcionamento**: o tipo do vídeo, onde vai sair, a duração alvo, a mensagem, o CTA. Se
  faltar o formato, assume Reels 9:16. Só pergunta o que mudaria o corte.
- **ID**: procura `clientes/<cliente>/marca/id-video.json`. Se não existir, cria a partir do
  que ele mandou: as 4 cores (`claro`, `amarelo`, `vermelho`, `vinho`, ou o equivalente da
  paleta), a fonte de título, a fonte de apoio e o cartão final. Fonte que não está instalada:
  usa a mais próxima e anota no campo `fonte_titulo_obs`.
- **Design system de vídeo do cliente**: procura `clientes/<cliente>/marca/design-system-video.md`.
  Se existir, ele manda em tudo (fontes, posição, ritmo, som) e o `montar_caixinha.py` já o
  segue. Se não existir e o cliente tem vídeo editado no Drive, **mede antes de editar**:
  baixa 3 a 6 vídeos (o conector do Drive não serve pra MP4; o link direto
  `drive.usercontent.google.com/download?id=…&confirm=t&uuid=…` serve, pegando o `uuid` da
  página de aviso de vírus), tira folha de contato, mede zoom por segmento pela largura de um
  elemento fixo, detecta cortes por diferença de frame, mede nível da trilha pelo canal lateral
  do estéreo, dá zoom em frames pra identificar as fontes, e escreve o `design-system-video.md`
  com números. Foi assim com a Dra. Gabriela em 2026-10-14; o doc dela é o modelo.
- **Referências do Instagram**: não baixam sem login (yt-dlp e o navegador deslogado devolvem
  "indisponível"). Pede o arquivo ou o Drive.

## 2. Olhar e transcrever

```bash
ffprobe ...                                                    # duração, resolução, fps
ffmpeg -i bruto -vf "fps=1/6,scale=240:-1,tile=5x2" -frames:v 1 frames/contato.jpg
python scripts/transcrever.py bruto.mov -o transcricao.json --modelo large-v3
```

Olha a folha de contato **antes** de planejar. Vídeo exportado do story vem com coisa
queimada na imagem. Pra achar a posição exata, lê um frame em rgb24 com numpy e procura as
linhas com muito branco puro. O que fazer com cada coisa:

- **adesivo da caixinha**: fica. É nativo e a casa não cobre (`montar_caixinha.py`).
- **texto fixo do story** (a legenda que a cliente digitou): `apagar_texto.py` com a região,
  que gera o `bruto-limpo.mp4`. Sobra um leve borrão no lugar, invisível em movimento.
- Só no motor editorial (`montar.py`) vale recortar o quadro pra deixar o texto fora; a tarja
  da v1 foi reprovada por ficar feia.

Fontes: libass só enxerga fonte instalada no `C:\Windows\Fonts` ou registrada via GDI; fonte
por usuário precisa de `AddFontResourceW` + broadcast (o PowerShell da sessão de 2026-10-14
faz isso) ou do parâmetro `fontsdir` do filtro `ass`, que o `montar_caixinha.py` já passa.
Fonte variável (`[wght].ttf`) não serve; baixar as estáticas pela API de CSS do Google Fonts
com User-Agent `curl`.

## 3. Planejar (`plano.json`)

**Corte**: o gancho fica nos primeiros 3 segundos (na caixinha, a própria pergunta). Sai o
erro, a frase refeita, a repetição e a enrolação. Pausa acima de ~0,25s é aparada, medindo no
**áudio** (RMS ou `silencedetect`), nunca pelo tempo do Whisper. O ponto exato de cada corte
fica logo antes da explosão de energia da primeira palavra boa, medida em janelas de 5 a 10ms.

**Edição magnética** (o padrão desde 2026-10-14, v3). O que separa o básico do premium
não é mais efeito, é ritmo e intenção: nada fica parado mais de 3 segundos, cada som
combina com o que acontece na imagem, e cada palavra tem um peso.

- `velocidade` 1.05 a 1.10. Acelera sem mudar o tom da voz.
- **Ritmo**: na tela cheia o enquadramento muda num salto seco a cada 2,4 a 3,3s (`ritmo`),
  sempre em fronteira de frase (pausa ≥ 0,1s ou pontuação); fala corrida sem fronteira corta
  no começo de uma palavra mesmo. Cada salto leva um `clique` baixinho. Os zooms ciclam
  `[1.0, 1.12, 1.05, 1.18]`; acima de 1.2 a pessoa sai do quadro quando se mexe, e o
  2x de upscale do bruto 720p começa a aparecer.
- **Transição** entre tela cheia e tela dividida: flash de câmera (frame claro que some em
  220ms) com o som de obturador. O vídeo abre com o mesmo flash. Whoosh só se pedirem.
- **Tela dividida** sempre que a fala enumera ou cita algo que dá pra mostrar: uma lista vira
  `lista` (pílulas que acendem uma a uma, com pop, no momento em que ela fala), nomes e
  conceitos viram `cartoes` (com ding), e um conceito visual vira uma ilustração (hoje só a
  `mitocondria`, vetor em ASS com faíscas amarelas). O resto fica em tela cheia.
- **Ênfase** (`enfase`): soco de zoom (1.22 por 0,8s) com `boom` numa palavra forte.
- **Legenda palavra a palavra**: blocos de até 3 palavras / 14 caracteres. Cada palavra
  entra sozinha, no tempo em que é falada, com pop (60% → 110% → 100%); a palavra falada
  fica amarela e volta pra clara quando a próxima entra; palavra-chave (`destaques`) fica
  amarela e 14% maior. Na tela cheia, letra clara com contorno vinho e sombra; na tela
  dividida, vinho sobre o fundo claro com a ativa em vermelho. As `grandes` (3 ou 4 por
  vídeo: a palavra que carrega a mensagem) viram um bloco só, enorme, mais alto na tela,
  com giro de -2,5° a 0 e ding. Sem "né", sem palavra repetida.
- **Caixinha**: o adesivo queimado fica em `caixa_bruto` (pixels do bruto); a caixa de
  cobertura é recalculada por enquadramento, então ela salta junto com o corte, como se
  estivesse na cena. O `centro_zoom` x fica no centro do adesivo pra ele nunca andar.
- **Cor** (`visual`): curva S leve, +8% saturação, meio-tons mais quentes, vinheta e grão
  fino temporal. É o que tira a cara de "vídeo de celular".
- **Som**: trilha em -20 dB com ducking pela voz, sobe +8 dB no cartão final. Voz com
  passa-alta, redução de ruído, EQ de presença e compressor.
- **Cartão final**: fundo vinho, nome subindo, fio amarelo se desenhando, CTA; subida e
  impacto.

Formato (exemplo real: `clientes/gabriela-castello/conteudos/2026-10-14-caixinha/plano-v3.json`):

```json
{
  "fonte": "bruto.mov", "transcricao": "transcricao.json", "id": "../../marca/id-video.json",
  "saida": "final.mp4", "velocidade": 1.08,
  "trechos": [{"ini": 0.0, "fim": 3.75, "obs": "por que"}],
  "enquadramento": {
    "cheia":    {"recorte": [x, y, w, h], "centro_zoom": [0.5, 0.16]},
    "dividida": {"recorte": [x, y, w, h], "altura_video": 1040}
  },
  "cobrir": {"pergunta": {"caixa_bruto": [x, y, w, h], "folga": 34, "texto": "...", "rotulo": "PERGUNTA DA CAIXINHA"}},
  "legenda": {"y_cheia": 1420, "y_grande": 1180, "y_dividida": 812, "max_caracteres": 14, "max_palavras": 3,
              "grandes": ["cansaço", "fã", "mitocôndria"]},
  "ritmo": {"intervalo": [2.4, 3.3], "zooms": [1.0, 1.12, 1.05, 1.18], "som": "clique", "ganho_db": -15},
  "transicao": {"tipo": "flash", "som": "flash"},
  "visual": {"grao": 5, "vinheta": 0.62, "saturacao": 1.08},
  "insercoes": [
    {"tipo": "lista", "de": "palavra", "ate": "palavra", "titulo": "...", "itens": [["Rótulo", "gatilho"]]},
    {"tipo": "cartoes", "de": "nad", "ate": "resposta", "titulo": "...", "itens": [["NAD", "gatilho", "subtítulo"]]},
    {"tipo": "mitocondria", "de": "ajudam", "depois_de": "resposta", "ate": "fim", "titulo": "...", "texto": "...", "gatilho": "mitocôndria"}
  ],
  "enfase": [{"palavra": "fã", "zoom": 1.22, "dur": 0.8, "som": "boom"}],
  "musica": {"arquivo": "<caminho>/trilha.wav", "volume_db": -20},
  "sons": "<caminho da skill>/sons",
  "cartao_final_seg": 2.8,
  "manter_maiuscula": ["NAD"], "remover_da_legenda": ["né"], "destaques": ["..."]
}
```

Os gatilhos são palavras da fala, procuradas na transcrição do áudio já cortado, uma depois da
outra. Por isso o plano não guarda tempo de inserção nenhum, e mudar um corte não desalinha
nada. `recorte` e `caixa_bruto` ficam em pixels do bruto; o script converte pra saída
por enquadramento.

### Caixinha no estilo da casa + impacto (v5, o padrão desde 2026-10-14 à noite)

O Francisco aprovou a base da v4 (adesivo nativo, tipografia e ritmo da casa) e pediu de volta
o impacto da v3. O que entra, e com que medida:

- **Legenda**: Montserrat 64 px, Playfair Italic 104 px (a v4 com 52/86 estava pequena).
  Maiúscula no começo de frase: depois de `.?!` **ou** depois de pausa ≥ 0,5 s. Itálico sem
  vírgula no fim. Palavras que o Whisper inventa depois da última que existe no bruto
  ("obrigada", "Patrícia") são descartadas.
- **Dose de inserção** (v6): 6 a 9 por minuto, 30 a 50 % do tempo coberto, como nos vídeos de
  extração dela. Três tipos no plano: `"modo": "cheia"` (stock em tela inteira, com
  `"texto": [{"gatilho", "linha"}]` empilhando linhas em Playfair Italic caixa alta à
  esquerda), `"tipo": "cartao"` (`titulo` em Playfair Black caixa alta + caixa vinho com
  `subtitulo` em Montserrat caixa alta, sobre ela) e `"modo": "baixo"` (metade de baixo).
  Em tela inteira e cartão a legenda corrida some. Exemplo: `plano-v6.json`.
- **Inserções em tela dividida** (`insercoes`): vídeo de banco cobre a metade de baixo
  (1080x960, corte seco, sem borda), ela sobe 150 px, a legenda vai pra y 915, logo acima da
  divisa. É o layout dos vídeos de extração dela. Cada inserção dura 2,4 a 3,2 s e entra na
  palavra-gatilho; numa lista falada elas emendam uma na outra (montagem), mas só depois de
  `insercao_minima` (2,2 s); gatilho que cai no meio de outra é pulado. Whoosh na entrada,
  clique na saída.
- **Vídeo de banco**: Mixkit (`mixkit.co/free-stock-video/<categoria>/`, sem chave; as
  páginas trazem JSON-LD com `name`, `contentUrl` e `copyrightNotice`). Só usar item
  `copyrightNotice: Free`; os "Restricted" ficam fora. Créditos em `banco/creditos.json`.
  Nunca clipe de vírus pra ilustrar célula/hormônio de médico. Os MP4 ficam fora do git.
- **SFX**: clique em 1 a cada 2 saltos (-19 dB), whoosh na inserção (-13), ding na frase-chave
  em tela cheia (-18), boom na ênfase (-9), obturador no flash (-12). Trilha em -26 dB com
  ducking. Mais que isso vira ruído; menos que isso o Francisco sente "só legendou e cortou".
- **Voz** (`"voz": "limpa"`): RNNoise (`modelos/sh.rnnn`) + afftdn + gate curto + corte em
  280 Hz + presença em 3,2 kHz + de-esser + compressor. Medido: cauda de eco em 300 ms cai de
  -14 pra -23 dB. **A legenda é sempre transcrita do áudio sem limpeza**, porque a limpeza
  confunde o Whisper. A voz é processada num ffmpeg à parte e saneada em numpy (`voz-tratada.wav`):
  o RNNoise/afftdn deste build cospe NaN ao esvaziar o buffer e derruba o grafo grande.
  DeepFilterNet não compila aqui (precisa de Rust).

## 4. Montar

```bash
python scripts/montar.py <pasta>/plano.json --rascunho   # rápido, pra conferir
python scripts/montar.py <pasta>/plano.json              # final, crf 18
```

O que o script faz sozinho:

1. Corta e acelera o áudio e trata a voz: passa-alta, redução de ruído, EQ de presença e
   compressor. Depois **transcreve o áudio cortado**: a legenda e os gatilhos saem dessa
   transcrição.
2. Descarta palavra fantasma, que é a palavra que não existe no bruto e cai em trecho sem voz.
3. Desenha tudo em ASS/libass na ID do cliente.
4. Vídeo: monta os dois enquadramentos, aplica o zoom por segmento (zoompan sobre 1,5x da
   saída, pra não tremer), sobrepõe a tela dividida nos intervalos das inserções, faz o
   tratamento de cor e congela o último frame embaixo do cartão final.
5. Mixa voz, trilha (com ducking) e efeitos, e normaliza em -14 LUFS.

Pegadinha já resolvida: o zoompan e o tpad bagunçam o tempo dos quadros. O script renumera
com `setpts=N/(FPS*TB)` depois de cada um. Sem isso, o vídeo acaba antes do áudio e o cartão
final some.

## 5. Conferir (sempre, antes de entregar)

Os três comandos abaixo são da ffmpeg-skill (`F=~/.claude/skills/ffmpeg-skill/scripts`).
Nenhum deles reescreve o final; o único que grava é o `loudness.py`, num arquivo novo.

1. **Especificação do Reels**: `python $F/check.py <final>.mp4 --platform reels`. Tem que
   dar 0 falhas. As linhas de formato (codec, pixel format, tamanho, cor, VFR) se corrigem
   sem perguntar; as de julgamento (duração, proporção, fps) mudam conteúdo, então é
   dizer o que foi e por quê. O aviso "subtitles none" é esperado: a legenda da casa é
   queimada, não muxada. Confere também, no `--json`, que vídeo e áudio têm a mesma
   duração.
2. **Folha de contato com a zona segura**: `python $F/look.py <final>.mp4 --tiles 3x3
   --safe reels -o <pasta>/<final>_sheet.png` e **olhar o PNG**. A `--safe reels` sombreia
   o que a interface do Instagram cobre. O que se procura: legenda da tela cheia no peito,
   não no rosto, e fora da faixa sombreada; cartão e lista dentro da área útil; adesivo
   nativo íntegro (fica na faixa de cima, que é dele mesmo); nenhum frame com zoom
   mostrando o texto apagado. Pra um momento específico, `--at <segundos>`. Pra comparar
   duas versões no mesmo instante, `look.py v5.mp4 --compare v6.mp4 --at <segundos>`.
3. **Loudness**: o `check.py` já mede. Se der fora de -14 ± 2 LUFS ou pico acima de
   -1 dBTP, não remonta: `python $F/loudness.py <final>.mp4 -I -14 --tp -1.5 -o
   <final>-loud.mp4`. É o loudnorm em duas passagens, o vídeo sai copiado sem reencode e
   o arquivo é medido de novo até bater o alvo. Roda o `check.py` de novo no resultado e
   entrega esse. (O montador já faz uma passagem de loudnorm; esta é a correção, não a
   regra.)

Depois disso, o que a ferramenta não vê:

- **Transcrição do corte**: lê inteira. Toda emenda soa como frase?
- **Palavra de preenchimento**: opcional, só se sobrou "é, é", "hum" que o corte não pegou.
  `python scripts/palavras_para_words.py <pasta>/transcricao.json -o <pasta>/words.json`,
  depois `python $F/silence.py <final>.mp4 --filler --filler-lang pt --words
  <pasta>/words.json --filler-list`. A lista de português dela tem só "hum" e "é", e "é"
  costuma ser palavra de verdade: a lista é pra olhar, e o corte continua sendo do plano.
- **Voz ecoada ou com ruído** que o tratamento do montador não resolveu: `python
  $F/audio.py <final>.mp4 --voice medium -o <final>-voz.mp4` antes do loudness, e ouvir.

## 6. Entregar

- Copia o MP4 pra pasta de onde o bruto veio, com o nome `<assunto>-<cliente>-FINAL[-vN].mp4`.
- Diz pro Francisco, curto: a duração antes e depois, o que saiu e por quê, o que entrou, e o
  que precisa do olho dele (fonte substituta, CTA presumido, trilha de teste, afirmação técnica
  estranha na fala do médico). Conteúdo médico não se corrige sozinho, só se aponta.
- O que ele corrigir vira regra aqui (seção 3) ou no `id-video.json` do cliente.

## Limites

- **Trilha**: a de `sons/` é sintetizada e serve só pra teste. A de verdade é da biblioteca
  do Instagram, colocada na hora de postar, ou uma faixa livre que ele mandar.
- **Imagem**: ilustração gerada por IA precisa de chave (Gemini ou OpenAI), que hoje não está
  configurada. Sem ela, a ilustração é vetorial.
- **B-roll**: só se vier junto.
- **Motion design pesado**: fica com o Mateus ou o Victor, ou no Remotion, que exige licença
  paga pra empresa com mais de 3 pessoas.
