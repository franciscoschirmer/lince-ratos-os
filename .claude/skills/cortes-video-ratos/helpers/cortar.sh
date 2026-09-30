#!/bin/bash
# Corta um trecho do video em arquivo separado, e VERIFICA o resultado.
#
# Uso:  cortar.sh <fonte> <inicio_s> <fim_s> <saida.mp4> [--vertical] [--crop-x N]
#
#   --vertical   reenquadra pra 1080x1920 (TikTok/Reels)
#   --crop-x N   desloca o crop N px a partir da esquerda (default: centralizado).
#                Use quando o assunto NAO esta no centro. Caso classico: gravacao de
#                tela com o rostinho num canto. O crop central pega o meio da tela e
#                te devolve um retangulo vazio, perdendo o slide E o rosto.
#                Descobre o valor certo olhando um frame:
#                  ffmpeg -y -i fonte.mp4 -ss 30 -vframes 1 /tmp/f.png && open /tmp/f.png
#                Largura do crop = altura*9/16 (ex: fonte 1920x1080 -> 608px)
#
# POR QUE SEMPRE RE-ENCODA (e nao tem modo "rapido" com -c copy):
#   Corte com "-c copy" so consegue cortar em KEYFRAME. Ele nao te da um inicio
#   impreciso: ele te da um arquivo errado. Medido numa fonte com keyframe a cada
#   ~8s: pedimos 5.00s e o copy devolveu 12.59s. E o erro varia com o keyframe
#   interval da fonte, entao funciona num video e explode no outro.
#   Corte pra social vive dos 3 primeiros segundos. Errar o inicio mata o hook.
#   Re-encodar custa CPU e sempre acerta. O trade nao esta nem perto de ser justo,
#   entao esse helper nao expoe a opcao ruim.

set -euo pipefail

FONTE="${1:-}"; INI="${2:-}"; FIM="${3:-}"; OUT="${4:-}"
if [ -z "$OUT" ]; then
  echo "uso: cortar.sh <fonte> <inicio_s> <fim_s> <saida.mp4> [--vertical]" >&2; exit 1
fi
shift 4

VERTICAL=0; CROP_X=""
while [ $# -gt 0 ]; do
  case "$1" in
    --vertical) VERTICAL=1; shift ;;
    --crop-x) CROP_X="${2:-}"; shift 2 ;;
    *) echo "flag desconhecida: $1" >&2; exit 1 ;;
  esac
done

[ -f "$FONTE" ] || { echo "erro: fonte nao encontrada: $FONTE" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "erro: ffmpeg nao instalado (brew install ffmpeg)" >&2; exit 1; }

DUR=$(echo "$FIM - $INI" | bc -l)
if (( $(echo "$DUR <= 0" | bc -l) )); then
  echo "erro: fim ($FIM) precisa ser maior que inicio ($INI)" >&2; exit 1
fi

mkdir -p "$(dirname "$OUT")"

# Crop pra 9:16. Nao e enquadramento inteligente: sem --crop-x ele pega o CENTRO, e
# se o assunto nao esta no centro o corte decepa. Confere um frame antes do lote.
VF=()
if [ "$VERTICAL" = "1" ]; then
  if [ -n "$CROP_X" ]; then
    CROP="crop='min(iw,ih*9/16)':ih:${CROP_X}:0"
  else
    CROP="crop='min(iw,ih*9/16)':ih"
  fi
  VF=(-vf "${CROP},scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2")
fi

# ${VF[@]+"${VF[@]}"} e nao "${VF[@]}": o bash 3.2 (o unico que vem no macOS) trata
# array VAZIO como unbound sob `set -u` e aborta. Sem isso o caminho sem --vertical
# (que e o default) quebra em todo Mac com "VF[@]: unbound variable".
# -ss DEPOIS do -i = seek preciso (decodifica ate o ponto exato)
ffmpeg -y -hide_banner -loglevel error -i "$FONTE" -ss "$INI" -t "$DUR" \
  ${VF[@]+"${VF[@]}"} -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$OUT"

# ---- verificacao: nao confia que o ffmpeg saiu 0 ----
[ -s "$OUT" ] || { echo "erro: saida vazia ou inexistente: $OUT" >&2; exit 1; }

REAL=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
DIFF=$(echo "if ($REAL - $DUR < 0) $DUR - $REAL else $REAL - $DUR" | bc -l)

printf 'ok %s | pedido %.2fs | real %.2fs | delta %.2fs\n' "$(basename "$OUT")" "$DUR" "$REAL" "$DIFF"

# render trunca as vezes e finaliza curto, cortando o fim no meio da frase
if (( $(echo "$DIFF > 0.5" | bc -l) )); then
  echo "  AVISO: duracao real fora do pedido em ${DIFF}s. O render pode ter truncado." >&2
  echo "  Confere o fim do arquivo. Se cortou no meio da frase, roda de novo." >&2
  exit 2
fi
