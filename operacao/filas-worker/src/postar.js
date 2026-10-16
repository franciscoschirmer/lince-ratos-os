// Postagem automática: Instagram, Google Meu Negócio e TikTok a partir do Calendário Editorial.
//
// Fluxo (status do ClickUp):
//   "agendamento de postagem"  -> o Worker confere a peça (plataforma, data e hora, arte no Drive, legenda,
//                                 conta conectada) e devolve na tarefa:
//                                 OK  vira "postagem cadastrada" + comentário com o que vai sair e quando
//                                 NÃO fica onde está + comentário dizendo o que falta (corrigiu, ele confere de novo)
//   "postagem cadastrada"      -> na Data de Postagem (hora do campo) publica em cada plataforma marcada,
//                                 vira "postado/subido" e comenta o link do post. Falhou: comenta e avisa no canal.
// Dispara pelo webhook do ClickUp (resposta em segundos) e pelo cron de 5 em 5 minutos (publica e repesca).
//
// Onde cada coisa mora na tarefa:
//   PLATAFORMA (labels)   INSTAGRAM / REELS -> instagram · GMN -> gmn · TIKTOK -> tiktok (o resto é ignorado)
//   Data de Postagem      precisa ter hora (sem hora o ClickUp grava 04:00 UTC e a peça é recusada)
//   LINK DAS PEÇAS        pasta do Drive com a arte final: imagens e vídeos em ordem de nome. É a ÚNICA fonte de arte
//                         (anexo da tarefa é print de alteração ou referência, nunca entra no post)
//   Legenda               campo "LEGENDA" se existir; senão o que vem depois de uma linha "LEGENDA" na descrição
//   👔 Clientes           liga a peça às contas (KV conta:<nome do cliente>)
//
// A arte não é copiada: o Worker serve cada arquivo do Drive em GET /midia/<segredo>/<n>.<ext> (URL pública e
// imprevisível, válida até o post sair), e é dessa URL que o Instagram e o GMN puxam.
//
// Segredos/vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (operacional@: Drive + GMN),
//   TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, CLICKUP_WEBHOOK_SECRET, WORKER_URL (endereço público do Worker),
//   POSTAR_APENAS (opcional: clientes liberados, separados por ";", enquanto está em teste). Binding: KV POSTAR.
// KV conta:<cliente> = { instagram: { ig_user_id, token } | [ { ig_user_id, token, se } ], gmn: { location }, tiktok: { refresh_token } }

