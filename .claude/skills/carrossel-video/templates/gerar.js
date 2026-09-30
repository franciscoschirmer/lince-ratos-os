/**
 * Template do carrossel. Copiar pra pasta de trabalho e preencher as duas
 * metades. A separacao entre elas e o que faz a skill servir pra qualquer
 * marca:
 *
 *   MARCA   <- vem de marca/design-guide.md, preenchido no setup
 *   SLIDES  <- o conteudo deste carrossel especifico
 *
 * Roda com: node gerar.js
 * Sai: slide-01.html ... slide-NN.html
 *
 * O contrato com o compor.js sao tres classes: .janela, .janela-barra e
 * .janela-midia. O resto do CSS e livre.
 */
const fs = require("fs");

// ─── MARCA ───────────────────────────────────────────────────────────────────
const MARCA = {
  nome: "seu canal",
  fonte: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  temas: {
    // claro: miolo com video. escuro: capa e slides de texto.
    // destaque: o slide de soco e o CTA (cor cheia, sem realce).
    claro:    { fundo:"#F4F1EA", tinta:"#14231C", suave:"rgba(20,35,28,0.62)",
                destaque:"#1F7A4D", borda:"#14231C", rotulo:"#9A9A9A",
                realce:"color:#1F7A4D;" },
    escuro:   { fundo:"#14231C", tinta:"#F4F1EA", suave:"rgba(244,241,234,0.60)",
                destaque:"#5FD39B", borda:"#2C3F35", rotulo:"#7C8F85",
                realce:"color:#5FD39B;" },
    destaque: { fundo:"#1F7A4D", tinta:"#FFFFFF", suave:"rgba(255,255,255,0.72)",
                destaque:"#FFFFFF", borda:"#0E3A24", rotulo:"#9FC9B3",
                realce:"color:inherit;" },
  },
};

// ─── SLIDES ──────────────────────────────────────────────────────────────────
// Preencher DEPOIS de ler cada corte: o texto e o degrau que entrega a fala,
// nao um resumo dela. Agrupar os videos em pares e trios, nao alternar.
// Slide de video: corpo de 1 a 2 linhas. Slide de texto: 3 a 4.
const SLIDES = [
  { tema:"escuro", video:true, rotulo:"ouve isso",
    kicker:"o gancho",
    titulo:"a frase que abre, com uma <span>palavra</span> em destaque.",
    corpo:"Uma linha que prepara a fala do corte." },

  { tema:"claro", video:true, rotulo:"o miolo",
    kicker:"",
    titulo:"segundo slide de vídeo.",
    corpo:"" },

  { tema:"escuro", video:false,
    kicker:"o respiro",
    titulo:"slide sem vídeo.",
    corpo:"Aqui o corpo pode ter três ou quatro linhas, porque não tem vídeo pra carregar o peso e o texto precisa segurar sozinho." },

  { tema:"destaque", video:false,
    kicker:"",
    titulo:"o CTA.",
    corpo:"Pede uma ação (salvar, comentar), nunca um clique pra assistir." },
];

// ─── render ──────────────────────────────────────────────────────────────────
const esc = (n) => String(n).padStart(2, "0");

function html(s) {
  const t = MARCA.temas[s.tema];
  // titulo longo desce de tamanho pra nao estourar a caixa
  const cru = s.titulo.replace(/<[^>]+>/g, "");
  const tam = cru.length > 46 ? 62 : cru.length > 34 ? 70 : 78;
  // sem video o texto sobe pro centro, senao sobra um buraco onde a janela iria
  const alinha = s.video ? "space-between" : "center";
  return `<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1080px; height:1350px; background:${t.fundo}; color:${t.tinta};
    font-family:${MARCA.fonte}; padding:72px 72px 140px;
    display:flex; flex-direction:column; justify-content:${alinha};
    -webkit-font-smoothing:antialiased; position:relative;
  }
  .marca  { position:absolute; top:72px; left:72px;
            font-size:22px; font-weight:700; letter-spacing:.14em;
            text-transform:uppercase; color:${t.suave}; }
  .kicker { font-size:27px; font-weight:600; color:${t.suave}; margin-bottom:22px; }
  .titulo { font-size:${tam}px; font-weight:800; line-height:1.06;
            letter-spacing:-.022em; }
  .titulo span { ${t.realce} }
  .corpo  { font-size:31px; line-height:1.42; color:${t.suave};
            margin-top:26px; max-width:880px; }
  .janela { width:930px; border:3px solid ${t.borda}; border-radius:20px;
            overflow:hidden; }
  .janela-barra { height:64px; background:${t.borda}; display:flex;
                  align-items:center; gap:12px; padding:0 26px; }
  .janela-barra .sinal { width:16px; height:20px; background:${t.destaque};
                         clip-path:polygon(0 0,100% 50%,0 100%); }
  .janela-barra .rotulo { font-size:19px; font-weight:700; letter-spacing:.1em;
                          text-transform:uppercase; color:${t.rotulo}; }
  /* 16:9 exato: o 1920x1080 entra so escalando, sem corte */
  .janela-midia { width:100%; aspect-ratio:16/9; background:#000; }
</style>

<div class="marca">${MARCA.nome}</div>

${s.video ? "<div></div>" : ""}
<div>
  ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ""}
  <div class="titulo">${s.titulo}</div>
  ${s.corpo ? `<div class="corpo">${s.corpo}</div>` : ""}
</div>

${s.video ? `<div class="janela">
  <div class="janela-barra">
    <div class="sinal"></div>
    <div class="rotulo">${s.rotulo}</div>
  </div>
  <div class="janela-midia"></div>
</div>` : ""}
`;
}

SLIDES.forEach((s, i) => {
  const nome = `slide-${esc(i + 1)}.html`;
  fs.writeFileSync(nome, html(s));
  console.log(`${nome}  ${s.tema.padEnd(8)} ${s.video ? "video" : "texto"}`);
});
