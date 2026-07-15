// Download every cdn.mazos.cl image referenced by the (merged) local
// cartas_<format>.json into scripts/images/, preserving the CDN path and
// normalizing the "-<timestamp>" suffix into a real file extension.
//
// Produces scripts/data/image-manifest-<format>.json so the upload step knows
// what to push. Re-running resumes (already-downloaded files are skipped).
//
// Usage:
//   node scripts/download-images.mjs [pb] [--concurrency=8] [--force]
import { writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  readJson,
  writeJson,
  exists,
  ensureDir,
  localCardsPath,
  assignStorageKeys,
  isOurCdnUrl,
  fetchRetry,
  pool,
  positional,
  getArg,
  hasFlag,
  IMAGES_DIR,
  DATA_DIR,
} from './lib/io.mjs';

async function main() {
  const format = positional(0, process.env.FORMAT ?? 'pb');
  const concurrency = Number(getArg('--concurrency', '8')) || 8;
  const force = hasFlag('--force');

  const localPath = localCardsPath(format);
  const local = await readJson(localPath);
  const cards = local.data.CardCatalog.cards;

  // Unique image URLs not already on our Bunny pull zone.
  const urls = [...new Set(cards.map((c) => c.imageUrl).filter(Boolean))];
  const externalUrls = urls.filter((url) => !isOurCdnUrl(url));
  const keyMap = assignStorageKeys(externalUrls);

  const entries = [];
  for (const [url, info] of keyMap.entries()) {
    entries.push({ url, key: info.key, ext: info.ext, status: 'pending', bytes: 0, error: null });
  }

  const alreadyMigrated = urls.length - externalUrls.length;
  const skippedParse = externalUrls.length - keyMap.size;
  console.log(`Formato:        ${format}`);
  console.log(`URLs unicas:    ${urls.length}`);
  console.log(`Ya en nuestro CDN: ${alreadyMigrated}`);
  console.log(`A migrar:       ${keyMap.size}`);
  console.log(`Sin parsear:    ${skippedParse}`);
  console.log(`Destino:        ${IMAGES_DIR}`);

  await ensureDir(IMAGES_DIR);
  await ensureDir(DATA_DIR);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  await pool(
    entries,
    async (entry) => {
      const dest = path.join(IMAGES_DIR, entry.key);
      if (!force && (await exists(dest))) {
        const s = await stat(dest);
        if (s.size > 0) {
          entry.status = 'ok';
          entry.bytes = s.size;
          skipped++;
          return;
        }
      }
      try {
        const res = await fetchRetry(entry.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 myl-card-tooling' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, buf);
        entry.status = 'ok';
        entry.bytes = buf.length;
        ok++;
      } catch (err) {
        entry.status = 'failed';
        entry.error = err instanceof Error ? err.message : String(err);
        failed++;
      }
    },
    concurrency,
  );

  const manifestPath = path.join(DATA_DIR, `image-manifest-${format}.json`);
  await writeJson(manifestPath, { format, generatedAt: new Date().toISOString(), entries });

  console.log('\n--- Descarga completa ---');
  console.log(`Descargadas: ${ok}`);
  console.log(`Ya existian: ${skipped}`);
  console.log(`Fallidas:    ${failed}`);
  console.log(`Manifiesto:  ${manifestPath}`);
  if (failed) {
    console.log('\nReintenta las fallidas volviendo a correr el script (resume automatico).');
    for (const e of entries.filter((e) => e.status === 'failed').slice(0, 20)) {
      console.log(`  FAIL ${e.error}  ${e.url}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