const L_CAL = '901325858184';
const F_PLAT = 'b6d3b85e-2bd2-4203-906a-ae78ad73bb77', F_POST = 'd4806a40-74c1-45fb-9c36-972aca497d00';
const F_LINK = '580f7133-23d5-4eb3-ba05-b137ea91871d', F_CLIENTE = '35443fa6-1e27-466f-9a6b-a2d132237079';
const S_AGENDAR = 'agendamento de postagem', S_CADASTRADA = 'postagem cadastrada', S_POSTADO = 'postado/subido';
const PLAT = { INSTAGRAM: 'instagram', REELS: 'instagram', GMN: 'gmn', TIKTOK: 'tiktok' };
const NOME = { instagram: 'Instagram', gmn: 'Google Meu Negócio', tiktok: 'TikTok' };
const IMG = /\.(png|jpe?g)$/i, VID = /\.(mp4|mov)$/i;
const TTL = 60 * 86400;
const tz = 'America/Sao_Paulo';
const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const espera = ms => new Promise(r => setTimeout(r, ms));
const quando = ms => new Date(Number(ms)).toLocaleString('pt-BR', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
const agoraStr = () => new Date().toLocaleString('pt-BR', { timeZone: tz });
const liberado = (env, cliente) => { const l = (env.POSTAR_APENAS || '').split(';').map(norm).filter(Boolean); return !l.length || (cliente && l.includes(norm(cliente))); };
const segredoNovo = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');

// ---------- ClickUp ----------
const cu = (env, api, path, opts) => api(env, `https://api.clickup.com/api/v2${path}`, opts);
const comentar = (env, api, id, texto) => cu(env, api, `/task/${id}/comment`, { method: 'POST', body: JSON.stringify({ comment_text: texto }) });
const mudarStatus = (env, api, id, status) => cu(env, api, `/task/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });

function lerPeca(t) {
  const campo = id => (t.custom_fields || []).find(f => f.id === id);
  // a lista de tarefas devolve {label}, a tarefa sozinha devolve só o id da opção: aceita os dois
  const opcoes = ((campo(F_PLAT) || {}).type_config || {}).options || [];
  const rotulos = ((campo(F_PLAT) || {}).value || []).map(l => (typeof l === 'string' ? ((opcoes.find(o => o.id === l) || {}).label || '') : (l.label || '')).toUpperCase());
  const plat = [...new Set(rotulos.map(l => PLAT[l]).filter(Boolean))];
  const ignoradas = rotulos.filter(l => !PLAT[l]);
  const fc = campo(F_CLIENTE);
  const cliente = fc && fc.value != null ? ((fc.type_config.options || []).find(o => o.orderindex == fc.value) || {}).name : null;
  const ms = (campo(F_POST) || {}).value ? Number(campo(F_POST).value) : null;
  const d = ms ? new Date(ms) : null;
  const semHora = !!d && d.getUTCHours() === 4 && d.getUTCMinutes() === 0; // valor que o ClickUp grava quando só tem a data
  const link = ((campo(F_LINK) || {}).value || '').trim();
  const pasta = (link.match(/folders\/([\w-]+)/) || [])[1] || null;
  const fl = (t.custom_fields || []).find(f => norm(f.name) === 'legenda' && f.value);
  let legenda = fl ? String(fl.value).trim() : '';
  if (!legenda) { const m = (t.description || '').match(/^\s*legenda\s*:?\s*$([\s\S]*)/im); legenda = m ? m[1].trim() : ''; }
  return { id: t.id, nome: t.name.replace(/\s+/g, ' ').trim(), url: t.url, status: norm(t.status.status), plat, ignoradas, cliente, ms, semHora, pasta, link, legenda };
}

// ---------- Google (Drive e GMN, conta operacional@) ----------
async function tokenGoogle(env) {
  if (!env.GOOGLE_REFRESH_TOKEN) throw new Error('o Google ainda não foi autorizado (Drive e GMN): passo 5 do Google');
  const cache = await env.POSTAR.get('google:token');
  if (cache) return cache;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }) });
  const j = await r.json();
  if (!j.access_token) throw new Error(`Google não renovou o token: ${String(j.error_description || j.error || '').slice(0, 100)}`);
  await env.POSTAR.put('google:token', j.access_token, { expirationTtl: Math.max(60, (j.expires_in || 3600) - 120) });
  return j.access_token;
}
async function arquivosDrive(env, pasta) {
  const tk = await tokenGoogle(env);
  const q = encodeURIComponent(`'${pasta}' in parents and trashed = false`);
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`, { headers: { Authorization: `Bearer ${tk}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(`Drive: ${(j.error && j.error.message) || r.status}`);
  return j.files.filter(f => IMG.test(f.name) || VID.test(f.name)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
}
const baixarDrive = async (env, id) => {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${await tokenGoogle(env)}` } });
  if (!r.ok) throw new Error(`Drive não entregou o arquivo (HTTP ${r.status})`);
  return r;
};
// registra os arquivos da peça e devolve as URLs públicas servidas por este Worker
async function registrarMidias(env, peca, arquivos) {
  const segredo = segredoNovo();
  const base = (env.WORKER_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('falta a variável WORKER_URL no Worker');
  const midias = arquivos.map((f, i) => {
    const ext = (f.name.match(/\.\w+$/) || ['.bin'])[0].toLowerCase();
    return { nome: f.name, drive: f.id, mime: f.mimeType, n: `${String(i + 1).padStart(2, '0')}${ext}`, url: `${base}/midia/${segredo}/${String(i + 1).padStart(2, '0')}${ext}`, video: VID.test(f.name), bytes: Number(f.size || 0) };
  });
  await env.POSTAR.put(`midia:${segredo}`, JSON.stringify(Object.fromEntries(midias.map(m => [m.n, { drive: m.drive, mime: m.mime }]))), { expirationTtl: TTL });
  return { segredo, midias };
}
export async function servirMidia(req, env) {
  const [, , segredo, n] = new URL(req.url).pathname.split('/');
  const mapa = segredo && n ? await env.POSTAR.get(`midia:${segredo}`, 'json') : null;
  if (!mapa || !mapa[n]) return new Response('não encontrado', { status: 404 });
  const r = await baixarDrive(env, mapa[n].drive);
  const h = new Headers({ 'content-type': mapa[n].mime || 'application/octet-stream', 'cache-control': 'public, max-age=3600', 'accept-ranges': 'none' });
  const len = r.headers.get('content-length'); if (len) h.set('content-length', len);
  return new Response(r.body, { headers: h });
}

// ---------- Publicadores ----------
// cliente com mais de uma conta (ex.: Hospital Piltcher e Cartão Piltcher): lista com "se" = regex no nome da peça; sem "se" é o padrão
function escolherConta(conta, peca) {
  if (!Array.isArray(conta)) return conta || {};
  const nome = norm(peca.nome);
  return conta.find(c => c.se && new RegExp(c.se, 'i').test(nome)) || conta.find(c => !c.se) || {};
}
async function fbPoll(id, token, limite) {
  for (let i = 0; i < limite; i++) {
    const s = await (await fetch(`https://graph.facebook.com/v21.0/${id}?fields=status_code,status&access_token=${token}`)).json();
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR') throw new Error(`Instagram recusou a mídia: ${String(s.status || '').slice(0, 120)}`);
    await espera(5000);
  }
  throw new Error('Instagram demorou demais pra processar a mídia');
}
async function fbPost(path, body) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${path}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });
  const j = await r.json();
  if (j.error) throw new Error(`Instagram: ${String(j.error.message || '').slice(0, 150)}`);
  return j;
}
async function publicarInstagram(env, conta, peca, midias) {
  const { ig_user_id: ig, token } = escolherConta(conta, peca);
  if (!ig || !token) throw new Error('Instagram: conta não configurada pra este cliente');
  const videos = midias.filter(m => m.video), imagens = midias.filter(m => !m.video);
  let container;
  if (videos.length === 1 && !imagens.length) {
    container = (await fbPost(`${ig}/media`, { media_type: 'REELS', video_url: videos[0].url, caption: peca.legenda, access_token: token })).id;
    await fbPoll(container, token, 36);
  } else if (imagens.length === 1 && !videos.length) {
    container = (await fbPost(`${ig}/media`, { image_url: imagens[0].url, caption: peca.legenda, access_token: token })).id;
    await fbPoll(container, token, 12);
  } else {
    const filhos = [];
    for (const m of midias) {
      const c = await fbPost(`${ig}/media`, m.video ? { media_type: 'VIDEO', video_url: m.url, is_carousel_item: 'true', access_token: token } : { image_url: m.url, is_carousel_item: 'true', access_token: token });
      filhos.push(c.id);
    }
    for (const c of filhos) await fbPoll(c, token, 24);
    container = (await fbPost(`${ig}/media`, { media_type: 'CAROUSEL', children: filhos.join(','), caption: peca.legenda, access_token: token })).id;
    await fbPoll(container, token, 12);
  }
  const pub = await fbPost(`${ig}/media_publish`, { creation_id: container, access_token: token });
  const link = await (await fetch(`https://graph.facebook.com/v21.0/${pub.id}?fields=permalink&access_token=${token}`)).json();
  return link.permalink || `id ${pub.id}`;
}

