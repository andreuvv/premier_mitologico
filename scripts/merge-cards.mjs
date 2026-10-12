// Merge the mazos.cl API export into the local cartas_<format>.json.
//
// - Matches cards by `id`.
// - Existing cards: only sync `cardCategory` from the API (null when absent).
//   All other local fields (including imageUrl on BunnyCDN) are preserved.
// - New cards (id only in the API): built into the local schema, resolving
//   edition/game from the curated local maps by slug.
//
// Usage:
//   node scripts/merge-cards.mjs [pb] [--dry] [API_JSON=path]
//   node scripts/merge-cards.mjs pb API_JSON="C:/Users/veanv/Desktop/api.mazos.cl_cartas_pb.json"
//
// --dry writes to cartas_<format>.preview.json instead of overwriting.
import path from 'node:path';
import {
  readJson,
  writeJson,
  localCardsPath,
  defaultApiPath,
  positional,
  getArg,
  hasFlag,
} from './lib/io.mjs';
import {
  loadCategorySortOrderMap,
  saveCategorySortOrderMap,
  createSortOrderRegistry,
  resolveCardCategory,
} from './lib/cardCategory.mjs';

function cleanEdition(edition) {
  if (!edition) return { name: '', slug: '', __typename: 'Edition' };
  return { name: edition.name ?? '', slug: edition.slug ?? '', __typename: 'Edition' };
}

