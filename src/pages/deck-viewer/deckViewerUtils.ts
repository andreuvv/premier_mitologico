import type { CollectionCard } from '../../types/collection';

export const DECK_SIZE = 50;
export const STACK_OFFSET = 13; // px offset per stacked copy
export const CARD_WIDTH = 100;  // px

// Rejects if the given promise doesn't settle in time, so the "Generando..."
// state can never get stuck permanently (e.g. if the browser can't rasterize
// the SVG on a low-memory device).
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('export-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const RACE_TO_EDITION: Record<string, string> = {
  Faerie: 'espada-sagrada', Dragon: 'espada-sagrada', Caballero: 'espada-sagrada',
  Titan: 'helenica', Olimpico: 'helenica', Heroe: 'helenica',
  Desafiante: 'hijos-de-daana', Defensor: 'hijos-de-daana', Sombra: 'hijos-de-daana',
  Eterno: 'dominios-de-ra', Sacerdote: 'dominios-de-ra', Faraon: 'dominios-de-ra',
};

const EDITION_LABELS: Record<string, string> = {
  'espada-sagrada': 'Espada Sagrada',
  'helenica': 'Helénica',
  'hijos-de-daana': 'Hijos de Daana',
  'dominios-de-ra': 'Dominios de Ra',
  'dracula-inferno': 'Drácula & Infierno',
};

/** Edition badge for Racial Edición decks (the race decides the edition). */
export function editionLabelFor(subformat: string, race: string): string | null {
  const editionSlug = subformat === 'pb-edicion' ? (RACE_TO_EDITION[race] ?? null) : null;
  return editionSlug ? (EDITION_LABELS[editionSlug] ?? editionSlug) : null;
}

export const FORMAT_LABELS: Record<string, string> = {
  pb: 'Primer Bloque',
  fx: 'Furia Extendido',
};

export const SUBFORMAT_LABELS: Record<string, string> = {
  'pb-edicion': 'Racial Edición',
  'pb-libre':   'Racial Libre',
  'fx-vcr':     'VCR',
  'fx-libre':   'Racial Libre',
  'fx-ragnarok': 'Racial Ragnarok',
};

const TYPE_ORDER = ['Aliado', 'Arma', 'Talisman', 'Totem', 'Oro'];
export const COST_CHART_TYPES = ['Oro', 'Aliado', 'Totem', 'Talisman', 'Arma'] as const;
export type CostChartType = typeof COST_CHART_TYPES[number];
export const COST_CHART_SEGMENT_CLASS: Record<CostChartType, string> = {
  Oro: 'costChartSegmentOro',
  Aliado: 'costChartSegmentAliado',
  Totem: 'costChartSegmentTotem',
  Talisman: 'costChartSegmentTalisman',
  Arma: 'costChartSegmentArma',
};
export const TYPE_DISPLAY: Record<string, string> = {
  Aliado:   'Aliados',
  Arma:     'Armas',
  Talisman: 'Talismanes',
  Totem:    'Tótems',
  Oro:      'Oros',
};

export const TYPE_STATS = [
  { type: 'Aliado',   label: 'Aliados' },
  { type: 'Arma',     label: 'Armas' },
  { type: 'Talisman', label: 'Talismanes' },
  { type: 'Totem',    label: 'Tótems' },
  { type: 'Oro',      label: 'Oros' },
];

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

function isOroSinHabilidad(card: CollectionCard): boolean {
  const text = stripHtml(card.effect ?? '').toLowerCase();
  return text === '' || text.includes('oro sin habilidad');
}

function normalizeChartType(rawType?: string | null): CostChartType | null {
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

export type DeckEntry = { card: CollectionCard; count: number };
export type DeckGroups = Record<string, DeckEntry[]>;

/**
 * Groups deck cards by type ("Aliado", "Oro", ...), sorted by name.
 * With `orosSinHabilidadLast`, Oros sin habilidad go to the end of the Oro group.
 */
export function groupByType(
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
        return a.card.name.localeCompare(b.card.name);
      });
    } else {
      items.sort((a, b) => a.card.name.localeCompare(b.card.name));
    }
  }
  return groups;
}

/** Group keys in display order: known types first, then any other type. */
export function sortedTypeKeys(groups: DeckGroups): string[] {
  return TYPE_ORDER.filter((t) => groups[t]).concat(
    Object.keys(groups).filter((t) => !TYPE_ORDER.includes(t)),
  );
}

export interface CostBucket {
  cost: number;
  count: number;
  byType: Record<CostChartType, number>;
}

/** Copies per cost, split by card type, sorted by cost. */
export function costDistribution(cards: Record<number, number>, cardById: Map<number, CollectionCard>): CostBucket[] {
  const counts = new Map<number, { total: number; byType: Record<CostChartType, number> }>();
  for (const [idStr, copies] of Object.entries(cards)) {
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
    if (normalizedType) bucket.byType[normalizedType] += copies;
    counts.set(card.cost, bucket);
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([cost, data]) => ({ cost, count: data.total, byType: data.byType }));
}