async function publicarGmn(env, conta, peca, midias) {
  if (!conta.location) throw new Error('Google Meu Negócio: perfil não configurado pra este cliente');
  const tk = await tokenGoogle(env);
  const foto = midias.find(m => !m.video);
  const body = { languageCode: 'pt-BR', summary: peca.legenda.slice(0, 1500), topicType: 'STANDARD' };
  if (foto) body.media = [{ mediaFormat: 'PHOTO', sourceUrl: foto.url }];
  const r = await fetch(`https://mybusiness.googleapis.com/v4/${conta.location}/localPosts`, { method: 'POST', headers: { Authorization: `Bearer ${tk}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google Meu Negócio: ${String((j.error && j.error.message) || r.status).slice(0, 150)}`);
  return j.searchUrl || j.name;
}

async function tokenTikTok(env, conta) {
  if (!conta.refresh_token) throw new Error('TikTok: conta não autorizada pra este cliente');
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: conta.refresh_token }) });
  const j = await r.json();
  if (!j.access_token) throw new Error(`TikTok não renovou o token: ${String(j.error_description || j.error || '').slice(0, 100)}`);
  return j.access_token;
}
async function publicarTikTok(env, conta, peca, midias) {
  const video = midias.find(m => m.video);
  if (!video) throw new Error('TikTok: a pasta não tem vídeo (foto no TikTok ainda não está ligada)');
  if (!video.bytes || video.bytes > 64 * 1024 * 1024) throw new Error('TikTok: vídeo sem tamanho conhecido ou acima de 64 MB');
  const tk = await tokenTikTok(env, conta);
  const init = await (await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', { method: 'POST', headers: { Authorization: `Bearer ${tk}`, 'content-type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ post_info: { title: peca.legenda.slice(0, 2200), privacy_level: conta.privacidade || 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
      source_info: { source: 'FILE_UPLOAD', video_size: video.bytes, chunk_size: video.bytes, total_chunk_count: 1 } }) })).json();
  if (init.error && init.error.code !== 'ok') throw new Error(`TikTok: ${init.error.code} ${String(init.error.message || '').slice(0, 120)}`);
  const arq = await baixarDrive(env, video.drive);
  const up = await fetch(init.data.upload_url, { method: 'PUT', headers: { 'content-type': 'video/mp4', 'content-length': String(video.bytes), 'content-range': `bytes 0-${video.bytes - 1}/${video.bytes}` }, body: arq.body });
  if (!up.ok) throw new Error(`TikTok não recebeu o vídeo (HTTP ${up.status})`);
  return `enviado (publish_id ${init.data.publish_id}); abre o TikTok pra conferir`;
}
const PUBLICAR = { instagram: publicarInstagram, gmn: publicarGmn, tiktok: publicarTikTok };

