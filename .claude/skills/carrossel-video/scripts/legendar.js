/**
 * Queima legenda num clipe SEM depender de libass (muita build de ffmpeg nao
 * tem o filtro `subtitles`). Renderiza cada cue como PNG transparente via
 * Playwright e sobrepoe com o filtro `overlay` (esse e core, sempre existe).
 *
 *   node legendar.js <clip.mp4> <legenda.srt> <saida.mp4>
 *
 * O SRT tem timecode RELATIVO ao clipe (comeca em 00:00:00).
 */
const { chromium } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const LARG = 1920, ALT = 1080;

function parseSrt(p) {
  const blocks = fs.readFileSync(p, "utf-8").trim().split(/\n\s*\n/);
  const cues = [];
  for (const b of blocks) {
    const L = b.split("\n");
    if (L.length < 2) continue;
    const m = L[1].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!m) continue;
    const a = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
    const b2 = (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000;
    const txt = L.slice(2).join(" ").trim();
    if (txt) cues.push({ a, b: b2, txt });
  }
  return cues;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function render(cues, dir) {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: LARG, height: ALT } });
  const pngs = [];
  for (let i = 0; i < cues.length; i++) {
    const html = `<meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:${LARG}px;height:${ALT}px;background:transparent}
      .wrap{position:absolute;left:0;right:0;bottom:52px;display:flex;justify-content:center}
      .leg{max-width:81%;background:rgba(0,0,0,.72);color:#fff;
           font-family:"Helvetica Neue",Arial,sans-serif;font-weight:700;
           font-size:46px;line-height:1.28;text-align:center;
           padding:12px 26px;border-radius:12px;
           text-shadow:0 1px 2px rgba(0,0,0,.5)}
    </style><div class="wrap"><div class="leg">${esc(cues[i].txt)}</div></div>`;
    await pg.setContent(html, { waitUntil: "load" });
    const out = path.join(dir, `cue-${String(i).padStart(2, "0")}.png`);
    await pg.screenshot({ path: out, omitBackground: true });
    pngs.push(out);
  }
  await nav.close();
  return pngs;
}

async function main() {
  const [clip, srt, saida] = process.argv.slice(2);
  if (!clip || !srt || !saida) {
    console.error("uso: node legendar.js <clip.mp4> <legenda.srt> <saida.mp4>");
    process.exit(1);
  }
  const cues = parseSrt(srt);
  if (!cues.length) { console.error("srt sem cues:", srt); process.exit(1); }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leg-"));
  const pngs = await render(cues, dir);

  const args = ["-y", "-v", "error", "-i", clip];
  pngs.forEach((p) => args.push("-i", p));
  const steps = [];
  let cur = "[0:v]";
  cues.forEach((c, i) => {
    const nxt = i === cues.length - 1 ? "[vout]" : `[v${i}]`;
    steps.push(`${cur}[${i + 1}:v]overlay=0:0:enable='between(t,${c.a.toFixed(3)},${c.b.toFixed(3)})'${nxt}`);
    cur = `[v${i}]`;
  });
  args.push("-filter_complex", steps.join(";"),
    "-map", "[vout]", "-map", "0:a?",
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
    "-c:a", "copy", "-movflags", "+faststart", saida);
  execFileSync("ffmpeg", args);
  console.log(`legendado: ${saida} (${cues.length} cues)`);
}

main().catch((e) => { console.error("erro:", e.message); process.exit(1); });
