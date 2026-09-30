#!/usr/bin/env bash
# scaffold.sh — monta a pasta de trabalho de um lote de criativos.
# uso: bash <skill>/assets/scaffold.sh <workdir> [caminho/do/brand.yaml]
#
# O lote fica auto-contido: os scripts e o CSS vão junto. Dá pra mandar a pasta
# pro cliente ou pro designer sem a skill instalada.
set -euo pipefail
SK="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:?uso: bash scaffold.sh <workdir> [brand.yaml]}"
BRAND="${2:-}"

mkdir -p "$DEST/assets/css" "$DEST/assets/img" "$DEST/pecas"
cp "$SK"/css/*.css                "$DEST/assets/css/"
cp "$SK"/theme.mjs "$SK"/render.mjs "$SK"/variar.mjs "$SK"/contact-sheet.mjs "$DEST/assets/"
cp "$SK"/gen-image.sh "$SK"/gen-image-codex.py "$DEST/assets/"
cp "$SK"/peca.template.html       "$DEST/assets/"
chmod +x "$DEST/assets/gen-image.sh"

if [ -n "$BRAND" ] && [ -f "$BRAND" ]; then
  cp "$BRAND" "$DEST/brand.yaml"
else
  [ -f "$DEST/brand.yaml" ] || cp "$SK/brand.example.yaml" "$DEST/brand.yaml"
fi

( cd "$DEST" && node assets/theme.mjs brand.yaml assets/theme.css )

cat <<EOF

lote pronto: $DEST

  brand.yaml            -> a marca. mexeu nela? roda: node assets/theme.mjs
  copy.md               -> a copy aprovada de cada peça (cria e mantém)
  assets/img/           -> ilustrações geradas
  pecas/AD01-4x5.html   -> a peça

  render         node assets/render.mjs pecas/AD01-4x5.html
  outro formato  node assets/variar.mjs pecas/AD01-4x5.html 9x16 1x1
  revisar tudo   node assets/contact-sheet.mjs pecas/
  ilustração     bash assets/gen-image.sh assets/img/AD01.png "<prompt EN>" 9x16
EOF