// ---------- Cadastro (validação) ----------
async function cadastrar(env, api, t) {
  const p = lerPeca(t);
  const faltas = [];
  if (!p.plat.length) faltas.push('marca a PLATAFORMA (Instagram, Reels, GMN ou TikTok)');
  if (!p.ms) faltas.push('preenche a Data de Postagem');
  else if (p.semHora) faltas.push('a Data de Postagem está sem horário');
  else if (p.ms < Date.now() + 10 * 60000) faltas.push('a Data de Postagem já passou (ou é daqui a menos de 10 min)');
  // arte: SÓ a pasta do Drive em LINK DAS PEÇAS. Anexo da tarefa nunca é arte (é print de alteração, referência): regra do Francisco, 2026-10-07
  if (!p.pasta) faltas.push('LINK DAS PEÇAS precisa ser uma pasta do Drive');
  if (!p.legenda) faltas.push('sem legenda: campo LEGENDA ou uma linha "LEGENDA" na descrição seguida do texto');
  if (!p.cliente) faltas.push('sem cliente no campo 👔 Clientes');
  // em teste (POSTAR_APENAS): peça de cliente fora da lista é ignorada em silêncio, sem comentário e sem mexer no status,
  // porque a equipe usa esses status à mão enquanto a automação não está liberada
  if (!liberado(env, p.cliente)) { console.log(`cadastro ${p.id}: cliente fora do teste, ignorado`); return false; }
  const contas = p.cliente ? (await env.POSTAR.get(`conta:${p.cliente}`, 'json')) || {} : {};
  for (const pl of p.plat) if (!contas[pl]) faltas.push(`${NOME[pl]} de ${p.cliente || '?'} ainda não está conectado`);
  let midias = [], segredo = null;
  if (!faltas.length) {
    try {
      const arqs = await arquivosDrive(env, p.pasta);
      if (!arqs.length) faltas.push('a pasta do Drive não tem imagem nem vídeo');
      else if (arqs.filter(a => IMG.test(a.name)).length > 10) faltas.push(`a pasta tem ${arqs.length} imagens; o Instagram aceita até 10`);
      else ({ segredo, midias } = await registrarMidias(env, p, arqs));
    } catch (e) { faltas.push(e.message); }
  }
  const assinatura = faltas.join('|');
  if (faltas.length) {
    if (await env.POSTAR.get(`erro:${p.id}`) !== assinatura) { // não repete o mesmo aviso a cada 5 min
      await comentar(env, api, p.id, `❌ Não cadastrei a postagem:\n` + faltas.map(f => `• ${f}`).join('\n') + `\n\nCorrige e eu confiro de novo em até 5 min.`);
      await env.POSTAR.put(`erro:${p.id}`, assinatura, { expirationTtl: 7 * 86400 });
    }
    return false;
  }
  await env.POSTAR.put(`peca:${p.id}`, JSON.stringify({ ...p, midias, segredo, pendentes: p.plat }), { expirationTtl: TTL });
  await env.POSTAR.delete(`erro:${p.id}`);
  await mudarStatus(env, api, p.id, S_CADASTRADA);
  const tipo = midias.length === 1 ? (midias[0].video ? 'vídeo' : 'imagem') : `carrossel de ${midias.length}`;
  await comentar(env, api, p.id, `✅ Postagem cadastrada\n• Quando: ${quando(p.ms)}\n• Onde: ${p.plat.map(x => NOME[x]).join(', ')}${p.ignoradas.length ? ` (ignorei: ${p.ignoradas.join(', ')})` : ''}\n• O quê: ${tipo} · ${midias.map(m => m.nome).join(', ')}\n• Legenda: ${p.legenda.slice(0, 120).replace(/\s+/g, ' ')}${p.legenda.length > 120 ? '…' : ''}\n\nPra mudar algo: ajusta e volta o status pra "${S_AGENDAR}".`);
  return true;
}

