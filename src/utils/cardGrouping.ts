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

export function sortVersionsByIdDesc(cards: CollectionCard[]): CollectionCard[] {
  return [...cards].sort((a, b) => b.id - a.id);
}
