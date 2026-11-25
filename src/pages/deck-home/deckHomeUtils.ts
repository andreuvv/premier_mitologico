import type { UserDeck } from '../../hooks/useUserDecks';
import { FX_RACES, FX_TOTEM_RACE, PB_RACES, type Format, type Subformat } from '../../config/deckFormats';
import { normalizeStr } from '../deck-editor/deckEditorUtils';

export const RACE_TO_EDITION: Record<string, string> = {
  Faerie: 'espada-sagrada', Dragon: 'espada-sagrada', Caballero: 'espada-sagrada',
  Titan: 'helenica', Olimpico: 'helenica', Heroe: 'helenica',
  Desafiante: 'hijos-de-daana', Defensor: 'hijos-de-daana', Sombra: 'hijos-de-daana',
  Eterno: 'dominios-de-ra', Sacerdote: 'dominios-de-ra', Faraon: 'dominios-de-ra',
};

export const EDITION_LABELS: Record<string, string> = {
  'espada-sagrada': 'Espada Sagrada',
  'helenica': 'Helénica',
  'hijos-de-daana': 'Hijos de Daana',
  'dominios-de-ra': 'Dominios de Ra',
  'dracula-inferno': 'Drácula & Infierno',
};

export type Tab = 'myDecks' | 'explore';
export type FormatFilter = 'all' | Format;
export type SubformatFilter = 'all' | Subformat;
export type ExploreSortBy = 'updated' | 'created';

export const ALL_SUBFORMATS: { value: Subformat; label: string }[] = [
  { value: 'pb-edicion', label: 'Racial Edición' },
  { value: 'pb-libre', label: 'Racial Libre (PB)' },
  { value: 'fx-vcr', label: 'VCR' },
  { value: 'fx-libre', label: 'Racial Libre (FX)' },
  { value: 'fx-ragnarok', label: 'Racial Ragnarok (FX)' },
];

export function matchesDeckFilters(
  deck: Pick<UserDeck, 'format' | 'subformat' | 'race'>,
  formatFilter: FormatFilter,
  subformatFilter: SubformatFilter,
  raceFilter: string,
) {
  if (formatFilter !== 'all' && deck.format !== formatFilter) return false;
  if (subformatFilter !== 'all' && deck.subformat !== subformatFilter) return false;
  if (raceFilter.trim()) {
    const raceNorm = normalizeStr(deck.race ?? '');
    const queryNorm = normalizeStr(raceFilter.trim());
    if (raceNorm !== queryNorm) return false;
  }
  return true;
}

export function getVisibleRaces(formatFilter: FormatFilter) {
  if (formatFilter === 'pb') return PB_RACES;
  if (formatFilter === 'fx') return [...FX_RACES, FX_TOTEM_RACE];
  return [...new Set([...PB_RACES, ...FX_RACES, FX_TOTEM_RACE])].sort((a, b) => a.localeCompare(b, 'es'));
}

export function getVisibleSubformats(formatFilter: FormatFilter) {
  if (formatFilter === 'pb') {
    return ALL_SUBFORMATS.filter((s) => s.value === 'pb-edicion' || s.value === 'pb-libre');
  }
  if (formatFilter === 'fx') {
    return ALL_SUBFORMATS.filter((s) => s.value === 'fx-vcr' || s.value === 'fx-libre' || s.value === 'fx-ragnarok');
  }
  return ALL_SUBFORMATS;
}

export function subformatFitsFormat(format: FormatFilter, subformat: string) {
  return format === 'all' || subformat === 'all' || subformat.startsWith(`${format}-`);
}

function formatDeckDate(dateString?: string | null): string {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  const day = String(date.getDate()).padStart(2, '0');
  const month = date
    .toLocaleDateString('es-ES', { month: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());
  const year = String(date.getFullYear());

  return `${day} ${month} ${year}`;
}

/** "Creado: …" plus "Modificado: …" when the deck changed more than a minute after creation. */
export function getDeckDateLines(createdAt?: string | null, updatedAt?: string | null): string[] {
  const lines: string[] = [`Creado: ${formatDeckDate(createdAt)}`];

  if (createdAt && updatedAt) {
    const created = new Date(createdAt).getTime();
    const updated = new Date(updatedAt).getTime();
    if (!Number.isNaN(created) && !Number.isNaN(updated) && updated - created > 60_000) {
      lines.push(`Modificado: ${formatDeckDate(updatedAt)}`);
    }
  }

  return lines;
}

function getDeckSortTimestamp(
  deck: Pick<UserDeck, 'created_at' | 'updated_at'>,
  sortBy: ExploreSortBy,
): number {
  const raw = sortBy === 'created' ? deck.created_at : deck.updated_at;
  const time = new Date(raw ?? 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Newest first, by creation or last update. */
export function sortDecksByDate<T extends Pick<UserDeck, 'created_at' | 'updated_at'>>(
  decks: T[],
  sortBy: ExploreSortBy,
): T[] {
  return [...decks].sort(
    (a, b) => getDeckSortTimestamp(b, sortBy) - getDeckSortTimestamp(a, sortBy),
  );
}

export function getTabFromPath(pathname: string): Tab {
  return pathname.endsWith('/explorar') ? 'explore' : 'myDecks';
}

/** Edition name shown on pb-edicion decks, from the deck race. */
export function editionLabelForDeck(deck: Pick<UserDeck, 'subformat' | 'race'>): string | null {
  const editionSlug = deck.subformat === 'pb-edicion'
    ? (RACE_TO_EDITION[deck.race] ?? null)
    : null;
  return editionSlug ? (EDITION_LABELS[editionSlug] ?? null) : null;
}

export const formatLabelFor = (deck: Pick<UserDeck, 'format'>) => (deck.format === 'fx' ? 'Furia Extendido' : 'Primer Bloque');
