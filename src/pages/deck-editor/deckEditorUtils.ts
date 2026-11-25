import { CollectionCard, CollectionFormat } from '../../types/collection';
import { Format } from '../../config/deckFormats';
import { sameEdition } from '../../utils/editionName';

export const DECK_SIZE = 50;
export const CARDS_PER_PAGE = 75;

// Auto-select edition for pb-edicion based on race
export const RACE_TO_EDITION: Record<string, string> = {
  // Espada Sagrada
  Faerie: 'espada-sagrada', Dragon: 'espada-sagrada', Caballero: 'espada-sagrada',
  // Helénica
  Titan: 'helenica', Olimpico: 'helenica', Heroe: 'helenica',
  // Hijos de Daana
  Desafiante: 'hijos-de-daana', Defensor: 'hijos-de-daana', Sombra: 'hijos-de-daana',
  // Dominios de Ra
  Eterno: 'dominios-de-ra', Sacerdote: 'dominios-de-ra', Faraon: 'dominios-de-ra',
};

export const TYPE_TABS = [
  { value: '', label: 'Todos' },
  { value: 'Aliado', label: 'Aliados' },
  { value: 'Talisman', label: 'Talismanes' },
  { value: 'Totem', label: 'Tótems' },
  { value: 'Arma', label: 'Armas' },
  { value: 'Oro', label: 'Oros' },
];

export const TYPE_STATS = [
  { type: 'Aliado',   label: 'Aliados' },
  { type: 'Arma',     label: 'Armas' },
  { type: 'Talisman', label: 'Talismanes' },
  { type: 'Totem',    label: 'Tótems' },
  { type: 'Oro',      label: 'Oros' },
];

export const TYPE_DISPLAY: Record<string, string> = {
  Aliado:   'Aliados',
  Arma:     'Armas',
  Talisman: 'Talismanes',
  Totem:    'Tótems',
  Oro:      'Oros',
};

export const TYPE_ORDER = ['Aliado', 'Arma', 'Talisman', 'Totem', 'Oro'];
export const COST_CHART_TYPES = ['Oro', 'Aliado', 'Totem', 'Talisman', 'Arma'] as const;
export type CostChartType = typeof COST_CHART_TYPES[number];
export const COST_CHART_SEGMENT_CLASS: Record<CostChartType, string> = {
  Oro: 'costChartSegmentOro',
  Aliado: 'costChartSegmentAliado',
  Totem: 'costChartSegmentTotem',
  Talisman: 'costChartSegmentTalisman',
  Arma: 'costChartSegmentArma',
};

export type OroFilter = 'all' | 'with' | 'without';
export type DeckTarget = 'main' | 'side';
export type DeckEntry = { card: CollectionCard; count: number };
export type DeckGroups = Record<string, DeckEntry[]>;
export type CostBucket = { cost: number; count: number; byType: Record<CostChartType, number> };

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

export function isOroSinHabilidad(card: { effect?: string }): boolean {
  const text = stripHtml(card.effect ?? '').toLowerCase();
  return text === '' || text.includes('oro sin habilidad');
}

export function normalizeChartType(rawType?: string | null): CostChartType | null {
  switch (rawType?.toUpperCase()) {
    case 'ORO':
      return 'Oro';
    case 'ALIADO':
      return 'Aliado';
    case 'TOTEM':
      return 'Totem';
    case 'TALISMAN':
      return 'Talisman';
    case 'ARMA':
      return 'Arma';
    default:
      return null;
  }
}

export const normalizeStr = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function getCoverImageStyle(zoom: number, posX: number, posY: number) {
  const safeZoom = Math.max(1, zoom);
  const clampedX = Math.min(100, Math.max(0, posX));
  const clampedY = Math.min(100, Math.max(0, posY));
  return {
    backgroundSize: `${safeZoom * 100}% auto`,
    backgroundPosition: `${clampedX}% ${clampedY}%`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#101010',
  };
}

export function serializeDeckCards(cards: Record<number, number>): string {
  return Object.entries(cards)
    .filter(([, count]) => count > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([id, count]) => `${id}:${count}`)
    .join('|');
}

export type EditorSnapshotInput = {
  name: string;
  isPublic: boolean;
  isDraft: boolean;
  headerImageUrl?: string;
  headerZoom: number;
  headerPosX: number;
  headerPosY: number;
  lockedEdition: string | null;
  formatParam: Format;
  subformat: string;
  race: string;
  deckCards: Record<number, number>;
  sideDeck: Record<number, number>;
};

/** Stable string used to detect unsaved changes in the editor. */
export function buildEditorSnapshot(options: EditorSnapshotInput): string {
  return [
    options.name.trim(),
    options.isPublic ? '1' : '0',
    options.isDraft ? '1' : '0',
    options.headerImageUrl ?? '',
    options.headerZoom.toFixed(4),
    options.headerPosX.toFixed(2),
    options.headerPosY.toFixed(2),
    options.lockedEdition ?? '',
    options.formatParam,
    options.subformat,
    options.race,
    serializeDeckCards(options.deckCards),
    serializeDeckCards(options.sideDeck),
  ].join('::');
}

export function countCards(cards: Record<number, number>): number {
  return Object.values(cards).reduce((a, b) => a + b, 0);
}