// ---------- Publicação ----------
async function publicar(env, api, t, avisar) {
  const g = await env.POSTAR.get(`peca:${t.id}`, 'json');
  if (!g) return; // a equipe também usa "postagem cadastrada" à mão: peça que o Worker não cadastrou não é dele
  const atual = lerPeca(t);
  if (!liberado(env, atual.cliente)) return;
  if (atual.ms !== g.ms) { await mudarStatus(env, api, t.id, S_AGENDAR); return; } // mudou a data depois: reconfere
  if (g.ms > Date.now()) return;
  if (await env.POSTAR.get(`lock:${t.id}`)) return;
  await env.POSTAR.put(`lock:${t.id}`, '1', { expirationTtl: 600 });
  const contas = (await env.POSTAR.get(`conta:${g.cliente}`, 'json')) || {};
  const ok = [], erros = [];
  for (const pl of g.pendentes.slice()) {
    try { ok.push(`${NOME[pl]}: ${await PUBLICAR[pl](env, contas[pl] || {}, g, g.midias)}`); g.pendentes = g.pendentes.filter(x => x !== pl); }
    catch (e) { erros.push(`${NOME[pl]}: ${e.message}`); }
    await env.POSTAR.put(`peca:${t.id}`, JSON.stringify(g), { expirationTtl: TTL });
  }
  await env.POSTAR.delete(`lock:${t.id}`);
  if (!g.pendentes.length) {
    await mudarStatus(env, api, t.id, S_POSTADO);
    await comentar(env, api, t.id, `🚀 Postado\n` + ok.map(x => `• ${x}`).join('\n'));
    if (g.segredo) await env.POSTAR.delete(`midia:${g.segredo}`); // a URL pública da arte morre com o post
  } else {
    await comentar(env, api, t.id, (ok.length ? `🚀 Postado\n` + ok.map(x => `• ${x}`).join('\n') + '\n\n' : '') + `⚠️ Não saiu\n` + erros.map(x => `• ${x}`).join('\n') + `\n\nTento de novo em 5 min. Pra desistir, muda o status.`);
    if (avisar) await avisar(`⚠️ **Postagem não saiu** · ${agoraStr()}\n[${g.nome}](${g.url})\n` + erros.map(x => `- ${x}`).join('\n'));
  }
}

