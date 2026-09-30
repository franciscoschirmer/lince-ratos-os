/**
 * Carrossel de prova da versao NEUTRA da carrossel-video.
 *
 *   node gerar.js
 *
 * Duas metades bem separadas, e e essa separacao que a skill de aluno precisa:
 *   MARCA   - o que viria de marca/design-guide.md, preenchido no setup
 *   SLIDES  - o conteudo deste carrossel especifico
 * Nenhuma cor, fonte ou palavra do Ratos aqui dentro.
 *
 * 10 slides, 7 com janela de video. Os 3 de texto viram MP4 de 4s depois,
 * porque o Instagram reagrupa carrossel misto por tipo e embaralha a ordem.
 */
const fs = require("fs");

// ─── MARCA (vem do design-guide do usuario) ──────────────────────────────────
const MARCA = {
  nome: "seu canal",
  fonte: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  temas: {
    claro:    { fundo:"#F4F1EA", tinta:"#14231C", suave:"rgba(20,35,28,0.62)",
                destaque:"#1F7A4D", borda:"#14231C", rotulo:"#9A9A9A",
                realce:"color:#1F7A4D;" },
    escuro:   { fundo:"#14231C", tinta:"#F4F1EA", suave:"rgba(244,241,234,0.60)",
                destaque:"#5FD39B", borda:"#2C3F35", rotulo:"#7C8F85",
                realce:"color:#5FD39B;" },
    destaque: { fundo:"#1F7A4D", tinta:"#FFFFFF", suave:"rgba(255,255,255,0.72)",
                destaque:"#FFFFFF", borda:"#0E3A24", rotulo:"#9FC9B3",
                // em fundo cheio o realce nao tem pra onde ir: o titulo segura
                realce:"color:inherit;" },
  },
};

// ─── SLIDES (o conteudo deste carrossel) ─────────────────────────────────────
// Os cortes foram escolhidos ANTES do texto: cada fala foi lida primeiro, e o
// texto do slide e o degrau que entrega ela, nao um resumo dela.
// Os videos vem agrupados (1-2, 4-5-6, 8-9), nao alternados.
const SLIDES = [
  { tema:"escuro", video:true, rotulo:"ouve isso",
    kicker:"a primeira coisa a entender",
    titulo:"ninguém acorda com <span>vontade</span> de correr.",
    corpo:"Nem quem corre distâncias longas há mais de 30 anos." },

  { tema:"claro", video:true, rotulo:"o que substitui",
    kicker:"então o que faz levantar da cama",
    titulo:"marca a hora.<br>E <span>obedece</span> a hora.",
    corpo:"Não é esperar pra ver se tu vai estar disposto." },

  { tema:"escuro", video:false,
    kicker:"o resumo até aqui",
    titulo:"a vontade não vem antes.<br>Ela vem <span>depois</span>.",
    corpo:"Ele corre há 30 anos e acorda contrariado todo dia. O que ele tem não é motivação, é hora marcada. A disposição aparece quando a corrida acaba, não quando ela começa." },

  { tema:"claro", video:true, rotulo:"o erro comum",
    kicker:"quem anima demais no primeiro dia",
    titulo:"42 km em 15 dias?<br>Tu <span>morre</span> no caminho.",
    corpo:"E nem chega." },

  { tema:"claro", video:true, rotulo:"o começo real",
    kicker:"então começa por onde",
    titulo:"começa andando.<br>E andando <span>rápido</span>.",
    corpo:"30 minutos depressa. Não é passeio de vitrine em shopping." },

  { tema:"claro", video:true, rotulo:"o método",
    kicker:"aí a corrida entra",
    titulo:"anda 500.<br>Corre <span>100</span>. Repete.",
    corpo:"Dentro dos mesmos 30 minutos." },

  { tema:"destaque", video:false,
    kicker:"e a conta vai virando",
    titulo:"500 e 100<br>vira 300 e 300.",
    corpo:"Semana após semana tu tira metro da caminhada e põe na corrida. Depois 400 e 200. Depois 300 e 300. Até os 30 minutos virarem corrida inteira. Não é de um dia pro outro, e não precisa ser." },

  { tema:"claro", video:true, rotulo:"o risco de verdade",
    kicker:"a semana que derruba tudo",
    titulo:"voltou de viagem?<br><span>Retoma.</span>",
    corpo:"Anos de esforço morrem numa semana parado." },

  { tema:"claro", video:true, rotulo:"o horizonte",
    kicker:"por que ir devagar importa tanto",
    titulo:"tu tem 40?<br>Tem <span>40 anos</span> de corrida pela frente.",
    corpo:"Por isso não dá pra se machucar agora." },

  { tema:"destaque", video:false,
    kicker:"",
    titulo:"guarda esse aqui<br>pra segunda-feira.",
    corpo:"É o dia em que a hora marcada costuma ser testada." },
];

// ─── render ──────────────────────────────────────────────────────────────────
const esc = (n) => String(n).padStart(2, "0");

function html(s) {
  const t = MARCA.temas[s.tema];
  // titulo longo desce de tamanho pra nao estourar a caixa
  const cru = s.titulo.replace(/<[^>]+>/g, "");
  const tam = cru.length > 46 ? 62 : cru.length > 34 ? 70 : 78;
  return `<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1080px; height:1350px; background:${t.fundo}; color:${t.tinta};
    font-family:${MARCA.fonte}; padding:72px 72px 140px;
    display:flex; flex-direction:column; justify-content:space-between;
    -webkit-font-smoothing:antialiased;
  }
  .marca  { font-size:22px; font-weight:700; letter-spacing:.14em;
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

<div><div class="marca">${MARCA.nome}</div></div>

<div>
  ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ""}
  <div class="titulo">${s.titulo}</div>
  <div class="corpo">${s.corpo}</div>
</div>

${s.video ? `<div class="janela">
  <div class="janela-barra">
    <div class="sinal"></div>
    <div class="rotulo">${s.rotulo}</div>
  </div>
  <div class="janela-midia"></div>
</div>` : `<div></div>`}
`;
}

SLIDES.forEach((s, i) => {
  const nome = `slide-${esc(i + 1)}.html`;
  fs.writeFileSync(nome, html(s));
  console.log(`${nome}  ${s.tema.padEnd(8)} ${s.video ? "video" : "texto"}`);
});