function editionIdentity(name) {
  return String(name ?? '')
    .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanGame(game) {
  if (!game) return { name: '', slug: '', __typename: 'Game' };
  return { name: game.name ?? '', slug: game.slug ?? '', __typename: 'Game' };
}

function buildLocalCard(apiCard, resolveEdition, gameBySlug, sortOrderRegistry) {
  const edition = resolveEdition(apiCard.edition);
  const game = gameBySlug.get(apiCard.game?.slug) ?? cleanGame(apiCard.game);

  const card = {
    id: apiCard.id,
    slug: apiCard.slug,
    name: apiCard.name,
    gameId: apiCard.gameId ?? 1,
    collectorCode: apiCard.collectorCode ?? '',
    effect: apiCard.effect ?? '',
    flavor: apiCard.flavor ?? '',
    type: apiCard.type,
    cost: apiCard.cost ?? 0,
    attack: apiCard.attack ?? 0,
    imageUrl: apiCard.imageUrl ?? '',
    artist: apiCard.artist ?? '',
    frequency: apiCard.frequency ?? '',
  };
  if (apiCard.isUnique === true) card.unique = true;
  card.race = Array.isArray(apiCard.race) ? apiCard.race : [];
  card.edition = edition;
  card.game = game;
  card.cardCategory = resolveCardCategory(apiCard.cardCategory, sortOrderRegistry);
  card.__typename = 'Card';
  return card;
}

async function main() {
  const format = positional(0, process.env.FORMAT ?? 'pb');
  const dry = hasFlag('--dry');
  const apiPath = getArg('API_JSON', process.env.API_JSON ?? defaultApiPath(format));

  if (!apiPath) {
    console.error(
      `No hay ruta de API para el formato "${format}". Pasa API_JSON=ruta/al/api.json`,
    );
    process.exit(1);
  }

  const localPath = localCardsPath(format);
  console.log(`Formato:   ${format}`);
  console.log(`Local:     ${localPath}`);
  console.log(`API:       ${apiPath}`);

  const local = await readJson(localPath);
  const api = await readJson(apiPath);

  const localCards = local.data.CardCatalog.cards;
  const apiCards = api.data.CardCatalog.cards;

  const apiById = new Map(apiCards.map((c) => [c.id, c]));
  const localIds = new Set(localCards.map((c) => c.id));

  // Curated edition/game lookups. Same edition name with a different emoji
  // collapses onto the most common local label (and its slug).
  const editionBySlug = new Map();
  const editionVariantCounts = new Map();
  const gameBySlug = new Map();
  for (const c of localCards) {
    if (c.edition?.slug && !editionBySlug.has(c.edition.slug)) editionBySlug.set(c.edition.slug, c.edition);
    const editionKey = editionIdentity(c.edition?.name);
    if (c.edition?.slug && editionKey) {
      const variants = editionVariantCounts.get(editionKey) ?? new Map();
      const sig = `${c.edition.slug}\0${c.edition.name}`;
      const row = variants.get(sig) ?? { edition: c.edition, count: 0 };
      row.count += 1;
      variants.set(sig, row);
      editionVariantCounts.set(editionKey, variants);
    }
    if (c.game?.slug && !gameBySlug.has(c.game.slug)) gameBySlug.set(c.game.slug, c.game);
  }
  const editionByIdentity = new Map();
  for (const [key, variants] of editionVariantCounts) {
    let best = null;
    for (const row of variants.values()) {
      if (!best || row.count > best.count) best = row;
    }
    if (best) editionByIdentity.set(key, best.edition);
  }

  const unknownEditionSlugs = new Set();
  const resolveEdition = (apiEdition) => {
    if (apiEdition?.slug && editionBySlug.has(apiEdition.slug)) {
      return editionBySlug.get(apiEdition.slug);
    }
    const byName = editionByIdentity.get(editionIdentity(apiEdition?.name));
    if (byName) return byName;
    if (apiEdition?.slug) unknownEditionSlugs.add(apiEdition.slug);
    return cleanEdition(apiEdition);
  };

  const curatedSortOrders = await loadCategorySortOrderMap(format);
  const sortOrderRegistry = createSortOrderRegistry(localCards, curatedSortOrders);

  // Sync cardCategory on existing cards (preserves key order -> minimal diff).
  let categorySynced = 0;
  let categoryNull = 0;
  let missingInApi = 0;
  for (const card of localCards) {
    const apiCard = apiById.get(card.id);
    if (!apiCard) {
      missingInApi++;
      continue;
    }
    card.cardCategory = resolveCardCategory(apiCard.cardCategory, sortOrderRegistry);
    categorySynced++;
    if (card.cardCategory === null) categoryNull++;
  }

  // Build new cards (present in API, missing locally).
  const newCards = [];
  for (const apiCard of apiCards) {
    if (localIds.has(apiCard.id)) continue;
    newCards.push(buildLocalCard(apiCard, resolveEdition, gameBySlug, sortOrderRegistry));
  }
  newCards.sort((a, b) => b.id - a.id);

  // Prepend new cards (newest ids first) and keep existing order.
  local.data.CardCatalog.cards = [...newCards, ...localCards];
  local.data.CardCatalog.total = local.data.CardCatalog.cards.length;

  if (sortOrderRegistry.assignedNew > 0) {
    await saveCategorySortOrderMap(format, sortOrderRegistry.byCategoryId);
  }

  const outPath = dry
    ? path.join(path.dirname(localPath), `cartas_${format}.preview.json`)
    : localPath;
  await writeJson(outPath, local);

  console.log('\n--- Resumen del merge ---');
  console.log(`Cartas locales previas:   ${localIds.size}`);
  console.log(`Cartas en API:            ${apiCards.length}`);
  console.log(`cardCategory sincronizado: ${categorySynced}`);
  console.log(`cardCategory null:         ${categoryNull}`);
  console.log(`sortOrder nuevos:          ${sortOrderRegistry.assignedNew}`);
  console.log(`Nuevas agregadas:          ${newCards.length}`);
  console.log(`Total final:               ${local.data.CardCatalog.total}`);
  console.log(`Locales sin match en API:  ${missingInApi}`);
  if (unknownEditionSlugs.size) {
    console.log(
      `Ediciones nuevas (slug sin curar localmente): ${[...unknownEditionSlugs].join(', ')}`,
    );
  }
  console.log(`\nEscrito en: ${outPath}${dry ? ' (modo --dry)' : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
