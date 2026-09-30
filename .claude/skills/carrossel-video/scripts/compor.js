/**
 * Encaixa um corte de video dentro da janela de um slide e cospe o MP4.
 *
 *   node compor.js <slide.html> <corte.mp4> <saida.mp4>
 *
 * Funciona em cima dos HTMLs de mockup que ja existem aqui: ele mesmo tira a
 * imagem congelada de dentro da janela antes de renderizar o chassi.
 *
 * Duas passadas do Playwright no MESMO html:
 *   chassi  - o slide com a janela vazia
 *   mascara - so a area util, branca sobre preto, ja com os cantos que o
 *             overflow:hidden da moldura recorta
 * A coordenada da janela vem medida do layout, nunca chumbada.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const LARGURA = 1080;
const ALTURA = 1350;

const CSS_MASCARA = `
  * { visibility: hidden !important; }
  body { background: #000000 !important; }
  .janela { visibility: visible !important;
            border-color: #000000 !important; background: #000000 !important; }
  .janela-barra { visibility: hidden !important; }
  .janela-midia { visibility: visible !important; background: #FFFFFF !important; }
  .janela-midia * { visibility: hidden !important; }
`;

async function comporSlideVideo(html, corte, saida) {
  if (!fs.existsSync(corte)) throw new Error(`corte nao encontrado: ${corte}`);

  const trabalho = fs.mkdtempSync(path.join(os.tmpdir(), "slide-video-"));
  const chassi = path.join(trabalho, "chassi.png");
  const mascara = path.join(trabalho, "mascara.png");

  const navegador = await chromium.launch();
  let janela;
  try {
    const pagina = await navegador.newPage({
      viewport: { width: LARGURA, height: ALTURA },
    });
    await pagina.goto("file://" + path.resolve(html));

    // esvazia a janela: o chassi nao pode ter o congelado dentro
    await pagina.$$eval(".janela-midia img", (imgs) => imgs.forEach((i) => i.remove()));

    const el = await pagina.$(".janela-midia");
    if (!el) throw new Error(`.janela-midia nao encontrada em ${html}`);
    janela = await el.evaluate((no) => {
      const r = no.getBoundingClientRect();
      return {
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      };
    });

    await pagina.screenshot({ path: chassi });
    await pagina.addStyleTag({ content: CSS_MASCARA });
    await pagina.screenshot({ path: mascara });
  } finally {
    await navegador.close();
  }

  const { x, y, w, h } = janela;
  const filtro = [
    `[1:v]scale=${w}:${h},setsar=1[v]`,
    `[2:v]crop=${w}:${h}:${x}:${y},format=gray[m]`,
    `[v][m]alphamerge[va]`,
    `[0:v][va]overlay=${x}:${y}:format=auto[out]`,
  ].join(";");

  execFileSync("ffmpeg", [
    "-y", "-v", "error",
    "-loop", "1", "-i", chassi,
    "-i", corte,
    "-i", mascara,
    "-filter_complex", filtro,
    "-map", "[out]", "-map", "1:a?",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    "-shortest",
    saida,
  ]);

  console.log("janela medida:", JSON.stringify(janela));
  return saida;
}

const [html, corte, saida] = process.argv.slice(2);
if (!html || !corte || !saida) {
  console.error("uso: node compor.js <slide.html> <corte.mp4> <saida.mp4>");
  process.exit(1);
}
comporSlideVideo(html, corte, saida)
  .then((a) => console.log("gerado:", a))
  .catch((e) => {
    console.error("erro:", e.message);
    process.exit(1);
  });
