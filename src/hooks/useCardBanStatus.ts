import { useEffect, useState } from 'react';
import { CollectionCard } from '../types/collection';
import { BanListData, BanListFormat } from '../types/banlist';
import { loadBanlist } from '../services/banlistService';
import { cardKey } from '../utils/cardGrouping';

export type CardBanState = 'banned' | 'limitedX1' | 'limitedX2' | 'legal' | 'loading' | 'unavailable';

export interface CardBanRow {
  label: string;
  state: CardBanState;
  text: string;
}

const STATUS_TEXT: Record<Exclude<CardBanState, 'loading' | 'unavailable'>, string> = {
  banned: 'Baneada',
  limitedX1: 'Limitada x1',
  limitedX2: 'Limitada x2',
  legal: 'Liberada',
};

const PB_FORMATS: { format: BanListFormat; label: string }[] = [
  { format: BanListFormat.PRIMER_BLOQUE_EDICION, label: 'Racial Edición' },
  { format: BanListFormat.PRIMER_BLOQUE_LIBRE, label: 'Racial Libre' },
];

const FX_FORMATS: { format: BanListFormat; label: string }[] = [
  { format: BanListFormat.BLOQUE_FURIA_LIBRE, label: 'Racial Libre' },
  { format: BanListFormat.BLOQUE_FURIA_RAGNAROK, label: 'Racial Ragnarok' },
];

interface IndexedBanlist {
  byKey: Map<string, Exclude<CardBanState, 'loading' | 'unavailable' | 'legal'>>;
}

const resolvedCache = new Map<BanListFormat, IndexedBanlist | null>();
const pendingCache = new Map<BanListFormat, Promise<IndexedBanlist | null>>();

function indexBanlist(data: BanListData): IndexedBanlist {
  const byKey = new Map<string, Exclude<CardBanState, 'loading' | 'unavailable' | 'legal'>>();
  for (const card of data.limitedX2) byKey.set(cardKey(card.name, card.type), 'limitedX2');
  for (const card of data.limitedX1) byKey.set(cardKey(card.name, card.type), 'limitedX1');
  for (const card of data.banned) byKey.set(cardKey(card.name, card.type), 'banned');
  return { byKey };
}

function loadIndexedBanlist(format: BanListFormat): Promise<IndexedBanlist | null> {
  if (resolvedCache.has(format)) {
    return Promise.resolve(resolvedCache.get(format) ?? null);
  }

  const pending = pendingCache.get(format);
  if (pending) return pending;

  const request = loadBanlist(format)
    .then((data) => {
      const indexed = indexBanlist(data);
      resolvedCache.set(format, indexed);
      return indexed;
    })
    .catch((error) => {
      console.error('Error loading banlist for card detail:', error);
      resolvedCache.set(format, null);
      return null;
    })
    .finally(() => {
      pendingCache.delete(format);
    });

  pendingCache.set(format, request);
  return request;
}

function formatsForCard(card: CollectionCard) {
  const slug = card.game?.slug ?? '';
  if (slug === 'furia-extendido' || card.gameId === 3) return FX_FORMATS;
  return PB_FORMATS;
}

function rowsFor(
  card: CollectionCard,
  lists: Array<IndexedBanlist | null | undefined>,
): CardBanRow[] {
  const key = cardKey(card.name, card.type);
  return formatsForCard(card).map((entry, index) => {
    const list = lists[index];
    if (list === undefined) {
      return { label: entry.label, state: 'loading', text: 'Cargando' };
    }
    if (list === null) {
      return { label: entry.label, state: 'unavailable', text: 'No disponible' };
    }
    const state = list.byKey.get(key) ?? 'legal';
    return { label: entry.label, state, text: STATUS_TEXT[state] };
  });
}

export function useCardBanStatus(card: CollectionCard | null): CardBanRow[] {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!card) return;

    const formats = formatsForCard(card);
    if (formats.every((entry) => resolvedCache.has(entry.format))) return;

    let cancelled = false;
    Promise.all(formats.map((entry) => loadIndexedBanlist(entry.format))).then(() => {
      if (!cancelled) setVersion((current) => current + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [card]);

  if (!card) return [];

  const formats = formatsForCard(card);
  const lists = formats.map((entry) => (
    resolvedCache.has(entry.format) ? resolvedCache.get(entry.format) : undefined
  ));
  return rowsFor(card, lists);
}