// ---------- Entradas: cron e webhook ----------
export async function cronPostar(env, api, avisar) {
  const busca = async status => {
    const r = await cu(env, api, `/list/${L_CAL}/task?statuses[]=${encodeURIComponent(status)}&subtasks=true&include_closed=true`);
    return r.tasks || [];
  };
  for (const t of await busca(S_AGENDAR)) { try { await cadastrar(env, api, t); } catch (e) { console.error(`cadastro ${t.id}: ${e.message}`); } }
  for (const t of await busca(S_CADASTRADA)) {
    const g = await env.POSTAR.get(`peca:${t.id}`, 'json');
    if (!g || g.ms > Date.now() || !liberado(env, lerPeca(t).cliente)) continue;
    if (!env.WORKER_URL || !env.PREVIEW_CHAVE) { try { await publicar(env, api, t, avisar); } catch (e) { console.error(`publicação ${t.id}: ${e.message}`); } continue; }
    // dispara uma invocação própria por peça: no plano grátis cada invocação tem 50 subrequisições, e um carrossel grande gasta boa parte disso
    // pela ligação interna SELF: fetch do próprio endereço workers.dev é bloqueado pela Cloudflare (sem erro), e a peça nunca saía
    try {
      const url = `${env.WORKER_URL.replace(/\/$/, '')}/publicar?id=${t.id}`, opts = { method: 'POST', headers: { 'x-chave': env.PREVIEW_CHAVE } };
      const r = env.SELF ? await env.SELF.fetch(url, opts) : await fetch(url, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) { console.error(`disparo ${t.id}: ${e.message}`); try { await publicar(env, api, t, avisar); } catch (e2) { console.error(`publicação ${t.id}: ${e2.message}`); } }
  }
}

export async function publicarUma(req, env, api, avisar, ctx) {
  if (!env.PREVIEW_CHAVE || req.headers.get('x-chave') !== env.PREVIEW_CHAVE) return new Response('não encontrado', { status: 404 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return new Response('sem id', { status: 400 });
  ctx.waitUntil((async () => {
    try { await publicar(env, api, await cu(env, api, `/task/${id}`), avisar); }
    catch (e) { console.error(`publicação ${id}: ${e.message}`); }
  })());
  return new Response('ok');
}

// aoMudarStatus(antes, depois): quem mais quer saber de mudança de status (o Farol reconta quando entra ou sai de "postado/subido")
export async function webhookPostar(req, env, api, ctx, aoMudarStatus) {
  const corpo = await req.text();
  if (env.CLICKUP_WEBHOOK_SECRET) {
    const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.CLICKUP_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const hex = [...new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(corpo)))].map(b => b.toString(16).padStart(2, '0')).join('');
    if (hex !== (req.headers.get('x-signature') || '')) return new Response('assinatura inválida', { status: 401 });
  }
  let ev; try { ev = JSON.parse(corpo); } catch { return new Response('json inválido', { status: 400 }); }
  const depois = (ev.history_items || []).map(h => norm(h.after && h.after.status)).find(Boolean);
  const antes = (ev.history_items || []).map(h => norm(h.before && h.before.status)).find(Boolean);
  if (ev.event === 'taskStatusUpdated' && aoMudarStatus)
    ctx.waitUntil(aoMudarStatus(antes, depois).catch(e => console.error(`webhook status ${ev.task_id}: ${e.message}`)));
  if (ev.event === 'taskStatusUpdated' && depois === S_AGENDAR && ev.task_id) {
    ctx.waitUntil((async () => {
      try { await cadastrar(env, api, await cu(env, api, `/task/${ev.task_id}`)); }
      catch (e) { console.error(`webhook ${ev.task_id}: ${e.message}`); }
    })());
  }
  return new Response('ok');
}
