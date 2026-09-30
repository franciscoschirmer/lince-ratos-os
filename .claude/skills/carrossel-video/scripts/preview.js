/**
 * Monta e ABRE uma paginazinha que toca os slides do carrossel em ordem, pra
 * pessoa ver que ficou bom antes de publicar. Passo padrao no fim da skill.
 *
 *   node scripts/preview.js [pasta] [titulo]
 *
 * Varre `slide-*.mp4` (e cai pra `slide-*.png` quando nao ha o mp4) na pasta,
 * ordena pelo numero, gera `preview.html` e abre no navegador padrao do SO.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const dir = process.argv[2] || ".";
const titulo = process.argv[3] || "Carrossel — preview";

function itens() {
  const arq = fs.readdirSync(dir);
  const num = (f) => {
    const m = f.match(/slide-(\d+)\./);
    return m ? parseInt(m[1], 10) : 9999;
  };
  const mp4 = arq.filter((f) => /^slide-\d+\.mp4$/.test(f));
  const base = mp4.length ? mp4 : arq.filter((f) => /^slide-\d+\.png$/.test(f));
  return base.sort((a, b) => num(a) - num(b));
}

function abrir(p) {
  const plat = process.platform;
  const cmd = plat === "darwin" ? "open" : plat === "win32" ? "start" : "xdg-open";
  const args = plat === "win32" ? ["", p] : [p];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true, shell: plat === "win32" }).unref();
  } catch (_) {
    console.log("abre na mao:", p);
  }
}

function main() {
  const lista = itens();
  if (!lista.length) {
    console.error("nenhum slide-*.mp4 nem slide-*.png em", path.resolve(dir));
    process.exit(1);
  }
  const cards = lista.map((f, i) => {
    const n = String(i + 1).padStart(2, "0");
    const midia = /\.mp4$/.test(f)
      ? `<video src="${f}" muted loop playsinline controls preload="metadata"></video>`
      : `<img src="${f}" alt="slide ${n}">`;
    return `<div class="card"><div class="n">${n}</div>${midia}</div>`;
  }).join("\n");

  const html = `<meta charset="utf-8"><title>${titulo}</title>
<style>
  body{margin:0;background:#0d0b0a;color:#f5f1ea;font-family:-apple-system,Helvetica,Arial,sans-serif;padding:28px}
  h1{font-size:19px;font-weight:800;margin:0 0 4px}
  p{color:#a99;font-size:13px;margin:0 0 22px}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
  .card{background:#17130f;border-radius:12px;overflow:hidden;border:1px solid #2a221c}
  .card .n{font-size:11px;letter-spacing:.12em;color:#8a7c6e;padding:8px 10px 0}
  video,img{width:100%;display:block}
  @media(max-width:1100px){.grid{grid-template-columns:repeat(2,1fr)}}
</style>
<h1>${titulo}</h1>
<p>${lista.length} itens, em ordem. Passa o mouse pra tocar; clica pra som/controles.</p>
<div class="grid">${cards}</div>
<script>
  document.querySelector('.grid').addEventListener('mouseover',e=>{if(e.target.tagName==='VIDEO')e.target.play()});
</script>`;

  const out = path.join(dir, "preview.html");
  fs.writeFileSync(out, html);
  console.log("preview:", path.resolve(out), `(${lista.length} itens)`);
  abrir(out);
}

main();
