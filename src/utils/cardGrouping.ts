import { CollectionCard } from '../types/collection';

export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')
    .toLowerCase()
    .trim();
}

export function cardKey(name: string, type: string): string {
  return `${normalizeName(name)}|${type.toUpperCase().trim()}`;
}

export function groupKey(name: string, type: string): string {
  return cardKey(name, type);
}

export function isReworkCard(card: CollectionCard): boolean {
  return card.isRework === true || card.isReworked === true;
}

export function isNewestCard(card: CollectionCard): boolean {
  return card.isNewest === true;
}

export function isOldVersionCard(card: CollectionCard): boolean {
  return !isReworkCard(card);
}

export function isReworkVersionCard(card: CollectionCard): boolean {
  return isReworkCard(card);
}

export function sortVersionsByIdDesc(cards: CollectionCard[]): CollectionCard[] {
  return [...cards].sort((a, b) => b.id - a.id);
}

/** Rework versions: isNewest first, then most recent id. */
export function sortReworkVersions(cards: CollectionCard[]): CollectionCard[] {
  return [...cards].sort((a, b) => {
    const aNewest = isNewestCard(a) ? 1 : 0;
    const bNewest = isNewestCard(b) ? 1 : 0;
    if (bNewest !== aNewest) return bNewest - aNewest;
    return b.id - a.id;
  });
}
