// Recorta os exports do WhatsApp na janela da semana e limpa o ruído (citações repetidas e
// notícias encaminhadas). Aceita os dois formatos de export:
//   .md  -> "## 28 de setembro de 2026" + "[11:55] **Nome:** texto"
//   .txt -> "28/09/2026 11:55 - Nome: texto" (export nativo do WhatsApp)
// Uso: node janela.js <pasta-dos-exports> <AAAA-MM-DD inicio> <AAAA-MM-DD fim> <pasta-saida>
const fs = require("fs"), path = require("path");
const [dir, ini, fim, outDir] = process.argv.slice(2);
if (!dir || !ini || !fim || !outDir) { console.error("uso: node janela.js <exports> <inicio> <fim> <saida>"); process.exit(1); }
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const dIni = ini.replace(/-/g, ""), dFim = fim.replace(/-/g, "");
const dentro = (a, m, d) => { const k = `${a}${String(m).padStart(2,"0")}${String(d).padStart(2,"0")}`; return k >= dIni && k <= dFim; };

function arquivos(p) {
  return fs.readdirSync(p, { withFileTypes: true }).flatMap(e => {
    const f = path.join(p, e.name);
    if (e.isDirectory()) return arquivos(f);
    return /\.(md|txt)$/i.test(e.name) ? [f] : [];
  });
}

function limpa(linhas) {
  const res = []; let citando = false, pula = false;
  for (const l of linhas) {
    if (/^\[\d{1,2}:\d{2}\]/.test(l) || /^\d{2}\/\d{2}\/\d{4},? \d{1,2}:\d{2}/.test(l)) { pula = l.includes("[Encaminhada]"); citando = false; }
    if (pula) continue;
    if (l.startsWith("> _")) { citando = !(l.trimEnd().endsWith("_") && l.length > 4); res.push("  (resp. a: " + l.slice(3, 70) + "...)"); continue; }
    if (citando) { if (l.trimEnd().endsWith("_")) citando = false; continue; }
    res.push(l);
  }
  return res.join("\n").replace(/\n{3,}/g, "\n\n");
}

fs.mkdirSync(outDir, { recursive: true });
const resumo = [];
for (const f of arquivos(dir)) {
  const linhas = fs.readFileSync(f, "utf8").split(/\r?\n/);
  const sel = []; let ok = false;
  for (const l of linhas) {
    let m = l.match(/^## (\d{1,2}) de (\S+) de (\d{4})/);
    if (m) { ok = dentro(+m[3], MESES.indexOf(m[2].toLowerCase()) + 1, +m[1]); }
    m = l.match(/^(\d{2})\/(\d{2})\/(\d{4}),? \d{1,2}:\d{2}/);
    if (m) { ok = dentro(+m[3], +m[2], +m[1]); }
    if (ok) sel.push(l);
  }
  const nome = path.basename(f).replace(/\.(md|txt)$/i, "").replace(/^Conversa do WhatsApp com /i, "");
  const msgs = sel.filter(l => /^\[\d{1,2}:\d{2}\]|^\d{2}\/\d{2}\/\d{4},? \d{1,2}:\d{2}/.test(l)).length;
  resumo.push(`${nome}: ${msgs} mensagens na janela`);
  if (msgs) fs.writeFileSync(path.join(outDir, nome + ".txt"), `=== GRUPO: ${nome}\n` + limpa(sel));
}
console.log(resumo.join("\n"));
