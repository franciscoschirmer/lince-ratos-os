#!/usr/bin/env node
/**
 * Publica ou agenda post via Post for Me.
 *
 * Uso:
 *   node --env-file=.env scripts/publish-postforme.js \
 *     --platform instagram|tiktok|linkedin \
 *     --images "slide-01.png,slide-02.png,..."   (carrossel ou imagem única)
 *     --video "corte.mp4"                        (ou um vídeo)
 *     --media-url "https://..."                  (ou um vídeo que já subiu antes)
 *     --caption "legenda do post" \
 *     [--schedule 2026-10-05T18:30:00-03:00]     (agenda em vez de publicar agora)
 *     [--placement reels|timeline|stories]       (Instagram; vídeo vai como reels por padrão)
 *     [--trial manual|performance]               (Instagram: reels de teste)
 *     [--account-id spc_xxx] [--draft] [--sem-conferir] [--dry-run]
 *
 * AGENDAR (--schedule): ISO 8601 SEMPRE com fuso. "2026-10-05T18:30:00-03:00" é
 * 18h30 de Brasília. Sem o fuso, o horário vira UTC e o post sai 3h antes.
 *
 * REELS DE TESTE (--trial): o reels sai só pra quem NÃO segue a conta. Não aparece
 * no perfil nem pros seguidores. "performance" = o Instagram libera pra todo mundo
 * sozinho se for bem. "manual" = tu libera depois, no app. Exige 1.000+ seguidores.
 * A Post for Me NÃO valida esse valor: um erro de digitação passa e o reels sai
 * normal, pra todo mundo. Por isso a lista de valores aceitos é conferida aqui.
 *
 * CONFERIR ORDEM (carrossel): a Post for Me às vezes guarda os slides fora de
 * ordem (já aconteceu de um carrossel abrir pelo slide 8). Depois de criar o post,
 * o script baixa o que ficou guardado, compara com os arquivos locais e, se a ordem
 * não bater, apaga e cria de novo (até 3 vezes). --sem-conferir pula isso.
 *
 * REAPROVEITAR VÍDEO (--media-url): o upload imprime a URL hospedada
 * ("-> https://..."). Passar ela pro TikTok evita subir o mesmo arquivo duas vezes.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.postforme.dev";
const API_KEY = (process.env.POSTFORME_API_KEY || "").trim();
const TRIAL_REEL_TYPES = ["manual", "performance"];
const TENTATIVAS_ORDEM = 3;
const PAUSA_REFAZER_S = 20;

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const p = { platform: "instagram" };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--platform") p.platform = args[++i];
    else if (a === "--images") p.images = args[++i];
    else if (a === "--video") p.video = args[++i];
    else if (a === "--media-url") p.mediaUrl = args[++i];
    else if (a === "--caption") p.caption = args[++i];
    else if (a === "--account-id") p.accountId = args[++i];
    else if (a === "--schedule") p.schedule = args[++i];
    else if (a === "--placement") p.placement = args[++i];
    else if (a === "--trial") p.trial = args[++i];
    else if (a === "--draft") p.draft = true;
    else if (a === "--sem-conferir") p.semConferir = true;
    else if (a === "--dry-run") p.dryRun = true;
  }
  p.platform = (p.platform || "").toLowerCase();
  return p;
}

const dormir = (s) => new Promise((r) => setTimeout(r, s * 1000));

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      throw new Error(
        `API 401: ${text}\n` +
          `Antes de trocar a chave, confere se a assinatura da Post for Me está em dia: ` +
          `conta com pagamento atrasado devolve esse mesmo erro com a chave certa.`
      );
    }
    if (res.status === 429) {
      throw new Error(`API 429: ${text}\nMuitos posts seguidos. Espera 1 minuto e tenta de novo.`);
    }
    throw new Error(`API ${res.status}: ${text}`);
  }
  const corpo = await res.text();
  return corpo ? JSON.parse(corpo) : {};
}

async function contaConectada(platform, accountId) {
  if (accountId) return { id: accountId, username: accountId };
  const r = await apiFetch(`/v1/social-accounts?platform=${platform}`);
  const conectadas = (r.data || r).filter((a) => a.status === "connected");
  if (!conectadas.length) {
    throw new Error(`Nenhuma conta de ${platform} conectada na Post for Me. Conecta no painel deles.`);
  }
  return conectadas[0];
}

async function uploadMedia(filePath) {
  const { upload_url, media_url } = await apiFetch("/v1/media/create-upload-url", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mb = (buffer.length / 1024 / 1024).toFixed(1);
  console.log(`  subindo ${path.basename(filePath)} (${mb} MB)...`);
  const res = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream" },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Upload falhou ${res.status}: ${await res.text()}`);
  console.log(`  ok: ${path.basename(filePath)} -> ${media_url}`);
  return media_url;
}

function validar(p) {
  if (!["instagram", "tiktok", "linkedin"].includes(p.platform)) {
    throw new Error(`--platform tem que ser instagram, tiktok ou linkedin (veio "${p.platform}")`);
  }
  if (p.schedule) {
    const q = new Date(p.schedule);
    if (Number.isNaN(q.getTime())) {
      throw new Error(`--schedule inválido: "${p.schedule}" (use ISO 8601 com fuso, ex: 2026-10-05T18:30:00-03:00)`);
    }
    if (q.getTime() <= Date.now()) throw new Error(`--schedule está no passado: ${q.toISOString()}`);
    if (!/([+-]\d\d:?\d\d|Z)$/.test(p.schedule.trim())) {
      throw new Error(`--schedule sem fuso: "${p.schedule}". Põe o fuso no fim, ex: -03:00 pra Brasília`);
    }
  }
  if (p.trial) {
    if (p.platform !== "instagram") throw new Error(`--trial só existe no Instagram`);
    if (!TRIAL_REEL_TYPES.includes(p.trial)) {
      throw new Error(`--trial inválido: "${p.trial}". Use ${TRIAL_REEL_TYPES.join(" ou ")}.`);
    }
    if (!p.video && !p.mediaUrl) throw new Error(`--trial só vale pra vídeo (reels)`);
    if (p.placement && p.placement !== "reels") throw new Error(`--trial só vale com --placement reels`);
  }
  if (p.caption && p.caption.length > 2200) {
    throw new Error(`legenda com ${p.caption.length} caracteres. O limite do Instagram e do TikTok é 2.200`);
  }
}

function montarCorpo({ accountId, mediaUrls, p, placement }) {
  const body = { caption: p.caption || "", social_accounts: [accountId] };
  if (mediaUrls && mediaUrls.length) body.media = mediaUrls.map((url) => ({ url }));
  if (p.schedule) body.scheduled_at = new Date(p.schedule).toISOString();

  if (p.platform === "instagram" && (placement || p.trial)) {
    const ig = {};
    if (placement) ig.placement = placement;
    if (p.trial) ig.trial_reel_type = p.trial;
    body.platform_configurations = { instagram: ig };
  }
  // Rascunho do TikTok TEM que ir em platform_configurations.tiktok.is_draft.
  // Com body.isDraft a Post for Me segura o post do lado dela e nunca manda pro TikTok.
  if (p.draft && p.platform === "tiktok") {
    body.platform_configurations = { tiktok: { is_draft: true, auto_add_music: false } };
  } else if (p.draft) {
    body.isDraft = true;
  }
  return body;
}

async function md5Url(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`não consegui baixar ${url} (${res.status})`);
  return crypto.createHash("md5").update(Buffer.from(await res.arrayBuffer())).digest("hex");
}

async function conferirOrdem(postId, locais) {
  const post = await apiFetch(`/v1/social-posts/${postId}`);
  const esperado = locais.map((f) => crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex"));
  const guardado = [];
  for (const m of post.media || []) guardado.push(await md5Url(m.url));
  const pos = new Map(esperado.map((h, i) => [h, String(i + 1).padStart(2, "0")]));
  return { certo: guardado.join() === esperado.join(), ordem: guardado.map((h) => pos.get(h) || "??") };
}

function imprimirAgenda(schedule) {
  if (!schedule) return;
  const q = new Date(schedule);
  console.log(`Agendado pra: ${q.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })} (hora deste computador)`);
}

async function main() {
  if (!API_KEY) throw new Error("POSTFORME_API_KEY não encontrada no .env");
  const p = parseArgs();
  validar(p);

  const temVideo = Boolean(p.video || p.mediaUrl);
  const imagens = p.images ? p.images.split(",").map((s) => path.resolve(s.trim())) : [];
  if (!temVideo && !imagens.length && p.platform !== "linkedin") {
    throw new Error("passa --images, --video ou --media-url");
  }
  for (const f of [...imagens, ...(p.video ? [path.resolve(p.video)] : [])]) {
    if (!fs.existsSync(f)) throw new Error(`arquivo não encontrado: ${f}`);
  }

  // Vídeo no Instagram vai como reels por padrão: o default da API não é documentado.
  const placement = p.placement || (temVideo && p.platform === "instagram" ? "reels" : undefined);
  const tipo = temVideo ? "vídeo" : imagens.length > 1 ? `carrossel (${imagens.length} slides)` : imagens.length ? "imagem" : "texto";

  const conta = await contaConectada(p.platform, p.accountId);
  console.log(`\n[Post for Me] ${p.schedule ? "agendando" : "publicando"} ${tipo} no ${p.platform} · conta ${conta.username || conta.id}`);

  if (p.dryRun) {
    console.log("\nDRY RUN, nada foi criado.");
    if (imagens.length) imagens.forEach((f) => console.log(`  - ${path.basename(f)}`));
    if (p.video) console.log(`  - ${path.basename(p.video)}`);
    if (p.mediaUrl) console.log(`  - reaproveitando ${p.mediaUrl}`);
    if (placement) console.log(`Placement: ${placement}`);
    if (p.trial) console.log(`Reels de teste: ${p.trial} (só quem NÃO segue vê)`);
    if (p.draft) console.log(`Rascunho: sim`);
    imprimirAgenda(p.schedule);
    console.log(`Legenda: ${(p.caption || "").slice(0, 120)}${(p.caption || "").length > 120 ? "..." : ""}`);
    return;
  }

  let mediaUrls = [];
  if (p.mediaUrl) mediaUrls = [p.mediaUrl];
  else if (p.video) mediaUrls = [await uploadMedia(path.resolve(p.video))];
  else for (const f of imagens) mediaUrls.push(await uploadMedia(f));

  const ehCarrossel = imagens.length > 1 && !temVideo;
  for (let t = 1; t <= TENTATIVAS_ORDEM; t++) {
    const post = await apiFetch("/v1/social-posts", {
      method: "POST",
      body: JSON.stringify(montarCorpo({ accountId: conta.id, mediaUrls, p, placement })),
    });
    console.log(`\nPost criado: ${post.id}`);

    if (!ehCarrossel || p.semConferir) {
      imprimirAgenda(p.schedule);
      return;
    }
    const { certo, ordem } = await conferirOrdem(post.id, imagens);
    if (certo) {
      console.log(`Ordem conferida: ${ordem.join(" ")}`);
      imprimirAgenda(p.schedule);
      return;
    }
    console.log(`ORDEM ERRADA (${ordem.join(" ")}). Apagando ${post.id} e criando de novo...`);
    await apiFetch(`/v1/social-posts/${post.id}`, { method: "DELETE" });
    await dormir(PAUSA_REFAZER_S);
  }
  throw new Error(`o carrossel saiu fora de ordem ${TENTATIVAS_ORDEM} vezes. Nada ficou agendado. Tenta de novo mais tarde.`);
}

main().catch((err) => {
  console.error(`\nErro: ${err.message}`);
  process.exit(1);
});