/** Returns a copy of `cards` with one copy of `cardId` removed. */
export function decrementCard(cards: Record<number, number>, cardId: number): Record<number, number> {
  const next = { ...cards };
  if ((next[cardId] ?? 0) <= 1) delete next[cardId];
  else next[cardId]--;
  return next;
}

/**
 * Groups deck entries by capitalised card type, sorted by name ('es').
 * With `orosSinHabilidadLast`, Oros con habilidad come before Oros sin habilidad.
 */
export function groupDeckByType(
  cards: Record<number, number>,
  cardById: Map<number, CollectionCard>,
  orosSinHabilidadLast: boolean,
): DeckGroups {
  const groups: DeckGroups = {};
  for (const [idStr, count] of Object.entries(cards)) {
    if (count <= 0) continue;
    const card = cardById.get(Number(idStr));
    if (!card) continue;
    const rawType = card.type ?? 'Otro';
    const t = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
    if (!groups[t]) groups[t] = [];
    groups[t].push({ card, count });
  }
  for (const [type, items] of Object.entries(groups)) {
    if (orosSinHabilidadLast && type === 'Oro') {
      items.sort((a, b) => {
        const aOro = isOroSinHabilidad(a.card) ? 1 : 0;
        const bOro = isOroSinHabilidad(b.card) ? 1 : 0;
        if (aOro !== bOro) return aOro - bOro;
        return a.card.name.localeCompare(b.card.name, 'es');
      });
    } else {
      items.sort((a, b) => a.card.name.localeCompare(b.card.name, 'es'));
    }
  }
  return groups;
}

export function sortedTypeKeys(groups: DeckGroups): string[] {
  return TYPE_ORDER.filter((t) => groups[t]).concat(
    Object.keys(groups).filter((t) => !TYPE_ORDER.includes(t)),
  );
}

export function computeCostDistribution(
  deckCards: Record<number, number>,
  cardById: Map<number, CollectionCard>,
): CostBucket[] {
  const counts = new Map<number, { total: number; byType: Record<CostChartType, number> }>();
  for (const [idStr, copies] of Object.entries(deckCards)) {
    if (copies <= 0) continue;
    const card = cardById.get(Number(idStr));
    if (!card || card.cost == null) continue;
    const byTypeDefault: Record<CostChartType, number> = {
      Oro: 0,
      Aliado: 0,
      Totem: 0,
      Talisman: 0,
      Arma: 0,
    };
    const bucket = counts.get(card.cost) ?? { total: 0, byType: byTypeDefault };
    bucket.total += copies;
    const normalizedType = normalizeChartType(card.type);
    if (normalizedType) {
      bucket.byType[normalizedType] += copies;
    }
    counts.set(card.cost, bucket);
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([cost, data]) => ({ cost, count: data.total, byType: data.byType }));
}

export type CardFilterValues = {
  search: string;
  editionFilter: string;
  typeFilter: string;
  oroFilter: OroFilter;
  frequencyFilter: string;
  costFilter: string;
  attackFilter: string;
};

/** Applies the browser filters and sorts same-name cards side by side. */
export function filterBrowserCards(
  visibleCards: CollectionCard[],
  format: CollectionFormat,
  filters: CardFilterValues,
): CollectionCard[] {
  const { search, editionFilter, typeFilter, oroFilter, frequencyFilter, costFilter, attackFilter } = filters;
  let cards = visibleCards;
  const q = search.trim();
  if (q) {
    const norm = normalizeStr(q);
    cards = cards.filter(
      (c) =>
        normalizeStr(c.name).includes(norm) ||
        c.collectorCode.toLowerCase().includes(q.toLowerCase()),
    );
  }
  if (typeFilter) {
    cards = cards.filter(
      (c) => c.type?.toUpperCase() === typeFilter.toUpperCase(),
    );
  }
  if (editionFilter) {
    if (format === CollectionFormat.PRIMER_BLOQUE) {
      cards = cards.filter((c) => sameEdition(c.edition?.name, editionFilter));
    } else {
      cards = cards.filter(
        (c) =>
          c.product?.productName === editionFilter &&
          c.product?.productType === 'Edición',
      );
    }
  }
  if (typeFilter === 'Oro' && oroFilter !== 'all') {
    cards = cards.filter((c) => {
      if (c.type?.toUpperCase() !== 'ORO') return false;
      const sinHabilidad = isOroSinHabilidad(c);
      return oroFilter === 'with' ? !sinHabilidad : sinHabilidad;
    });
  }
  if (frequencyFilter) {
    cards = cards.filter((c) => c.frequency === frequencyFilter);
  }
  if (costFilter !== '') {
    cards = cards.filter((c) => c.cost === parseInt(costFilter, 10));
  }
  if (attackFilter !== '') {
    cards = cards.filter((c) => c.attack === parseInt(attackFilter, 10));
  }
  // Group same-name cards together so different designs/editions of the
  // same card appear side by side. Sort by normalized name first, then
  // by edition slug as a secondary key.
  cards.sort((a, b) => {
    const na = normalizeStr(a.name);
    const nb = normalizeStr(b.name);
    if (na !== nb) return na.localeCompare(nb);
    return (a.edition?.slug ?? '').localeCompare(b.edition?.slug ?? '');
  });
  return cards;
}
