#!/bin/bash
# Template dos cortes. Copiar pra pasta de trabalho e trocar as chamadas.
#
# COMO ESTES PONTOS SAO ESCOLHIDOS (errar aqui e o que faz o corte "comecar do
# nada"): a unidade de sentido se escolhe LENDO a transcricao, e o ancorar.py
# so empurra pra respiracao real e confere as palavras que o intervalo pega.
# Nunca por relogio, nunca por pontuacao (a legenda pode nao ter nenhuma).
#
# REGRA 1: o carrossel e conteudo por si so. Nenhum corte pega introducao,
#          pedido de inscricao nem creditos finais.
# REGRA 2: teto de 60s por slide de video no carrossel do Instagram.
# REGRA 3: todo corte finalista teve os frames OLHADOS (b-roll, cartela de
#          fim, legenda queimada, enquadramento).
#
#   ./cortes.sh <video.mp4> <audio.webm> <pasta-saida>

set -euo pipefail
V="$1"; A="$2"; S="$3"
mkdir -p "$S"

cortar() {
  local n="$1" i="$2" d="$3" nota="$4"
  local fo; fo=$(echo "$d - 0.25" | bc)
  ffmpeg -y -v error \
    -ss "$i" -t "$d" -i "$V" \
    -ss "$i" -t "$d" -i "$A" \
    -map 0:v -map 1:a \
    -af "afade=t=in:st=0:d=0.18,afade=t=out:st=${fo}:d=0.25" \
    -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac \
    "$S/$n" </dev/null
  printf '%-14s %5.1fs  %s\n' "$n" "$d" "$nota"
}

# cortar <arquivo> <inicio> <duracao> "<o que a fala diz>"
cortar corte-01.mp4  33.84 24.33 "exemplo: a tese + a prova pessoal"
cortar corte-02.mp4  57.75 19.89 "exemplo: o conceito nomeado"
