# Backend: ffmpeg

O caminho sem app: corta com `ffmpeg` direto. Roda em qualquer OS, sem GUI, sem
licenca. E o default quando nao tem Palmier.

Requisitos: `ffmpeg` + `ffprobe` no PATH. Pra hook: `pip install Pillow`.

---

## Fluxo

Pra cada corte decidido: **cortar -> (hook) -> verificar**.

```bash
# 1. cortar (re-encoda de proposito, ver nota abaixo)
bash helpers/cortar.sh fonte.mp4 132.5 168.0 cortes/01-tema.mp4 --vertical

# se o assunto nao esta no centro da tela, desloca o crop (ver "crop" abaixo):
bash helpers/cortar.sh fonte.mp4 132.5 168.0 cortes/01-tema.mp4 --vertical --crop-x 124

# 2. hook na abertura
python3 helpers/queimar-hook.py cortes/01-tema.mp4 -o cortes/01-tema-hook.mp4 \
        --texto 'ninguem te conta\nisso sobre X' --ate 3 --y 0.24

# 3. conferir um frame ANTES de aceitar em lote
ffmpeg -y -i cortes/01-tema-hook.mp4 -ss 1 -vframes 1 /tmp/check.png && open /tmp/check.png
```

## Crop: o passo que mais estraga corte

`--vertical` corta 9:16 do **centro** da imagem. Isso funciona pra talking head e
destroi qualquer outra coisa.

O caso que mais dói: **gravacao de tela com o rostinho num canto**. Numa fonte
1920x1080 o crop pega os 608px centrais, ou seja, o meio do slide. Tu perde o slide
E o rosto, e o corte sai com um retangulo vazio no meio. O arquivo gera, o `ffprobe`
aprova, a duracao bate, e o video e inutil.

**Sempre olha um frame antes de rodar em lote:**
```bash
ffmpeg -y -i fonte.mp4 -ss 30 -vframes 1 /tmp/f.png && open /tmp/f.png
```

Se o assunto nao esta no centro, mede o x onde ele comeca e passa `--crop-x N`.
Largura do crop = altura*9/16 (fonte 1080p -> 608px). Ex: pra pegar a faixa que
comeca em 124px: `--crop-x 124`.

Se o conteudo **nao cabe** em 9:16 de jeito nenhum (slide largo + rosto longe), o
crop nao resolve. Ai as saidas honestas sao: usar `formato: original` e deixar o
reenquadramento pro app de edicao, ou montar uma composicao (slide em cima, rosto
embaixo), que essa skill nao faz.

## Nao existe modo rapido, e isso e de proposito

Cortar com `-c copy` nao re-encoda e parece uma boa ideia. Nao e: `-c copy` so corta
em **keyframe**, entao ele nao te da um inicio impreciso, te da um arquivo errado.
Medido numa fonte com keyframe a cada ~8s: pedimos 5.00s e o copy devolveu **12.59s**.
O erro varia com o keyframe interval, entao funciona num video e explode no outro.

Corte pra social vive dos 3 primeiros segundos. Errar o inicio mata o hook. O
`cortar.sh` re-encoda sempre e confere a duracao no fim.

## Hook: PNG + overlay, nao drawtext

O `queimar-hook.py` renderiza o texto com PIL e compoe com `overlay`.

Nao usa o `drawtext` do ffmpeg porque **drawtext so existe se o ffmpeg foi compilado
com libfreetype, e muito build nao tem**. O ffmpeg 8.1 do Homebrew testado aqui nao
tinha freetype nem libass, entao nem `drawtext` nem `subtitles` funcionavam. `overlay`
e filtro core: existe em todo build.

Confere o teu:
```bash
ffmpeg -hide_banner -filters | grep -E "drawtext|subtitles"   # pode nao ter
ffmpeg -hide_banner -filters | grep -E "^ .. overlay "        # sempre tem
```

De brinde, PIL da **contorno**, e contorno resolve o problema que mais estraga hook:
texto branco chapado some em cima de screenshot claro. Com contorno o mesmo hook
funciona sobre fundo claro ou escuro, e tu para de ter que caçar uma janela de tela
cheia pra encaixar o texto.

## A/V dessincronizado

Se a TUA fonte tem a imagem adiantada ou atrasada em relacao ao audio, mede antes de
corrigir. Nao chuta e nao copia numero de tutorial: o offset e da tua cadeia de
captura, nao do universo.

```bash
# extrai um trecho com um som de ataque seco (palma, claque, batida na mesa)
# e olha frame a frame onde o som acontece vs onde a imagem mostra o impacto
ffmpeg -y -i fonte.mp4 -ss 10 -t 2 -vf fps=30 /tmp/f/%03d.png
```

Achou o offset, aplica na hora de cortar:
```bash
# imagem 3 frames ATRASADA (0.1s a 30fps): adianta o video
ffmpeg -y -i fonte.mp4 -itsoffset -0.1 -i fonte.mp4 -map 0:v -map 1:a -c copy corrigido.mp4
```
Faz isso UMA vez na fonte inteira, antes de cortar. Corrigir corte a corte e trabalho
repetido e chance de errar em um deles.

## Legenda queimada (opcional)

Se `legendas_queimadas` estiver ligado e o teu ffmpeg tiver `libass`, da pra usar o
filtro `subtitles` com um `.srt` montado do flat da transcricao. Se nao tiver libass
(confere com o grep acima), o caminho e o mesmo do hook: renderiza os blocos de texto
com PIL e compoe com `overlay`.

Monta a legenda a partir dos timestamps por palavra do flat. Nao use ferramenta que
distribui as palavras em blocos iguais: elas atrasam progressivamente ao longo do
corte e a legenda descola da fala.

## Verificar

O `cortar.sh` ja confere a duracao e sai com codigo 2 se divergir mais de 0.5s. Alem
disso, antes de entregar:

```bash
for f in cortes/*.mp4; do
  echo "$f: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")s"
done
```

E abre pelo menos um. Render trunca as vezes e finaliza curto, cortando o fim no meio
da frase. Codigo de saida 0 nao prova que o video presta.
