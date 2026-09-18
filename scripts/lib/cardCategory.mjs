import path from 'node:path';
import { readJson, writeJson, exists, SCRIPTS_DIR } from './io.mjs';

export const TEAMS_CATEGORY_ID = 0;
export const TEAMS_CATEGORY_NAME = 'Oros Iniciales Teams';

export async function loadCategorySortOrderMap(format) {
  const file = path.join(SCRIPTS_DIR, `card-category-sortorders-${format}.json`);
  if (!(await exists(file))) return new Map();
  const data = await readJson(file);
  const raw = data.categorySortOrderById ?? data;
  return new Map(Object.entries(raw).map(([id, sortOrder]) => [Number(id), sortOrder]));
}

export async function saveCategorySortOrderMap(format, byCategoryId) {
  const file = path.join(SCRIPTS_DIR, `card-category-sortorders-${format}.json`);
  const categorySortOrderById = Object.fromEntries(
    [...byCategoryId.entries()].sort((a, b) => a[0] - b[0]),
  );
  await writeJson(file, { categorySortOrderById });
}

/** Seed registry from curated map + any non-zero sortOrder already on local cards. */
export function createSortOrderRegistry(localCards, curatedById = new Map()) {
  const byCategoryId = new Map(curatedById);
  let max = 0;
  for (const sortOrder of byCategoryId.values()) {
    if (typeof sortOrder === 'number') max = Math.max(max, sortOrder);
  }
  for (const card of localCards) {
    const cc = card.cardCategory;
    if (!cc || cc.id === undefined || cc.id === null) continue;
    if (cc.id === TEAMS_CATEGORY_ID || cc.name === TEAMS_CATEGORY_NAME) {
      byCategoryId.set(cc.id, 0);
      continue;
    }
    if (typeof cc.sortOrder === 'number' && cc.sortOrder > 0) {
      byCategoryId.set(cc.id, cc.sortOrder);
      max = Math.max(max, cc.sortOrder);
    }
  }
  return { byCategoryId, nextNew: max + 1, assignedNew: 0 };
}

export function resolveCardCategory(cardCategory, registry) {
  if (!cardCategory) return null;

  const id = cardCategory.id;
  const name = cardCategory.name ?? '';

  if (id === TEAMS_CATEGORY_ID || name === TEAMS_CATEGORY_NAME) {
    registry.byCategoryId.set(id, 0);
    return { id, name, sortOrder: 0, __typename: 'CardCategory' };
  }

  let sortOrder;
  if (
    typeof cardCategory.sortOrder === 'number' &&
    (cardCategory.sortOrder > 0 || id === TEAMS_CATEGORY_ID)
  ) {
    sortOrder = cardCategory.sortOrder;
  } else if (registry.byCategoryId.has(id)) {
    sortOrder = registry.byCategoryId.get(id);
  } else {
    sortOrder = registry.nextNew;
    registry.nextNew += 1;
    registry.assignedNew += 1;
    registry.byCategoryId.set(id, sortOrder);
  }

  return { id, name, sortOrder, __typename: 'CardCategory' };
}
