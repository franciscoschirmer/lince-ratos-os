#!/usr/bin/env bash
# gen-image.sh — gera UMA imagem pra dentro da peça, usando o gerador que o user já tem.
#
# uso: bash assets/gen-image.sh <saida.png> "<prompt em ingles>" [9x16|4x5|1x1|LxA] [backend]
#      backend: codex | fal | nano   (se omitir, escolhe o primeiro disponivel)
#
#   codex -> gpt-image-2 pelo OAuth do plano ChatGPT (~/.codex/auth.json). Sem custo de API, 40-90s.
#   fal   -> gpt-image-2 via FAL (skill image-gen-ratos, FAL_KEY). ~$0.06/imagem medium.
#   nano  -> Nano Banana / Gemini (skill nanobanana-ratos, GEMINI_API_KEY). Free tier, mais rapido.
#
# A imagem é ILUSTRACAO/CENA. O texto do anúncio NUNCA vem daqui — vem do HTML.
set -euo pipefail

OUT="${1:?uso: bash gen-image.sh <saida.png> \"<prompt>\" [tamanho] [backend]}"
PROMPT="${2:?falta o prompt}"
SIZE_IN="${3:-9x16}"
BACKEND="${4:-auto}"

case "$SIZE_IN" in
  9x16) SIZE="1024x1792" ;;
  4x5)  SIZE="1024x1280" ;;
  1x1)  SIZE="1024x1024" ;;
  16x9) SIZE="1792x1024" ;;
  *)    SIZE="$SIZE_IN" ;;
esac
W="${SIZE%x*}"; H="${SIZE#*x}"

SKILLS="$HOME/.claude/skills"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$(dirname "$OUT")"

have_codex(){ [ -f "$HOME/.codex/auth.json" ]; }
have_fal(){ [ -n "${FAL_KEY:-}" ] || grep -qs FAL_KEY "$SKILLS/image-gen-ratos/.env" 2>/dev/null; }
have_nano(){ [ -n "${GEMINI_API_KEY:-}" ] || grep -qs GEMINI_API_KEY "$SKILLS/nanobanana-ratos/.env" 2>/dev/null; }

if [ "$BACKEND" = "auto" ]; then
  if have_codex; then BACKEND=codex
  elif have_fal; then BACKEND=fal
  elif have_nano; then BACKEND=nano
  else
    cat >&2 <<'MSG'
nenhum gerador de imagem configurado. escolhe um:
  codex  -> npx @openai/codex login          (de graça se tu paga ChatGPT)
  fal    -> skill image-gen-ratos, FAL_KEY    (https://fal.ai/dashboard/keys)
  nano   -> skill nanobanana-ratos, GEMINI_API_KEY (https://aistudio.google.com/apikey, grátis)
ou segue sem imagem: os layouts l-top, l-quote, l-price, l-stat e l-list não usam nenhuma.
MSG
    exit 2
  fi
fi

echo "[img] backend=$BACKEND size=${W}x${H} -> $OUT"

case "$BACKEND" in
  codex)
    python3 "$HERE/gen-image-codex.py" "$OUT" "$PROMPT" "${W}x${H}"
    ;;

  fal)
    [ -n "${FAL_KEY:-}" ] || . "$SKILLS/image-gen-ratos/.env"
    REQ="$(mktemp)"; RESP="$(mktemp)"
    PROMPT="$PROMPT" W="$W" H="$H" QUALITY="${QUALITY:-medium}" python3 -c '
import json,os
print(json.dumps({"prompt":os.environ["PROMPT"],
  "image_size":{"width":int(os.environ["W"]),"height":int(os.environ["H"])},
  "quality":os.environ["QUALITY"],"num_images":1,"output_format":"png"}))' > "$REQ"
    curl -sS -X POST "https://fal.run/openai/gpt-image-2" \
      -H "Authorization: Key $FAL_KEY" -H "Content-Type: application/json" \
      -d "@$REQ" > "$RESP"
    RESP="$RESP" OUT="$OUT" python3 -c '
import json,os,sys,urllib.request
r=json.load(open(os.environ["RESP"]))
imgs=r.get("images") or []
if not imgs:
    print("ERRO FAL:",json.dumps(r)[:600],file=sys.stderr); sys.exit(3)
urllib.request.urlretrieve(imgs[0]["url"],os.environ["OUT"])
print("salvo:",os.environ["OUT"])'
    rm -f "$REQ" "$RESP"
    ;;

  nano)
    [ -n "${GEMINI_API_KEY:-}" ] || . "$SKILLS/nanobanana-ratos/.env"
    RATIO="$(python3 -c "
from math import gcd
w,h=$W,$H
g=gcd(w,h); print(f'{w//g}:{h//g}')")"
    REQ="$(mktemp)"; RESP="$(mktemp)"
    PROMPT="$PROMPT" RATIO="$RATIO" python3 -c '
import json,os
p=os.environ["PROMPT"]+" Aspect ratio "+os.environ["RATIO"]+", full-bleed composition, no text."
print(json.dumps({"contents":[{"parts":[{"text":p}]}],
  "generationConfig":{"responseModalities":["TEXT","IMAGE"]}}))' > "$REQ"
    curl -sS "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
      -H "Content-Type: application/json" -d "@$REQ" > "$RESP"
    RESP="$RESP" OUT="$OUT" python3 -c '
import base64,json,os,sys
r=json.load(open(os.environ["RESP"]))
parts=(r.get("candidates") or [{}])[0].get("content",{}).get("parts",[])
for p in parts:
    d=p.get("inlineData") or p.get("inline_data")
    if d:
        open(os.environ["OUT"],"wb").write(base64.b64decode(d["data"]))
        print("salvo:",os.environ["OUT"]); break
else:
    print("ERRO Gemini:",json.dumps(r)[:600],file=sys.stderr); sys.exit(3)'
    rm -f "$REQ" "$RESP"
    ;;

  *) echo "backend desconhecido: $BACKEND (use codex, fal ou nano)" >&2; exit 1 ;;
esac
