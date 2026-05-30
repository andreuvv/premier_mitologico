import { useMemo } from 'react';
import { CollectionCard } from '../types/collection';
import { BanListData } from '../types/banlist';

export type DeckSubformat = 'pb-edicion' | 'pb-libre' | 'fx-vcr' | 'fx-libre';

const DRACULA_EDITION_SLUG = 'dracula-inferno';
const VCR_FREQUENCIES = new Set(['VASALLO', 'CORTESANO', 'REAL', 'ORO']);
const MIN_ALIADOS = 16;
const DECK_SIZE = 50;

// ── Name normalization for cross-reprint matching ─────────────────────────────
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')
    .toLowerCase()
    .trim();
}

// Key used to identify "same card across reprints": normalized name + normalized type
function cardKey(name: string, type: string): string {
  return `${normalizeName(name)}|${type.toUpperCase().trim()}`;
}

// Grouping key for visibility/legality rules.
// Important: cards with trailing "*" are treated as a different group.
function groupKey(name: string, type: string): string {
  return cardKey(name, type);
}

function isReworkCard(card: CollectionCard): boolean {
  return card.isRework === true || card.isReworked === true;
}

// ── Build lookup structures from banlist data ─────────────────────────────────
interface BanlistLookup {
  banned: Set<string>;      // cardKey → banned
  limitedX1: Set<string>;   // cardKey → max 1
  limitedX2: Set<string>;   // cardKey → max 2
}

