// Rewrite imageUrl in the local cartas_<format>.json using the bunny image map
// produced by upload-bunny.mjs.
//
// Usage:
//   node scripts/rewrite-image-urls.mjs [pb] [--dry]
//
// --dry writes to cartas_<format>.preview.json instead of overwriting.
import path from 'node:path';
import {
  readJson,
  writeJson,
  exists,
  isOurCdnUrl,
  localCardsPath,
  positional,
  hasFlag,
  DATA_DIR,
} from './lib/io.mjs';

async function main() {
  const format = positional(0, process.env.FORMAT ?? 'pb');
  const dry = hasFlag('--dry');

  const mapPath = path.join(DATA_DIR, `image-map-${format}.json`);
  if (!(await exists(mapPath))) {
    console.error(`No existe ${mapPath}. Corre upload-bunny.mjs primero.`);
    process.exit(1);
  }
  const imageMap = await readJson(mapPath);

  const localPath = localCardsPath(format);
  const local = await readJson(localPath);
  const cards = local.data.CardCatalog.cards;

  let replaced = 0;
  let alreadyMigrated = 0;
  const unmapped = [];

  for (const card of cards) {
    const url = card.imageUrl;
    if (!url) continue;
    if (imageMap[url]) {
      card.imageUrl = imageMap[url];
      replaced++;
    } else if (!isOurCdnUrl(url)) {
      unmapped.push({ id: card.id, name: card.name, url });
    } else {
      alreadyMigrated++;
    }
  }

  const outPath = dry
    ? path.join(path.dirname(localPath), `cartas_${format}.preview.json`)
    : localPath;
  await writeJson(outPath, local);

  console.log('--- Reescritura de imageUrl ---');
  console.log(`Reemplazadas:        ${replaced}`);
  console.log(`Ya migradas/no-CDN:  ${alreadyMigrated}`);
  console.log(`Sin mapeo (CDN):     ${unmapped.length}`);
  console.log(`Escrito en:          ${outPath}${dry ? ' (modo --dry)' : ''}`);
  if (unmapped.length) {
    console.log('\nCartas con imagen externa sin mapear (subelas a Bunny y reintenta):');
    for (const u of unmapped.slice(0, 30)) console.log(`  #${u.id} ${u.name} -> ${u.url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
