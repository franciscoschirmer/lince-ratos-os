#!/usr/bin/env node
/**
 * theme.mjs — transforma o brand.yaml da marca em theme.css (CSS vars) + marca.json.
 * Uso: node theme.mjs [brand.yaml] [assets/theme.css]
 * Default: ./brand.yaml -> ./assets/theme.css (+ ./assets/marca.json)
 *
 * Nenhum layout conhece a marca. Tudo passa por aqui.
 */
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve(process.argv[2] || 'brand.yaml');
const out = path.resolve(process.argv[3] || 'assets/theme.css');

if (!fs.existsSync(src)) {
  console.error(`nao achei ${src}. rode o setup da skill (Fase 0) antes.`);
  process.exit(1);
}

/* ---------- parser YAML minimo: key: value + 1 nivel de indentacao + listas ---------- */
function parseYaml(text) {
  const root = {};
  let ctx = root;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    if (indent === 0) ctx = root;
    if (line.startsWith('- ')) {
      const holder = ctx.__list;
      if (holder) holder.push(clean(line.slice(2)));
      continue;
    }
    const m = line.match(/^([\w.-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, rest] = m;
    const target = indent === 0 ? root : ctx;
    if (rest === '') {
      const child = {};
      target[key] = child;
      if (indent === 0) ctx = child;
      child.__list = [];
      Object.defineProperty(child, '__list', { enumerable: false, value: child.__list });
    } else {
      target[key] = clean(rest);
    }
  }
  return root;
}
function clean(v) {
  let s = v.trim();
  const q = s.match(/^(["'])([\s\S]*?)\1\s*(?:#.*)?$/);   // valor entre aspas (+ comentario opcional)
  if (q) return coerce(q[2]);
  s = s.replace(/\s+#.*$/, '').trim();                      // comentario no fim da linha
  return coerce(s);
}
function coerce(s) {
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s;
}

const b = parseYaml(fs.readFileSync(src, 'utf8'));
const cores = b.cores || {};
const fontes = b.fontes || {};
const forma = b.forma || {};
const logo = b.logo || {};

/* ---------- defaults seguros ---------- */
const C = {
  dark: cores.dark || '#111111',
  dark_fg: cores.dark_fg || '#FFFFFF',
  dark_muted: cores.dark_muted || 'rgba(255,255,255,.66)',
  light: cores.light || '#FFFFFF',
  light_fg: cores.light_fg || '#111111',
  light_muted: cores.light_muted || 'rgba(0,0,0,.58)',
  accent: cores.accent || '#111111',
  accent_dark: cores.accent_dark || cores.accent || '#FFFFFF',
  accent_fg: cores.accent_fg || '#FFFFFF',
  // texto que vai EM CIMA do accent_dark (a versao clareada). Sem isso, marca com accent
  // claro no tema escuro fica com texto branco sobre fundo claro = ilegivel.
  accent_dark_fg: cores.accent_dark_fg || cores.accent_fg || '#FFFFFF',
};

/* ---------- Google Fonts ---------- */
function fam(name, weights, italic) {
  const f = String(name).trim().replace(/\s+/g, '+');
  const list = String(weights || '400;700').split(';').map(s => s.trim()).filter(Boolean);
  const axis = italic
    ? `ital,wght@${[...list.map(w => `0,${w}`), ...list.map(w => `1,${w}`)].join(';')}`
    : `wght@${list.join(';')}`;
  return `family=${f}:${axis}`;
}
const displayName = fontes.display || 'Instrument Serif';
const bodyName = fontes.body || 'Inter';
const stackDisplay = (fontes.display_tipo || 'serif') === 'sans' ? 'sans-serif' : 'serif';
const families = [
  fam(displayName, fontes.display_weights || '400', fontes.italic !== false),
  fam(bodyName, fontes.body_weights || '400;500;700;800', false),
];
const fontsUrl = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
const local = fontes.local === true; // marca com fonte proprietaria: nao importa do Google

const css = `/* theme.css — GERADO por theme.mjs a partir de ${path.basename(src)}. Nao editar na mao. */
${local ? `/* fontes locais: declare os @font-face em assets/fontes.css e linke antes deste arquivo */` : `@import url('${fontsUrl}');`}

:root{
  --c-dark:${C.dark};
  --c-dark-fg:${C.dark_fg};
  --c-dark-muted:${C.dark_muted};
  --c-light:${C.light};
  --c-light-fg:${C.light_fg};
  --c-light-muted:${C.light_muted};
  --c-accent:${C.accent};
  --c-accent-dark:${C.accent_dark};
  --c-accent-fg:${C.accent_fg};
  --c-accent-dark-fg:${C.accent_dark_fg};

  --font-display:'${displayName}',${stackDisplay};
  --font-body:'${bodyName}',system-ui,sans-serif;
  --display-weight:${fontes.display_peso || '400'};

  --radius:${forma.radius || '20px'};
  --cta-radius:${forma.cta_radius || '14px'};
  --badge-radius:${forma.badge === 'reto' ? '4px' : '999px'};
}
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, css);

const meta = {
  marca: b.marca || '',
  handle: b.handle || '',
  site: b.site || '',
  logo: logo.arquivo || '',
  logo_invertido: logo.arquivo_claro || '',
  tom: b.tom || {},
  fontes: { display: displayName, body: bodyName },
};
fs.writeFileSync(path.join(path.dirname(out), 'marca.json'), JSON.stringify(meta, null, 2));

console.log(`theme.css gerado: ${out}`);
console.log(`  marca   ${meta.marca || '(sem nome)'}`);
console.log(`  accent  ${C.accent} (no dark: ${C.accent_dark})`);
console.log(`  fontes  ${displayName} + ${bodyName}${local ? ' (locais)' : ''}`);
