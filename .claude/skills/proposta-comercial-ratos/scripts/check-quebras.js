#!/usr/bin/env node
/**
 * check-quebras.js — detector de quebras de linha ruins numa proposta em HTML.
 *
 * Por que existe: a regra "controlar quebra de linha com <br>" só dá pra
 * verificar olhando o texto JÁ renderizado. Escrever o HTML e confiar na
 * memória não funciona. Este script mede o layout real no Chrome e aponta os
 * blocos problemáticos, com o texto exato.
 *
 * Uso:
 *   node check-quebras.js /caminho/proposta.html
 *   node check-quebras.js /caminho/proposta.html --largura 900
 *
 * Separa texto de DISPLAY (título, subtítulo, CTA, citação, valor) de texto
 * CORRIDO (parágrafo, item de lista). A régua é diferente pros dois:
 *
 *   VIUVA   — só em bloco de display: quebra em 2+ linhas e a última é muito
 *             mais curta que as outras. Corrigir com <br> em ponto natural.
 *   SEM-BR  — só em bloco de display de 2+ linhas sem nenhum <br>: quem decidiu
 *             onde quebrar foi o container. Às vezes tudo bem, conferir no olho.
 *   ORFA    — em texto corrido: a última linha tem uma palavra solta. Corrigir
 *             reescrevendo a frase, NUNCA com <br> (quebra feio no celular).
 *
 * Não precisa de npm install: usa o Chrome do sistema em headless.
 * Se não achar o Chrome, avisa e sai com código 0 (não quebra o fluxo).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// em bloco de display: última linha abaixo desta fração da mais larga = viúva
const LIMIAR_VIUVA = 0.55;
// em texto corrido: só reclama quando sobrou palavra solta na última linha
const LIMIAR_ORFA = 0.18;
// blocos menores que isso não interessam (labels, pills, números)
const MIN_CHARS = 45;

function acharChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidatos = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  return candidatos.find(p => fs.existsSync(p)) || null;
}

const args = process.argv.slice(2);
const arquivo = args.find(a => !a.startsWith('--'));
const iLarg = args.indexOf('--largura');
const LARGURA = iLarg !== -1 && args[iLarg + 1] ? parseInt(args[iLarg + 1], 10) : 1280;

if (!arquivo) {
  console.error('uso: node check-quebras.js /caminho/proposta.html [--largura 1280]');
  process.exit(1);
}
if (!fs.existsSync(arquivo)) {
  console.error('arquivo não encontrado: ' + arquivo);
  process.exit(1);
}

const CHROME = acharChrome();
if (!CHROME) {
  console.log('Chrome não encontrado nesta máquina, então pulei a verificação automática.');
  console.log('Revisa no olho: abre a proposta no navegador e procura parágrafo cuja');
  console.log('última linha é bem mais curta que as outras. Corrige com <br>.');
  console.log('(dá pra apontar o caminho na mão: CHROME_PATH=/caminho/do/chrome node check-quebras.js ...)');
  process.exit(0);
}

const medidor = `
  const LIMIAR = ${LIMIAR_VIUVA}, ORFA = ${LIMIAR_ORFA}, MIN = ${MIN_CHARS};
  // texto que a gente quebra à mão vs. texto que o navegador quebra
  const DISPLAY = 'h1,h2,h3,h4,.section-title,.cta-title,.cta-text,.entrega-title,'
    + '.entrega-subtitle,.briefing-value,.price-desc,.price-label,.quote-block p,'
    + '.badge,blockquote,.scenario-title,.scenario-desc';
  // agrupa os rects do Range em LINHAS VISUAIS (rects na mesma faixa de 'top'
  // são a mesma linha). Sem isso, cada <b>/<span> vira um rect e a contagem
  // de linhas sai errada.
  function linhas(rects) {
    const faixas = [];
    rects.forEach(r => {
      const f = faixas.find(x => Math.abs(x.top - r.top) <= Math.max(4, r.height * 0.4));
      if (f) { f.left = Math.min(f.left, r.left); f.right = Math.max(f.right, r.right); }
      else faixas.push({ top: r.top, left: r.left, right: r.right, height: r.height });
    });
    faixas.sort((a, b) => a.top - b.top);
    return faixas.map(f => f.right - f.left);
  }
  function blocos(doc, win) {
    const out = [];
    doc.querySelectorAll('p,h1,h2,h3,h4,div,span,li,td,th').forEach(el => {
      // fora: containers de layout (flex/grid) — colunas, cards, chips
      const disp = win.getComputedStyle(el).display;
      if (/flex|grid/.test(disp)) return;
      // só folhas de texto: sem filho que também seja bloco
      const temFilhoBloco = Array.from(el.children).some(c => /^(P|H1|H2|H3|H4|DIV|LI|TD|TH)$/.test(c.tagName));
      if (temFilhoBloco) return;
      const txt = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      if (txt.length < MIN) return;
      const r = doc.createRange();
      r.selectNodeContents(el);
      const rects = Array.from(r.getClientRects()).filter(x => x.width > 1 && x.height > 1);
      if (!rects.length) return;
      const larguras = linhas(rects);
      if (larguras.length < 2) return;
      const maxW = Math.max.apply(null, larguras);
      const ultima = larguras[larguras.length - 1];
      const temBr = el.querySelector('br') !== null;
      const razao = ultima / maxW;
      const defeitos = [];
      let ehDisplay = false;
      try { ehDisplay = el.matches(DISPLAY); } catch (e) { ehDisplay = false; }
      if (ehDisplay) {
        if (razao < LIMIAR) defeitos.push('VIUVA');
        if (!temBr) defeitos.push('SEM-BR');
      } else if (razao < ORFA) {
        defeitos.push('ORFA');
      }
      if (defeitos.length) {
        out.push({ defeitos: defeitos, linhas: larguras.length,
                   razao: Math.round(razao * 100) / 100,
                   classe: el.className || el.tagName.toLowerCase(),
                   texto: txt.length > 130 ? txt.slice(0, 130) + '...' : txt });
      }
    });
    return out;
  }
  window.__medir = blocos;
`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'checkquebras-'));
const alvo = 'file://' + path.resolve(arquivo).split(path.sep).join('/');

const harness = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{margin:0} iframe{width:${LARGURA}px;height:20000px;border:0;display:block}
</style></head><body>
<iframe id="f" src="${alvo}"></iframe>
<pre id="relatorio"></pre>
<script>
${medidor}
function rodar() {
  const f = document.getElementById('f');
  let achados = [];
  try { achados = window.__medir(f.contentDocument, f.contentWindow); }
  catch (e) { achados = [{ defeitos: ['ERRO'], texto: String(e) }]; }
  document.getElementById('relatorio').textContent = 'JSON_INICIO' + JSON.stringify(achados) + 'JSON_FIM';
}
window.addEventListener('load', () => {
  const fontes = [document.fonts.ready];
  const d = document.getElementById('f').contentDocument;
  if (d && d.fonts) fontes.push(d.fonts.ready);
  Promise.all(fontes).then(() => setTimeout(rodar, 400));
});
</script></body></html>`;

const harnessPath = path.join(tmp, 'harness.html');
fs.writeFileSync(harnessPath, harness);

let dom;
try {
  dom = execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--allow-file-access-from-files',
    '--window-size=' + LARGURA + ',900', '--virtual-time-budget=12000',
    '--dump-dom', harnessPath,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) {
  console.log('o Chrome headless falhou aqui (' + e.message + '), então pulei a verificação.');
  console.log('revisa no olho antes de mandar a proposta.');
  process.exit(0);
}

const bruto = dom.match(/JSON_INICIO([\s\S]*?)JSON_FIM/);
if (!bruto) {
  console.log('não consegui ler o relatório. o harness ficou em ' + harnessPath);
  process.exit(0);
}
const achados = JSON.parse(
  bruto[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
);

if (!achados.length) {
  console.log('OK — 0 viúva(s), 0 órfã(s). A proposta está limpa de quebra ruim.');
  process.exit(0);
}

let viuvas = 0, semBr = 0, orfas = 0;
console.log('QUEBRAS A REVISAR — ' + path.basename(arquivo) + '\n');
for (const a of achados) {
  if (a.defeitos.includes('VIUVA')) viuvas++;
  if (a.defeitos.includes('SEM-BR')) semBr++;
  if (a.defeitos.includes('ORFA')) orfas++;
  console.log('   [' + a.defeitos.join('+') + '] .' + a.classe +
              '  ' + a.linhas + ' linhas, última com ' + Math.round(a.razao * 100) + '% da mais larga');
  console.log('   "' + a.texto + '"\n');
}
console.log('resumo: ' + viuvas + ' viúva(s), ' + orfas + ' órfã(s), ' + semBr + ' display sem <br>.');
console.log('VIUVA: corrigir com <br> em ponto natural e rodar de novo até zerar.');
console.log('ORFA: palavra solta no fim de parágrafo. Reescrever a frase, não usar <br>.');
console.log('SEM-BR sozinho pode ser aceitável quando a quebra automática caiu em ponto bom.');
