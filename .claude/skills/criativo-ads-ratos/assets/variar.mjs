#!/usr/bin/env node
/**
 * variar.mjs — clona uma peça pra outro formato.
 * Uso: node assets/variar.mjs pecas/AD01-9x16.html 4x5 [1x1 ...]
 *
 * Troca o css/fmt-*.css linkado, renomeia o arquivo e reescala o --shift da imagem
 * proporcional à altura. O shift novo é um CHUTE: confere no render e ajusta.
 */
import fs from 'node:fs';
import path from 'node:path';

const ALT = { '1x1': 1080, '4x5': 1350, '9x16': 1920 };
const [src, ...alvos] = process.argv.slice(2);
if (!src || !alvos.length) {
  console.log('uso: node assets/variar.mjs <peca.html> <1x1|4x5|9x16> [...]');
  process.exit(1);
}
const input = path.resolve(src);
if (!fs.existsSync(input)) { console.error(`nao achei: ${src}`); process.exit(1); }

const html = fs.readFileSync(input, 'utf8');
const m = html.match(/fmt-(1x1|4x5|9x16)\.css/);
if (!m) { console.error('a peça não linka nenhum css/fmt-*.css'); process.exit(1); }
const de = m[1];

for (const para of alvos) {
  if (!ALT[para]) { console.error(`formato invalido: ${para} (use 1x1, 4x5 ou 9x16)`); continue; }
  if (para === de) { console.error(`${path.basename(src)} ja é ${para}`); continue; }

  const fator = ALT[para] / ALT[de];
  let novo = html.replaceAll(`fmt-${de}.css`, `fmt-${para}.css`);
  let mexeu = 0;
  novo = novo.replace(/--shift:\s*(-?\d+(?:\.\d+)?)px/g, (_, px) => {
    mexeu++;
    return `--shift:${Math.round(Number(px) * fator)}px`;
  });

  const base = path.basename(input).replace(new RegExp(`-${de}\\.html$`), '').replace(/\.html$/, '');
  const dest = path.join(path.dirname(input), `${base}-${para}.html`);
  fs.writeFileSync(dest, novo);
  console.log(`ok ${path.basename(dest)}${mexeu ? `  (--shift reescalado x${fator.toFixed(2)} — CONFERIR no render)` : ''}`);
}
