// Upload downloaded images to a BunnyCDN Storage Zone and build the
// original-URL -> bunny-URL map used to rewrite the catalog.
//
// Requires (env or scripts/.env):
//   BUNNY_STORAGE_ZONE   storage zone name
//   BUNNY_STORAGE_KEY    storage zone password (Storage API access key)
//   BUNNY_STORAGE_HOST   storage endpoint host (default: storage.bunnycdn.com)
//   BUNNY_PULLZONE_HOST  public pull-zone host, e.g. myl-cards.b-cdn.net
//
// Usage:
//   node scripts/upload-bunny.mjs [pb] [--concurrency=8] [--force]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  readJson,
  writeJson,
  exists,
  loadEnv,
  contentTypeFor,
  fetchRetry,
  pool,
  positional,
  getArg,
  hasFlag,
  IMAGES_DIR,
  DATA_DIR,
} from './lib/io.mjs';

function requireEnv(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (!v) {
    console.error(`Falta la variable de entorno ${name} (defínela en scripts/.env).`);
    process.exit(1);
  }
  return v;
}

async function main() {
  await loadEnv();
  const format = positional(0, process.env.FORMAT ?? 'pb');
  const concurrency = Number(getArg('--concurrency', '8')) || 8;
  const force = hasFlag('--force');

  const zone = requireEnv('BUNNY_STORAGE_ZONE');
  const key = requireEnv('BUNNY_STORAGE_KEY');
  const storageHost = requireEnv('BUNNY_STORAGE_HOST', 'storage.bunnycdn.com');
  const pullHost = requireEnv('BUNNY_PULLZONE_HOST').replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const manifestPath = path.join(DATA_DIR, `image-manifest-${format}.json`);
  if (!(await exists(manifestPath))) {
    console.error(`No existe el manifiesto ${manifestPath}. Corre download-images.mjs primero.`);
    process.exit(1);
  }
  const manifest = await readJson(manifestPath);
  let entries = manifest.entries.filter((e) => e.status === 'ok');

  const limit = Number(getArg('--limit', '0')) || 0;
  if (limit > 0) {
    entries = entries.slice(0, limit);
    console.log(`(modo prueba: solo ${entries.length} imagenes)`);
  }

  const mapPath = path.join(DATA_DIR, `image-map-${format}.json`);
  const imageMap = (await exists(mapPath)) ? await readJson(mapPath) : {};

  console.log(`Formato:    ${format}`);
  console.log(`Storage:    ${storageHost}/${zone}`);
  console.log(`Pull zone:  https://${pullHost}`);
  console.log(`A subir:    ${entries.length}`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  await pool(
    entries,
    async (entry) => {
      const bunnyUrl = `https://${pullHost}/${entry.key}`;
      if (!force && imageMap[entry.url] === bunnyUrl) {
        skipped++;
        return;
      }
      const filePath = path.join(IMAGES_DIR, entry.key);
      try {
        const body = await readFile(filePath);
        const target = `https://${storageHost}/${zone}/${encodeURI(entry.key)}`;
        const res = await fetchRetry(
          target,
          {
            method: 'PUT',
            headers: {
              AccessKey: key,
              'Content-Type': contentTypeFor(entry.ext),
            },
            body,
          },
          { retries: 4, backoffMs: 1000 },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        imageMap[entry.url] = bunnyUrl;
        uploaded++;
      } catch (err) {
        failed++;
        failures.push({ url: entry.url, error: err instanceof Error ? err.message : String(err) });
      }
    },
    concurrency,
  );

  await writeJson(mapPath, imageMap);

  console.log('\n--- Subida completa ---');
  console.log(`Subidas:    ${uploaded}`);
  console.log(`Ya estaban: ${skipped}`);
  console.log(`Fallidas:   ${failed}`);
  console.log(`Mapa URLs:  ${mapPath}`);
  if (failed) {
    console.log('\nReintenta corriendo de nuevo (resume automatico). Primeras fallas:');
    for (const f of failures.slice(0, 20)) console.log(`  FAIL ${f.error}  ${f.url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
