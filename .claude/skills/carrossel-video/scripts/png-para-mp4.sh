#!/bin/bash
# Converte slide em PNG pra MP4 de imagem parada.
#
# POR QUE ISSO EXISTE: o Instagram REAGRUPA carrossel misto por tipo, jogando
# todas as imagens na frente e todos os vídeos atrás. Comprovado em 05/08/2026
# num post real que teve que ser deletado: a Post for Me entregou na ordem
# certa e mesmo assim o feed embaralhou. Com todos os itens em vídeo não há
# tipo pra reagrupar, e a ordem enviada é a única que o Instagram tem.
#
# A trilha de áudio muda entra de propósito: item de vídeo sem áudio nenhum é
# outro jeito de o carrossel sair estranho.
#
#   ./png-para-mp4.sh slide-03.png [segundos]

set -euo pipefail
PNG="$1"
DUR="${2:-4}"          # 4s: o mínimo do Instagram é 3s, então sobra folga
SAIDA="${PNG%.png}.mp4"

ffmpeg -y -v error \
  -loop 1 -i "$PNG" \
  -f lavfi -i anullsrc=r=44100:cl=stereo \
  -t "$DUR" \
  -c:v libx264 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 128k \
  -movflags +faststart -shortest \
  "$SAIDA"

printf '%s -> %s (%ss, %s)\n' "$PNG" "$SAIDA" "$DUR" "$(du -h "$SAIDA" | cut -f1)"
