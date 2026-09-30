#!/usr/bin/env node
/**
 * Gera um painel HTML com a semana de posts da Post for Me: o que está agendado
 * e o que já saiu, uma coluna por dia.
 *
 * Uso:
 *   node --env-file=.env scripts/painel-agendados.js [--saida painel-agendados.html]
 *     [--semanas-antes 1] [--semanas-depois 3] [--inicio segunda|sabado|domingo]
 *
 * O arquivo é um HTML só, sem servidor. Abre no navegador. Rodar de novo atualiza.
 *
 * SEGURANÇA: a resposta da Post for Me traz o token de acesso de cada rede
 * conectada dentro de `social_accounts`. Este script joga isso fora na entrada:
 * o HTML guarda só id, horário, status, legenda, mídia e rede. Mesmo assim, o
 * painel tem as tuas legendas e links de mídia: não publica ele em lugar público.
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.postforme.dev";
const API_KEY = (process.env.POSTFORME_API_KEY || "").trim();
const POR_PAGINA = 100;
const TETO_PAGINAS = 20;

function parseArgs() {
  const a = process.argv.slice(2);
  const p = { saida: "painel-agendados.html", antes: 1, depois: 3, inicio: "segunda" };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--saida") p.saida = a[++i];
    else if (a[i] === "--semanas-antes") p.antes = Number(a[++i]);
    else if (a[i] === "--semanas-depois") p.depois = Number(a[++i]);
    else if (a[i] === "--inicio") p.inicio = a[++i];
  }
  if (!["segunda", "sabado", "domingo"].includes(p.inicio)) {
    throw new Error(`--inicio tem que ser segunda, sabado ou domingo (veio "${p.inicio}")`);
  }
  return p;
}

async function pagina(offset) {
  const res = await fetch(`${API_BASE}/v1/social-posts?limit=${POR_PAGINA}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 401) {
      throw new Error(`API 401: ${t}\nConfere se a assinatura da Post for Me está em dia antes de trocar a chave.`);
    }
    throw new Error(`API ${res.status}: ${t}`);
  }
  return res.json();
}

// Só o que o painel precisa. O resto (tokens inclusive) morre aqui.
function limpar(post) {
  const cfg = post.platform_configurations || {};
  return {
    id: post.id,
    quando: post.scheduled_at || post.created_at,
    agendado: Boolean(post.scheduled_at),
    status: post.status,
    legenda: post.caption || "",
    midia: (post.media || []).map((m) => ({ url: m.url, thumb: m.thumbnail_url || null })),
    redes: [...new Set((post.social_accounts || []).map((c) => c && c.platform).filter(Boolean))],
    conta: ((post.social_accounts || [])[0] || {}).username || "",
    teste: Boolean(cfg.instagram && cfg.instagram.trial_reel_type),
    rascunho: Boolean(cfg.tiktok && cfg.tiktok.is_draft) || Boolean(post.isDraft),
  };
}

async function buscarTudo(desde, ate) {
  const posts = [];
  for (let n = 0; n < TETO_PAGINAS; n++) {
    const r = await pagina(n * POR_PAGINA);
    const itens = r.data || [];
    for (const it of itens) {
      const p = limpar(it);
      const t = new Date(p.quando).getTime();
      if (t >= desde && t <= ate) posts.push(p);
    }
    const total = (r.meta && r.meta.total) || 0;
    if (!itens.length || (n + 1) * POR_PAGINA >= total) break;
  }
  return posts.sort((a, b) => new Date(a.quando) - new Date(b.quando));
}

function html(dados) {
  const json = JSON.stringify(dados).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>posts da semana</title>
<style>
  :root{ --ink:#141414; --bg:#F2F1EE; --card:#fff; --line:#DEDBD4; --muted:#6B675F; --soft:#9C978D;
    --ag:#1F6FEB; --ok:#1A7F37; --warn:#B35900; }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ background:var(--bg); color:var(--ink); font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif; padding:24px 20px 60px; }
  header{ display:flex; flex-wrap:wrap; gap:14px 24px; align-items:flex-end; justify-content:space-between; margin-bottom:18px; }
  h1{ font-size:26px; letter-spacing:-.02em; }
  h1 small{ display:block; font-size:13px; font-weight:500; color:var(--muted); letter-spacing:0; margin-top:4px; }
  .nav{ display:flex; gap:6px; align-items:center; }
  .nav button{ font:600 14px system-ui,sans-serif; border:1px solid var(--line); background:var(--card); border-radius:999px; padding:7px 14px; cursor:pointer; }
  .nav .rot{ font-weight:700; padding:0 8px; min-width:190px; text-align:center; }
  .resumo{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
  .resumo span{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:6px 12px; font-size:13px; color:var(--muted); }
  .resumo b{ color:var(--ink); }
  .semana{ display:grid; grid-template-columns:repeat(7,minmax(150px,1fr)); gap:10px; overflow-x:auto; padding-bottom:6px; }
  .dia{ background:rgba(255,255,255,.45); border:1px solid var(--line); border-radius:14px; padding:10px; min-height:320px; }
  .dia.hoje{ border:2px solid var(--ink); }
  .dia h2{ font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); display:flex; justify-content:space-between; margin-bottom:8px; }
  .dia h2 b{ color:var(--ink); }
  .vazio{ border:2px dashed var(--line); border-radius:10px; padding:18px 8px; text-align:center; color:var(--soft); font-size:13px; }
  .post{ background:var(--card); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:10px; cursor:pointer; transition:transform .12s; }
  .post:hover{ transform:translateY(-2px); }
  .post.feito{ opacity:.62; }
  .mid{ position:relative; aspect-ratio:4/5; background:#E8E6E1; }
  .mid img, .mid video{ width:100%; height:100%; object-fit:cover; display:block; }
  .mid .n{ position:absolute; top:6px; right:6px; background:rgba(0,0,0,.72); color:#fff; font-size:11px; font-weight:700; border-radius:6px; padding:2px 6px; }
  .mid .play{ position:absolute; top:6px; left:6px; background:rgba(0,0,0,.72); color:#fff; font-size:11px; font-weight:700; border-radius:6px; padding:2px 6px; }
  .info{ padding:8px 10px 10px; }
  .hora{ display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:15px; }
  .st{ font-size:11px; font-weight:700; border-radius:999px; padding:2px 8px; }
  .st.ag{ background:#E6EFFD; color:var(--ag); } .st.ok{ background:#E4F3E8; color:var(--ok); } .st.out{ background:#FBEBDD; color:var(--warn); }
  .tags{ display:flex; flex-wrap:wrap; gap:4px; margin:6px 0; }
  .tags i{ font-style:normal; font-size:11px; font-weight:700; border:1px solid var(--line); border-radius:6px; padding:1px 6px; color:var(--muted); }
  .leg{ font-size:13px; color:#3A3732; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  dialog{ margin:auto; border:none; border-radius:16px; padding:0; width:min(760px,94vw); max-height:90vh; }
  dialog::backdrop{ background:rgba(0,0,0,.5); }
  .det{ padding:20px 22px 24px; }
  .det .top{ display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:12px; }
  .det h3{ font-size:18px; }
  .det button{ font:600 14px system-ui,sans-serif; border:1px solid var(--line); background:#fff; border-radius:999px; padding:6px 12px; cursor:pointer; }
  .fita{ display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:12px; }
  .fita > *{ flex:0 0 150px; width:150px; height:188px; object-fit:cover; border-radius:8px; background:#E8E6E1; }
  .det pre{ white-space:pre-wrap; font:14px/1.5 system-ui,sans-serif; background:var(--bg); border-radius:10px; padding:12px 14px; }
  .det .id{ font:12px ui-monospace,Menlo,monospace; color:var(--soft); margin-top:10px; }
  footer{ margin-top:22px; font-size:12px; color:var(--soft); }
  @media (max-width:760px){ .semana{ grid-template-columns:repeat(7,78vw); } }
</style>
</head>
<body>
<header>
  <h1>posts da semana<small id="gerado"></small></h1>
  <div class="nav">
    <button id="ant" aria-label="semana anterior">◀</button>
    <span class="rot" id="rot"></span>
    <button id="prox" aria-label="próxima semana">▶</button>
    <button id="hoje">hoje</button>
  </div>
</header>
<div class="resumo" id="resumo"></div>
<div class="semana" id="semana"></div>
<dialog id="dlg"><div class="det" id="det"></div></dialog>
<footer>gerado pela skill publicar-social-ratos · dados da Post for Me · horários no fuso deste computador</footer>

<script>
const DADOS = ${json};
const DIAS = ['dom','seg','ter','qua','qui','sex','sáb'];
const INICIO = { domingo:0, segunda:1, sabado:6 }[DADOS.inicio];
const REDE = { instagram:'Instagram', tiktok:'TikTok', linkedin:'LinkedIn', facebook:'Facebook', youtube:'YouTube', x:'X', threads:'Threads', bluesky:'Bluesky', pinterest:'Pinterest' };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

function comecoDaSemana(d){ const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate() - ((x.getDay() - INICIO + 7) % 7)); return x; }
const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dm = (d) => d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
const hm = (d) => d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

function estado(p){
  if (p.status === 'scheduled') return ['ag', 'agendado'];
  if (p.status === 'processed') return ['ok', 'saiu'];
  return ['out', p.status || '?'];
}

// A URL da mídia não diz se é imagem ou vídeo: tenta imagem, cai pra vídeo.
function midia(url, cls){
  return '<img class="' + (cls || '') + '" src="' + esc(url) + '" loading="lazy" alt="" onerror="virarVideo(this)">';
}
function virarVideo(img){
  const v = document.createElement('video');
  v.src = img.src + '#t=0.5'; v.muted = true; v.preload = 'metadata'; v.playsInline = true; v.className = img.className;
  img.replaceWith(v);
  const tag = v.closest('.mid') && v.closest('.mid').querySelector('.play');
  if (tag) tag.hidden = false;
}

function card(p){
  const [cls, txt] = estado(p);
  const d = new Date(p.quando);
  const m = p.midia[0];
  const tags = p.redes.map((r) => '<i>' + (REDE[r] || r) + '</i>');
  if (p.teste) tags.push('<i>reels de teste</i>');
  if (p.rascunho) tags.push('<i>rascunho</i>');
  if (!p.agendado) tags.push('<i>publicado na hora</i>');
  return '<div class="post' + (p.status === 'processed' ? ' feito' : '') + '" data-id="' + esc(p.id) + '">' +
    (m ? '<div class="mid">' + midia(m.thumb || m.url) +
      (p.midia.length > 1 ? '<span class="n">1/' + p.midia.length + '</span>' : '') +
      '<span class="play" hidden>vídeo</span></div>' : '') +
    '<div class="info"><div class="hora">' + hm(d) + '<span class="st ' + cls + '">' + txt + '</span></div>' +
    '<div class="tags">' + tags.join('') + '</div>' +
    '<div class="leg">' + esc(p.legenda.slice(0, 220)) + '</div></div></div>';
}

let semana = comecoDaSemana(new Date());

function desenhar(){
  const fim = new Date(semana); fim.setDate(fim.getDate() + 7);
  const daSemana = DADOS.posts.filter((p) => { const t = new Date(p.quando); return t >= semana && t < fim; });
  const ultimo = new Date(fim); ultimo.setDate(ultimo.getDate() - 1);
  $('#rot').textContent = dm(semana) + ' a ' + dm(ultimo);

  const ag = daSemana.filter((p) => p.status === 'scheduled').length;
  const saiu = daSemana.filter((p) => p.status === 'processed').length;
  const porRede = {};
  daSemana.forEach((p) => p.redes.forEach((r) => porRede[r] = (porRede[r] || 0) + 1));
  let vazios = 0;
  const cols = [];
  for (let i = 0; i < 7; i++){
    const d = new Date(semana); d.setDate(d.getDate() + i);
    const doDia = daSemana.filter((p) => mesmoDia(new Date(p.quando), d));
    if (!doDia.length) vazios++;
    cols.push('<div class="dia' + (mesmoDia(d, new Date()) ? ' hoje' : '') + '"><h2>' + DIAS[d.getDay()] + ' ' + dm(d) + '<b>' + doDia.length + '</b></h2>' +
      (doDia.length ? doDia.map(card).join('') : '<div class="vazio">nada agendado</div>') + '</div>');
  }
  $('#semana').innerHTML = cols.join('');
  $('#resumo').innerHTML =
    '<span><b>' + ag + '</b> agendados</span><span><b>' + saiu + '</b> já saíram</span>' +
    Object.entries(porRede).map(([r, n]) => '<span>' + (REDE[r] || r) + ': <b>' + n + '</b></span>').join('') +
    '<span><b>' + vazios + '</b> ' + (vazios === 1 ? 'dia vazio' : 'dias vazios') + '</span>';
  document.querySelectorAll('.post').forEach((el) => el.onclick = () => abrir(el.dataset.id));
}

function abrir(id){
  const p = DADOS.posts.find((x) => x.id === id);
  const [, txt] = estado(p);
  const d = new Date(p.quando);
  $('#det').innerHTML =
    '<div class="top"><h3>' + d.toLocaleString('pt-BR', { weekday:'long', day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' }) +
    ' · ' + txt + '</h3><button onclick="dlg.close()">fechar</button></div>' +
    (p.midia.length ? '<div class="fita">' + p.midia.map((m) => midia(m.thumb || m.url)).join('') + '</div>' : '') +
    '<pre>' + esc(p.legenda || '(sem legenda)') + '</pre>' +
    '<div class="id">' + esc(p.id) + ' · ' + p.redes.map((r) => REDE[r] || r).join(', ') + (p.conta ? ' · ' + esc(p.conta) : '') + '</div>';
  $('#dlg').showModal();
}

$('#ant').onclick = () => { semana.setDate(semana.getDate() - 7); desenhar(); };
$('#prox').onclick = () => { semana.setDate(semana.getDate() + 7); desenhar(); };
$('#hoje').onclick = () => { semana = comecoDaSemana(new Date()); desenhar(); };
$('#dlg').addEventListener('click', (e) => { if (e.target.id === 'dlg') e.target.close(); });
$('#gerado').textContent = DADOS.posts.length + ' posts · atualizado em ' + new Date(DADOS.gerado).toLocaleString('pt-BR');
desenhar();
</script>
</body>
</html>
`;
}

async function main() {
  if (!API_KEY) throw new Error("POSTFORME_API_KEY não encontrada no .env");
  const p = parseArgs();
  const agora = Date.now();
  const semana = 7 * 24 * 3600 * 1000;
  const desde = agora - (p.antes + 1) * semana;
  const ate = agora + (p.depois + 1) * semana;

  console.log("Buscando posts na Post for Me...");
  const posts = await buscarTudo(desde, ate);
  const saida = path.resolve(p.saida);
  fs.writeFileSync(saida, html({ gerado: new Date().toISOString(), inicio: p.inicio, posts }));

  const ag = posts.filter((x) => x.status === "scheduled").length;
  console.log(`${posts.length} posts no período (${ag} agendados).`);
  console.log(`Painel: ${saida}`);
}

main().catch((e) => {
  console.error(`\nErro: ${e.message}`);
  process.exit(1);
});