function buildBanlistLookup(banlist: BanListData | null): BanlistLookup {
  const banned = new Set<string>();
  const limitedX1 = new Set<string>();
  const limitedX2 = new Set<string>();
  if (!banlist) return { banned, limitedX1, limitedX2 };
  for (const c of banlist.banned)     banned.add(cardKey(c.name, c.type));
  for (const c of banlist.limitedX1)  limitedX1.add(cardKey(c.name, c.type));
  for (const c of banlist.limitedX2)  limitedX2.add(cardKey(c.name, c.type));
  return { banned, limitedX1, limitedX2 };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseDeckRulesProps {
  subformat: DeckSubformat;
  race: string;
  allCards: CollectionCard[];
  deckCards: Record<number, number>;
  banlist: BanListData | null;
  /** For pb-edicion: the edition slug the user has locked in (null = not locked yet) */
  lockedEdition: string | null;
}

export interface DeckRulesResult {
  /** Whether a card should appear in the browser at all */
  isCardVisible: (card: CollectionCard) => boolean;
  /** Max copies allowed for this card considering banlist + unique + moreThan3 */
  getHardMax: (card: CollectionCard) => number;
  /** How many more copies you can add (0 = can't add any more) */
  availableToAdd: (card: CollectionCard) => number;
  /** Whether the + button should be enabled */
  canAdd: (card: CollectionCard) => boolean;
  /** Total copies in deck of all cards sharing the same name+type */
  getGroupCount: (card: CollectionCard) => number;
  /** Validation errors (must fix before saving) */
  errors: string[];
  /** Validation warnings (informational) */
  warnings: string[];
  /** Set of cardKeys currently in the deck (for quick lookup) */
  deckNameTypeKeys: Set<string>;
}

export function useDeckRules({
  subformat,
  race,
  allCards,
  deckCards,
  banlist,
  lockedEdition,
}: UseDeckRulesProps): DeckRulesResult {

  const banlistLookup = useMemo(() => buildBanlistLookup(banlist), [banlist]);

  // Map id → card for quick lookup
  const cardById = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards],
  );

  // Group all cards by logical key (same normalized name+type).
  const cardsByGroupKey = useMemo(() => {
    const map = new Map<string, CollectionCard[]>();
    for (const card of allCards) {
      const gk = groupKey(card.name, card.type);
      const list = map.get(gk) ?? [];
      list.push(card);
      map.set(gk, list);
    }
    return map;
  }, [allCards]);

  // If a group has at least one rework card, only rework cards from that group are valid.
  const groupsWithRework = useMemo(() => {
    const set = new Set<string>();
    for (const [gk, cards] of cardsByGroupKey.entries()) {
      if (cards.some((c) => isReworkCard(c))) set.add(gk);
    }
    return set;
  }, [cardsByGroupKey]);

  // Set of cards with Vasallo/Cortesano/Real frequency (used for VCR filter)
  // Key: cardKey(name, type). If a card has at least one VCR-freq version, all versions are allowed.
  const vcrEligibleKeys = useMemo(() => {
    if (subformat !== 'fx-vcr') return null;
    const eligible = new Set<string>();

    for (const [gk, cards] of cardsByGroupKey.entries()) {
      // New rule: if there is a card marked as newest in the group,
      // VCR eligibility is determined ONLY by that newest card frequency.
      const newest = cards.find((c) => c.isNewest === true);
      if (newest) {
        if (VCR_FREQUENCIES.has(newest.frequency?.toUpperCase())) {
          eligible.add(gk);
        }
        continue;
      }

      // Fallback behavior when group has no newest marker.
      if (cards.some((c) => VCR_FREQUENCIES.has(c.frequency?.toUpperCase()))) {
        eligible.add(gk);
      }
    }
    return eligible;
  }, [cardsByGroupKey, subformat]);

  // Set of cardKey(name, type) for cards present in non-Dracula editions (for pb-edicion reprint check)
  const nonDraculaCardKeys = useMemo(() => {
    if (subformat !== 'pb-edicion') return null;
    const keys = new Set<string>();
    for (const card of allCards) {
      if (card.edition?.slug !== DRACULA_EDITION_SLUG) {
        keys.add(cardKey(card.name, card.type));
      }
    }
    return keys;
  }, [allCards, subformat]);

  // Current deck cards as {card, count}[]
  const deckEntries = useMemo(() => {
    const entries: { card: CollectionCard; count: number }[] = [];
    for (const [idStr, count] of Object.entries(deckCards)) {
      if (count <= 0) continue;
      const card = cardById.get(Number(idStr));
      if (card) entries.push({ card, count });
    }
    return entries;
  }, [deckCards, cardById]);

  // Total copies in deck per cardKey(name, type)  — for unique/limited enforcement
  const countByNameType = useMemo(() => {
    const map = new Map<string, number>();
    for (const { card, count } of deckEntries) {
      const key = cardKey(card.name, card.type);
      map.set(key, (map.get(key) ?? 0) + count);
    }
    return map;
  }, [deckEntries]);

  // Total number of cards in deck (all copies)
  const totalDeckCount = useMemo(
    () => deckEntries.reduce((s, { count }) => s + count, 0),
    [deckEntries],
  );

  const deckNameTypeKeys = useMemo(
    () => new Set(countByNameType.keys()),
    [countByNameType],
  );

  // ── isCardVisible ─────────────────────────────────────────────────────────

  const isCardVisible = useMemo(() => (card: CollectionCard): boolean => {
    const type = card.type?.toUpperCase();
    const normalizedRace = normalizeName(race);
    const gk = groupKey(card.name, card.type);

    // Global rule: if a logical group has a rework, non-rework versions are invalid.
    if (groupsWithRework.has(gk) && !isReworkCard(card)) {
      return false;
    }

    // Aliado race filter: only show Aliados of the selected race
    if (type === 'ALIADO') {
      const matchesRace = card.race?.some(
        (r) => normalizeName(r) === normalizedRace,
      );
      if (!matchesRace) return false;
    }

    // VCR: only show cards that have at least one VCR-freq version.
    // REWORK cards are eligible if their base name (without " *") has a VCR-freq version.
    if (subformat === 'fx-vcr' && vcrEligibleKeys) {
      if (!vcrEligibleKeys.has(gk)) return false;
    }

    // PB Racial Edición
    if (subformat === 'pb-edicion') {
      // Never show Drácula-only cards (cards whose name+type doesn't exist in any other edition)
      if (card.edition?.slug === DRACULA_EDITION_SLUG) {
        if (!nonDraculaCardKeys?.has(cardKey(card.name, card.type))) return false;
      }
      // If an edition is locked, only show cards from that edition (+ Drácula reprints)
      if (lockedEdition) {
        const isLockedEdition = card.edition?.slug === lockedEdition;
        const isDraculaReprint =
          card.edition?.slug === DRACULA_EDITION_SLUG &&
          nonDraculaCardKeys?.has(cardKey(card.name, card.type));
        if (!isLockedEdition && !isDraculaReprint) return false;
      }
    }

    return true;
  }, [subformat, race, groupsWithRework, vcrEligibleKeys, nonDraculaCardKeys, lockedEdition]);

  // ── getHardMax ────────────────────────────────────────────────────────────

  const getHardMax = useMemo(() => (card: CollectionCard): number => {
    const key = cardKey(card.name, card.type);

    // Banlist check (highest priority)
    if (banlistLookup.banned.has(key)) return 0;
    if (banlistLookup.limitedX1.has(key)) return 1;
    if (banlistLookup.limitedX2.has(key)) return 2;

    // moreThan3: unlimited
    if (card.moreThan3) return Infinity;

    // Unique: max 1 (across ALL versions with same name+type)
    if (card.unique) return 1;

    // Default
    return 3;
  }, [banlistLookup]);

  // ── availableToAdd ────────────────────────────────────────────────────────

  const availableToAdd = useMemo(() => (card: CollectionCard): number => {
    const hardMax = getHardMax(card);
    if (hardMax === 0) return 0;

    const key = cardKey(card.name, card.type);
    // Count all copies of this card (by name+type) already in deck
    const currentTotal = countByNameType.get(key) ?? 0;

    if (hardMax === Infinity) return Infinity;
    return Math.max(0, hardMax - currentTotal);
  }, [getHardMax, countByNameType]);

  const canAdd = useMemo(
    () => (card: CollectionCard): boolean =>
      availableToAdd(card) > 0 && totalDeckCount < DECK_SIZE,
    [availableToAdd, totalDeckCount],
  );

  const getGroupCount = useMemo(
    () => (card: CollectionCard): number =>
      countByNameType.get(cardKey(card.name, card.type)) ?? 0,
    [countByNameType],
  );

  // ── Validation ────────────────────────────────────────────────────────────

  const { errors, warnings } = useMemo(() => {
    const errs: string[] = [];
    const warns: string[] = [];

    const totalCount = deckEntries.reduce((s, { count }) => s + count, 0);

    // Min aliados
    const aliadoCount = deckEntries
      .filter(({ card }) => card.type?.toUpperCase() === 'ALIADO')
      .reduce((s, { count }) => s + count, 0);
    if (aliadoCount < MIN_ALIADOS) {
      errs.push(`Necesitas al menos ${MIN_ALIADOS} Aliados (tienes ${aliadoCount})`);
    }

    // Min 1 Oro sin habilidad — effect is literally "Oro sin habilidad." (or empty after stripping HTML)
    const stripHtml = (s: string | null | undefined): string =>
      (s ?? '').replace(/<[^>]*>/g, '').trim();
    const isOroSinHabilidad = (card: CollectionCard) => {
      if (card.type?.toUpperCase() !== 'ORO') return false;
      const text = stripHtml(card.effect).toLowerCase();
      return text === '' || text.includes('oro sin habilidad');
    };
    const oroSinHabilidad = deckEntries.filter(({ card }) => isOroSinHabilidad(card));
    if (oroSinHabilidad.length === 0) {
      errs.push('Necesitas al menos 1 Oro sin habilidad');
    }

    // Banlist violations (banned cards in deck)
    for (const { card } of deckEntries) {
      const gk = groupKey(card.name, card.type);

      if (groupsWithRework.has(gk) && !isReworkCard(card)) {
        errs.push(`"${card.name}" no es válida: existe versión rework para esta carta`);
      }

      const key = cardKey(card.name, card.type);
      if (banlistLookup.banned.has(key)) {
        errs.push(`"${card.name}" está prohibida`);
      } else if (banlistLookup.limitedX1.has(key)) {
        const total = countByNameType.get(key) ?? 0;
        if (total > 1) errs.push(`"${card.name}" está limitada a 1 copia (tienes ${total})`);
      } else if (banlistLookup.limitedX2.has(key)) {
        const total = countByNameType.get(key) ?? 0;
        if (total > 2) errs.push(`"${card.name}" está limitada a 2 copias (tienes ${total})`);
      }
    }

    // Unique violations
    for (const { card } of deckEntries) {
      if (card.unique) {
        const key = cardKey(card.name, card.type);
        const total = countByNameType.get(key) ?? 0;
        if (total > 1) {
          errs.push(`"${card.name}" es única (solo 1 copia permitida, tienes ${total})`);
        }
      }
    }

    // Default max 3 violations
    for (const { card } of deckEntries) {
      if (!card.unique && !card.moreThan3) {
        const key = cardKey(card.name, card.type);
        const total = countByNameType.get(key) ?? 0;
        const hardMax = getHardMax(card);
        if (total > hardMax && hardMax > 0) {
          errs.push(`"${card.name}": máximo ${hardMax} copias (tienes ${total})`);
        }
      }
    }

    // PB Racial Edición: edition consistency
    if (subformat === 'pb-edicion' && lockedEdition) {
      for (const { card } of deckEntries) {
        const isDraculaReprint =
          card.edition?.slug === DRACULA_EDITION_SLUG &&
          nonDraculaCardKeys?.has(cardKey(card.name, card.type));
        if (card.edition?.slug !== lockedEdition && !isDraculaReprint) {
          errs.push(`"${card.name}" no es de la edición seleccionada`);
        }
      }
    }

    // Deck size
    if (totalCount < 50) {
      warns.push(`Faltan ${50 - totalCount} cartas para completar el mazo (${totalCount}/50)`);
    } else if (totalCount > 50) {
      errs.push(`El mazo tiene ${totalCount} cartas (máximo 50)`);
    }

    return { errors: errs, warnings: warns };
  }, [
    deckEntries,
    banlistLookup,
    countByNameType,
    getHardMax,
    subformat,
    lockedEdition,
    nonDraculaCardKeys,
    groupsWithRework,
  ]);

  return {
    isCardVisible,
    getHardMax,
    availableToAdd,
    canAdd,
    getGroupCount,
    errors,
    warnings,
    deckNameTypeKeys,
  };
}
