const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { images: [], video: "", caption: "", dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--images") opts.images = args[++i].split(",").map(s => s.trim());
    else if (args[i] === "--video") opts.video = args[++i];
    else if (args[i] === "--caption") opts.caption = args[++i];
    else if (args[i] === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
const GRAPH = "https://graph.instagram.com/v21.0";

// --- Upload imagem (catbox.moe com fallback pra uguu.se) ---
function uploadFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`Arquivo nao encontrado: ${abs}`);

  // Tenta catbox primeiro
  try {
    const result = execSync(
      `curl -s -F "reqtype=fileupload" -F "fileToUpload=@${abs}" "https://catbox.moe/user/api.php"`,
      { timeout: 60000 }
    ).toString().trim();
    if (result.startsWith("https://")) return result;
  } catch (e) { /* catbox falhou, tenta uguu */ }

  // Fallback: uguu.se
  const result = execSync(
    `curl -s -F "files[]=@${abs}" "https://uguu.se/upload"`,
    { timeout: 60000 }
  ).toString().trim();
  try {
    const json = JSON.parse(result);
    if (json.files && json.files[0] && json.files[0].url) return json.files[0].url;
  } catch (e) { /* parse falhou */ }
  throw new Error(`Upload falhou (catbox + uguu): ${result}`);
}

// --- Criar container de imagem (item de carrossel ou post unico) ---
async function createImageContainer(imageUrl, isCarouselItem = false) {
  const body = new URLSearchParams({
    image_url: imageUrl,
    access_token: TOKEN,
  });
  if (isCarouselItem) body.append("is_carousel_item", "true");
  const res = await fetch(`${GRAPH}/${USER_ID}/media`, { method: "POST", body });
  const json = await res.json();
  if (json.error) throw new Error(`Container: ${json.error.message}`);
  return json.id;
}

// --- Criar container de imagem unica com caption ---
async function createSingleImageContainer(imageUrl, caption) {
  const body = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: TOKEN,
  });
  const res = await fetch(`${GRAPH}/${USER_ID}/media`, { method: "POST", body });
  const json = await res.json();
  if (json.error) throw new Error(`Container: ${json.error.message}`);
  return json.id;
}

// --- Criar container de video (Reels) ---
async function createVideoContainer(videoUrl, caption) {
  const body = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: TOKEN,
  });
  const res = await fetch(`${GRAPH}/${USER_ID}/media`, { method: "POST", body });
  const json = await res.json();
  if (json.error) throw new Error(`Video container: ${json.error.message}`);
  return json.id;
}

// --- Criar container de carrossel ---
async function createCarousel(containerIds, caption) {
  const body = new URLSearchParams({
    media_type: "CAROUSEL",
    children: containerIds.join(","),
    caption,
    access_token: TOKEN,
  });
  const res = await fetch(`${GRAPH}/${USER_ID}/media`, { method: "POST", body });
  const json = await res.json();
  if (json.error) throw new Error(`Carousel: ${json.error.message}`);
  return json.id;
}

// --- Poll status do container ate FINISHED ---
async function pollStatus(containerId, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${TOKEN}`);
    const json = await res.json();
    if (json.status_code === "FINISHED") return;
    if (json.status_code === "ERROR") throw new Error(`Container ${containerId} com erro`);
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error(`Timeout esperando container ${containerId}`);
}

// --- Publicar ---
async function publish(containerId) {
  const body = new URLSearchParams({ creation_id: containerId, access_token: TOKEN });
  const res = await fetch(`${GRAPH}/${USER_ID}/media_publish`, { method: "POST", body });
  const json = await res.json();
  if (json.error) throw new Error(`Publish: ${json.error.message}`);
  return json.id;
}

// --- Permalink ---
async function getPermalink(mediaId) {
  const res = await fetch(`${GRAPH}/${mediaId}?fields=permalink&access_token=${TOKEN}`);
  const json = await res.json();
  return json.permalink || "";
}

// =======================================================================
async function main() {
  const opts = parseArgs();
  if (!TOKEN || !USER_ID) {
    console.error("Faltam variaveis no .env (INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID)");
    process.exit(1);
  }

  const isVideo = !!opts.video;
  const isCarousel = opts.images.length >= 2;
  const isSingleImage = opts.images.length === 1;

  if (!isVideo && !isCarousel && !isSingleImage) {
    console.error("Use --images (1 ou mais imagens) ou --video (um video)");
    process.exit(1);
  }

  if (isCarousel && opts.images.length > 10) {
    console.error("Instagram aceita no maximo 10 imagens por carrossel");
    process.exit(1);
  }

  if (opts.caption.length > 2200) {
    console.error("Legenda max 2200 caracteres");
    process.exit(1);
  }

  // --- VIDEO (Reels) ---
  if (isVideo) {
    console.log(`Fazendo upload do video pro catbox...`);
    const videoUrl = uploadFile(opts.video);
    console.log(`  OK: ${videoUrl}`);

    if (opts.dryRun) {
      console.log(`\nDRY RUN — video pronto mas nao publicado`);
      return;
    }

    console.log(`\nCriando container de video...`);
    const containerId = await createVideoContainer(videoUrl, opts.caption);
    console.log(`  Container: ${containerId}`);

    console.log(`Aguardando processamento (pode levar ate 2 min)...`);
    await pollStatus(containerId, 180000);

    console.log(`Publicando...`);
    const mediaId = await publish(containerId);
    const link = await getPermalink(mediaId);
    console.log(`\nPublicado como Reels!`);
    if (link) console.log(`Link: ${link}`);
    return;
  }

  // --- IMAGEM UNICA ---
  if (isSingleImage) {
    console.log(`Fazendo upload da imagem pro catbox...`);
    const imageUrl = uploadFile(opts.images[0]);
    console.log(`  OK: ${path.basename(opts.images[0])}`);

    if (opts.dryRun) {
      console.log(`\nDRY RUN — imagem pronta mas nao publicada`);
      return;
    }

    console.log(`\nCriando container...`);
    const containerId = await createSingleImageContainer(imageUrl, opts.caption);
    await pollStatus(containerId);

    console.log(`Publicando...`);
    const mediaId = await publish(containerId);
    const link = await getPermalink(mediaId);
    console.log(`\nPublicado!`);
    if (link) console.log(`Link: ${link}`);
    return;
  }

  // --- CARROSSEL (2-10 imagens) ---
  console.log(`Fazendo upload de ${opts.images.length} imagens pro catbox...`);
  const imageUrls = [];
  for (const img of opts.images) {
    const url = uploadFile(img);
    console.log(`  OK: ${path.basename(img)}`);
    imageUrls.push(url);
  }

  if (opts.dryRun) {
    console.log(`\nDRY RUN — ${opts.images.length} imagens prontas mas nao publicadas`);
    return;
  }

  console.log(`\nCriando containers no Instagram...`);
  const containerIds = [];
  for (const url of imageUrls) {
    const id = await createImageContainer(url, true);
    await pollStatus(id);
    console.log(`  OK: ${id}`);
    containerIds.push(id);
  }

  console.log(`\nMontando carrossel...`);
  const carouselId = await createCarousel(containerIds, opts.caption);
  await pollStatus(carouselId);

  console.log(`\nPublicando...`);
  const mediaId = await publish(carouselId);
  const link = await getPermalink(mediaId);
  console.log(`\nPublicado!`);
  if (link) console.log(`Link: ${link}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
