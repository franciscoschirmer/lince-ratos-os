#!/bin/bash
# Cortes escolhidos pelo SENTIDO (frase que abre / frase que fecha) e ancorados
# na linha do tempo real pelo ancorar.py. A legenda deste video nao tem um
# unico ponto final, entao nenhum destes pontos veio de pontuacao.
set -euo pipefail
V="$1"; A="$2"; S="$3"; mkdir -p "$S"
cortar() {
  local n="$1" i="$2" d="$3" nota="$4"
  local fo; fo=$(echo "$d - 0.25" | bc)
  ffmpeg -y -v error -ss "$i" -t "$d" -i "$V" -ss "$i" -t "$d" -i "$A" \
    -map 0:v -map 1:a \
    -af "afade=t=in:st=0:d=0.18,afade=t=out:st=${fo}:d=0.25" \
    -c:v libx264 -pix_fmt yuv420p -c:a aac "$S/$n"
  printf '%-14s %5.1fs  %s\n' "$n" "$d" "$nota"
}
cortar corte-01.mp4  33.84 24.33 "ninguem nasce com essa disposicao / eu corro ha 30 anos"
cortar corte-02.mp4  57.75 19.89 "disciplina militar: as 8h eu tenho que correr"
cortar corte-04.mp4  93.47 12.90 "42km em 15 dias voce morre no caminho"
cortar corte-05.mp4 148.30 12.99 "comeca andando, nao e andar em shopping vendo vitrine"
cortar corte-06.mp4 160.70 19.42 "andou 500m corre 100m, vai alternando"
cortar corte-08.mp4 297.02 25.21 "voltou da viagem retoma, nao se acovarda"
cortar corte-09.mp4 336.91 14.21 "voce vai correr ate os 70, 80 anos"
