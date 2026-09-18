// Re-apply cardCategory.sortOrder on cartas_<format>.json using the curated map.
// Use after a merge that zeroed sortOrder because the export omits that field.
//
// Usage: node scripts/restore-card-category-sortorder.mjs [pb]
import {
  readJson,
  writeJson,
  localCardsPath,
  positional,
} from './lib/io.mjs';
import {
  loadCategorySortOrderMap,
  createSortOrderRegistry,
  resolveCardCategory,
  saveCategorySortOrderMap,
} from './lib/cardCategory.mjs';

async function main() {
  const format = positional(0, process.env.FORMAT ?? 'pb');
  const localPath = localCardsPath(format);
  const local = await readJson(localPath);
  const cards = local.data.CardCatalog.cards;

  const curated = await loadCategorySortOrderMap(format);
  const registry = createSortOrderRegistry(cards, curated);

  let updated = 0;
  for (const card of cards) {
    if (!card.cardCategory) continue;
    const next = resolveCardCategory(card.cardCategory, registry);
    if (next.sortOrder !== card.cardCategory.sortOrder) updated++;
    card.cardCategory = next;
  }

  await saveCategorySortOrderMap(format, registry.byCategoryId);
  await writeJson(localPath, local);

  const zeros = cards.filter((c) => c.cardCategory?.sortOrder === 0).map((c) => c.cardCategory.name);
  console.log(`Formato: ${format}`);
  console.log(`Cartas actualizadas: ${updated}`);
  console.log(`sortOrder 0: ${[...new Set(zeros)].join(', ') || '(ninguno)'}`);
  console.log(`max sortOrder: ${Math.max(...cards.filter((c) => c.cardCategory).map((c) => c.cardCategory.sortOrder))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
