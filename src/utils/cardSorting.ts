import { CollectionCard } from '../types/collection';
import type { FilterParams } from '../components/CollectionFilters';
import type { SimpleCard } from '../components/CardGrid';

interface ParsedCollectorCode {
  priorityGroup: number;
  editionCode: string;
  number: number;
  suffix: string;
}

export interface SortableCard {
  collectorCode: string;
  categorySortOrder?: number;
}

const parseCollectorCode = (code: string): ParsedCollectorCode => {
  const original = (code || '').toUpperCase().trim();
  const cleaned = original.replace(/\s+[A-Z]+\s*$/, '').trim();
  const startsWithNumber = /^\d/.test(cleaned);

  const dashIndex = cleaned.indexOf('-');
  const editionCode = dashIndex >= 0 ? cleaned.slice(0, dashIndex).trim() : cleaned.replace(/\d.*$/, '').trim();
  const remainder = dashIndex >= 0 ? cleaned.slice(dashIndex + 1).trim() : cleaned;
  const cardNumberText = remainder.split('/')[0].trim();
  const cardNumberMatch = cardNumberText.match(/^\d+/);
  const number = cardNumberMatch ? Number(cardNumberMatch[0]) : Number.MAX_SAFE_INTEGER;
  const suffix = remainder.split('/')[1]?.trim() ?? '';

  return {
    priorityGroup: startsWithNumber ? 0 : 1,
    editionCode,
    number,
    suffix,
  };
};

export const compareByCollectorCode = (a: SortableCard, b: SortableCard): number => {
  const aParsed = parseCollectorCode(a.collectorCode);
  const bParsed = parseCollectorCode(b.collectorCode);

  if (aParsed.priorityGroup !== bParsed.priorityGroup) {
    return aParsed.priorityGroup - bParsed.priorityGroup;
  }

  const editionComparison = aParsed.editionCode.localeCompare(bParsed.editionCode, 'es', { sensitivity: 'base' });
  if (editionComparison !== 0) {
    return editionComparison;
  }

  if (aParsed.number !== bParsed.number) {
    return aParsed.number - bParsed.number;
  }

  if (aParsed.suffix !== bParsed.suffix) {
    return aParsed.suffix.localeCompare(bParsed.suffix, 'es', { sensitivity: 'base' });
  }

  return a.collectorCode.localeCompare(b.collectorCode, 'es', { sensitivity: 'base' });
};

export function compareCardsForDisplay(a: SortableCard, b: SortableCard, sortByCategoryOrder: boolean): number {
  if (sortByCategoryOrder) {
    const aOrder = a.categorySortOrder ?? Number.NEGATIVE_INFINITY;
    const bOrder = b.categorySortOrder ?? Number.NEGATIVE_INFINITY;
    if (aOrder !== bOrder) return bOrder - aOrder;
  }
  return compareByCollectorCode(a, b);
}

export function sortSimpleCards<T extends SortableCard>(cards: T[], sortByCategoryOrder = false): T[] {
  return [...cards].sort((a, b) => compareCardsForDisplay(a, b, sortByCategoryOrder));
}

export function toSimpleCard(card: CollectionCard): SimpleCard {
  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    imageUrl: card.imageUrl,
    collectorCode: card.collectorCode,
    type: card.type,
    cost: card.cost,
    attack: card.attack,
    effect: card.effect,
    flavor: card.flavor,
    artist: card.artist,
    productName: card.product?.productName ?? card.edition?.name,
    categorySortOrder: card.cardCategory?.sortOrder ?? card.product?.sortOrder,
  };
}

export function hasActiveCatalogFilters(params: FilterParams): boolean {
  return Boolean(
    params.edition ||
    params.product ||
    params.q ||
    params.type ||
    params.race ||
    params.freq ||
    (params.oro && params.oro !== 'all'),
  );
}

export function hasActiveFolderFilters(params: FilterParams): boolean {
  return hasActiveCatalogFilters(params) ||
    Boolean(params.ownedOnly) ||
    Boolean(params.notOwnedOnly) ||
    Boolean(params.favoritesOnly) ||
    Boolean(params.wishlistOnly);
}
