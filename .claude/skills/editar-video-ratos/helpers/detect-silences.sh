#!/bin/bash
# Detecta silencio REAL no audio (nao na transcricao) via ffmpeg silencedetect.
#
# Uso:  detect-silences.sh <arquivo-audio-ou-mp4> [limiar_dB] [dur_min_s] [saida.txt]
# Ex.:  detect-silences.sh ~/videos/bruto.mp4 -30 0.35 sil.txt
#
# POR QUE ffmpeg E NAO A TRANSCRICAO: o timestamp do ASR e uma ESTIMATIVA do
# alinhamento, nao uma medida do audio. Ele erra pros dois lados e erra de um jeito
# que muda por motor e por modelo (medido num video real com Whisper base: o
# desvio contra o silencedetect foi pra cima em ~metade dos casos e pra baixo na
# outra metade). Ou seja: nao da pra corrigir com um fator, so da pra nao usar.
# silencedetect le o audio de verdade e nao depende de modelo nenhum.
#
# Saida: linhas "silence_start: X" / "silence_end: Y | silence_duration: D" em segundos.
# Joga isso no silences-to-ranges.py pra virar range de corte.

IN="$1"; DB="${2:--30}"; DUR="${3:-0.35}"; OUT="${4:-/dev/stdout}"

if [ -z "$IN" ]; then
  echo "uso: detect-silences.sh <arquivo> [limiar_dB=-30] [dur_min=0.35] [saida]" >&2
  exit 1
fi
if [ ! -f "$IN" ]; then
  echo "erro: arquivo nao encontrado: $IN" >&2
  exit 1
fi
command -v ffmpeg >/dev/null || { echo "erro: ffmpeg nao instalado. rode: brew install ffmpeg" >&2; exit 1; }

ffmpeg -hide_banner -nostats -i "$IN" -af "silencedetect=noise=${DB}dB:d=${DUR}" -f null - 2>&1 \
  | grep "silence_" | sed 's/.*silencedetect.*\] //' > "$OUT"

echo "silencios detectados (${DB}dB, >= ${DUR}s): $(grep -c silence_start "$OUT")" >&2
