#!/usr/bin/env node
/**
 * contact-sheet.mjs — junta os PNGs do lote num grid só, pra revisar de uma vez.
 * Uso: node assets/contact-sheet.mjs pecas/            -> pecas/_contact-sheet.png
 *      node assets/contact-sheet.mjs a.png b.png       -> ./_contact-sheet.png
 *
 * Por que: abrir 12 PNGs soltos queima contexto e trava máquina fraca. Revisa 1 imagem.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let args = process.argv.slice(2);
if (!args.length) args = ['.'];

let pngs = [];
let dir = process.cwd();
if (args.length === 1 && fs.existsSync(args[0]) && fs.statSync(args[0]).isDirectory()) {
  dir = path.resolve(args[0]);
  pngs = fs.readdirSync(dir).filter(f => f.endsWith('.png') && !f.startsWith('_')).sort()
    .map(f => path.join(dir, f));
} else {
  pngs = args.map(a => path.resolve(a));
}
if (!pngs.length) { console.error('nenhum png encontrado'); process.exit(1); }

const cols = pngs.length <= 3 ? pngs.length : pngs.length <= 8 ? 4 : 5;
const cel = 380;

const cards = pngs.map(p => `
  <figure>
    <img src="file://${p}">
    <figcaption>${path.basename(p, '.png')}</figcaption>
  </figure>`).join('');

const html = `<!DOCTYPE html><meta charset="utf-8"><style>
  body{margin:0;background:#141414;color:#bbb;font:13px ui-monospace,monospace;padding:28px}
  .grid{display:grid;grid-template-columns:repeat(${cols},${cel}px);gap:24px;justify-content:start;align-items:start}
  figure{margin:0}
  img{width:${cel}px;height:auto;display:block;background:#222;border:1px solid #333}
  figcaption{padding-top:8px;letter-spacing:.02em}
</style><div class="grid">${cards}</div>`;

const tmp = path.join(dir, '_contact-sheet.html');
const out = path.join(dir, '_contact-sheet.png');
fs.writeFileSync(tmp, html);
execSync(
  `npx --yes playwright screenshot --full-page --viewport-size="${cols * (cel + 24) + 56},1200" --wait-for-timeout=2000 "file://${tmp}" "${out}"`,
  { stdio: ['ignore', 'ignore', 'inherit'], timeout: 120000 }
);
fs.unlinkSync(tmp);
console.log(`ok ${out}  (${pngs.length} peças)`);
