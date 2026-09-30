#!/usr/bin/env node
/**
 * render.mjs — renderiza peça(s) HTML em PNG via Playwright.
 * Uso: node assets/render.mjs pecas/AD01-9x16.html [outras.html ...]
 *
 * O tamanho sai do formato linkado no próprio HTML (css/fmt-*.css). Não precisa passar W/H.
 * O chromium do Playwright é instalado sozinho na primeira execução.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TAM = { '1x1': [1080, 1080], '4x5': [1080, 1350], '9x16': [1080, 1920] };

const files = process.argv.slice(2);
if (!files.length) {
  console.log('uso: node assets/render.mjs <peca.html> [...]');
  process.exit(1);
}

// primeira execução: o chromium do Playwright pode não estar instalado. Instala e segue.
function garantirChromium() {
  const marca = path.join(process.env.HOME || '.', '.cache', 'ms-playwright');
  const jaTem = fs.existsSync(marca) && fs.readdirSync(marca).some(d => d.startsWith('chromium'));
  if (jaTem) return;
  console.log('primeira vez por aqui: instalando o navegador do Playwright (uns 2 min, só agora)...');
  try {
    execSync('npx --yes playwright install chromium', { stdio: 'inherit', timeout: 600000 });
  } catch {
    console.error('nao consegui instalar sozinho. roda na mão: npx playwright install chromium');
  }
}
garantirChromium();

let erros = 0;
for (const f of files) {
  const input = path.resolve(f);
  if (!fs.existsSync(input)) { console.error(`x nao achei: ${f}`); erros++; continue; }

  const html = fs.readFileSync(input, 'utf8');
  const m = html.match(/fmt-(1x1|4x5|9x16)\.css/);
  if (!m) { console.error(`x ${path.basename(f)}: nao achei o link do css/fmt-*.css`); erros++; continue; }
  const [w, h] = TAM[m[1]];
  const out = input.replace(/\.html$/, '.png');

  try {
    execSync(
      `npx --yes playwright screenshot --viewport-size="${w},${h}" --wait-for-timeout=2500 "file://${input}" "${out}"`,
      { stdio: ['ignore', 'ignore', 'inherit'], timeout: 120000 }
    );
    console.log(`ok ${path.basename(out)}  ${w}x${h}`);
  } catch (e) {
    console.error(`x falhou: ${path.basename(f)}`);
    erros++;
  }
}
process.exit(erros ? 1 : 0);
