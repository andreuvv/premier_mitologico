// Shared helpers for the card tooling scripts (Node >=20, zero dependencies).
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = path.resolve(HERE, '..');
export const APP_DIR = path.resolve(SCRIPTS_DIR, '..');
export const DATA_DIR = path.join(SCRIPTS_DIR, 'data');
export const IMAGES_DIR = path.join(SCRIPTS_DIR, 'images');

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function localCardsPath(format) {
  return path.join(APP_DIR, 'public', 'assets', 'json', `cartas_${format}.json`);
}

// Default API export locations (per format). Override with API_JSON env / argv.
const DEFAULT_API = {
  pb: 'C:/Users/veanv/Desktop/api.mazos.cl_cartas_pb.json',
};
export function defaultApiPath(format) {
  return DEFAULT_API[format] ?? null;
}

export async function readJson(file) {
  const raw = await readFile(file, 'utf8');
  return JSON.parse(raw);
}

export async function writeJson(file, value, { pretty = true } = {}) {
  await mkdir(path.dirname(file), { recursive: true });
  const text = pretty ? JSON.stringify(value, null, 2) + '\n' : JSON.stringify(value);
  await writeFile(file, text, 'utf8');
}

export async function exists(file) {
  try {
    await access(file, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

// Minimal .env loader (KEY=VALUE per line). Does not overwrite existing env vars.
export async function loadEnv() {
  const file = path.join(SCRIPTS_DIR, '.env');
  if (!(await exists(file))) return;
  const raw = await readFile(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

// Simple bounded-concurrency runner that preserves result order.
export async function pool(items, worker, concurrency = 8) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function fetchRetry(url, options = {}, { retries = 3, backoffMs = 800 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Retry only on transient server errors / rate limiting.
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(backoffMs * (attempt + 1));
    }
  }
  throw lastError;
}

const CDN_HOST = 'cdn.mazos.cl';
const DEFAULT_OUR_CDN_HOST = 'mitoxicos.b-cdn.net';
const IMG_EXT = /\.(png|webp|jpe?g|gif|avif)(?:-(\d+))?$/i;

export function ourCdnHosts() {
  const hosts = new Set([DEFAULT_OUR_CDN_HOST]);
  const pull = process.env.BUNNY_PULLZONE_HOST;
  if (pull) {
    hosts.add(pull.replace(/^https?:\/\//, '').replace(/\/+$/, '').split('/')[0]);
  }
  return hosts;
}

export function isOurCdnUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    return ourCdnHosts().has(new URL(rawUrl).hostname);
  } catch {
    return false;
  }
}

// Replace characters that are illegal in Windows file names or structural in
// URLs (?, #). Path separators are preserved; accented/unicode chars are kept.
function sanitizeKey(key) {
  return key
    .split('/')
    // eslint-disable-next-line no-control-regex
    .map((seg) => seg.replace(/[<>:"|?*#\u0000-\u001f]/g, '_'))
    .join('/');
}

export function contentTypeFor(ext) {
  const e = ext.toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'gif') return 'image/gif';
  if (e === 'avif') return 'image/avif';
  return 'application/octet-stream';
}

// Parse any external image URL into a storage key. Returns null for empty URLs
// or images already hosted on our Bunny pull zone.
export function parseImageUrlForMigration(rawUrl) {
  const mazos = parseCdnImageUrl(rawUrl);
  if (mazos) return mazos;
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (isOurCdnUrl(rawUrl)) return null;

  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  const pathname = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  const match = pathname.match(IMG_EXT);
  const ext = match ? match[1].toLowerCase() : '';
  const timestamp = match?.[2] ?? null;
  const cleanKey = sanitizeKey(`FURIA_EXTENDIDO/migrated/${u.hostname}/${pathname}`);
  return {
    url: rawUrl,
    rawPath: pathname,
    ext,
    timestamp,
    cleanKey,
  };
}

// Parse a cdn.mazos.cl image URL into a clean storage key (path preserved, the
// trailing "-<timestamp>" stripped so the file keeps a real extension).
// Returns null when the URL is empty or not hosted on cdn.mazos.cl.
export function parseCdnImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (u.hostname !== CDN_HOST) return null;

  const pathname = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  const match = pathname.match(IMG_EXT);
  if (!match) {
    // Unknown/unsupported extension: keep path as-is, no normalization.
    return { url: rawUrl, rawPath: pathname, ext: '', timestamp: null, cleanKey: sanitizeKey(pathname) };
  }
  const ext = match[1].toLowerCase();
  const timestamp = match[2] ?? null;
  const base = pathname.slice(0, match.index);
  return {
    url: rawUrl,
    rawPath: pathname,
    ext,
    timestamp,
    cleanKey: sanitizeKey(`${base}.${ext}`),
  };
}

// Assign collision-free storage keys for a list of external image URLs.
// Two different URLs that normalize to the same clean key get the timestamp
// re-inserted before the extension to stay unique.
export function assignStorageKeys(urls) {
  const used = new Map(); // cleanKey -> url that claimed it
  const map = new Map(); // url -> { key, ext, timestamp }
  for (const url of urls) {
    const parsed = parseImageUrlForMigration(url);
    if (!parsed) continue;
    let key = parsed.cleanKey;
    if (used.has(key) && used.get(key) !== url) {
      const base = parsed.ext ? key.slice(0, -(parsed.ext.length + 1)) : key;
      const stamp = parsed.timestamp ?? Math.abs(hashString(url)).toString(36);
      key = parsed.ext ? `${base}-${stamp}.${parsed.ext}` : `${base}-${stamp}`;
    }
    used.set(key, url);
    map.set(url, { key, ext: parsed.ext, timestamp: parsed.timestamp });
  }
  return map;
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export function hasFlag(name) {
  return process.argv.includes(name);
}

export function getArg(name, fallback) {
  const prefix = `${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

// First positional arg that isn't a flag (used for the format: pb/fx/pe).
export function positional(index, fallback) {
  const positionals = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  return positionals[index] ?? fallback;
}
