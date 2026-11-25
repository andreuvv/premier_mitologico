import { describe, expect, it } from 'vitest';
import { CollectionCard, CollectionFormat } from '../../types/collection';
import {
  buildEditorSnapshot,
  computeCostDistribution,
  decrementCard,
  filterBrowserCards,
  groupDeckByType,
  sortedTypeKeys,
} from './deckEditorUtils';

const card = (id: number, name: string, type: string, extra: Partial<CollectionCard> = {}) =>
  ({ id, name, type, collectorCode: `C${id}`, cost: 1, ...extra }) as unknown as CollectionCard;

const cards = [
  card(1, 'Zeus', 'ALIADO', { cost: 3 }),
  card(2, 'Ábaco', 'ALIADO', { cost: 2 }),
  card(3, 'Oro', 'ORO', { effect: '', cost: undefined as unknown as number }),
  card(4, 'Oro Dorado', 'ORO', { effect: 'Al entrar, roba una carta.', cost: undefined as unknown as number }),
  card(5, 'Espada', 'ARMA', { cost: 2 }),
];
const byId = new Map(cards.map((c) => [c.id, c]));

describe('deckEditorUtils', () => {
  it('serializes snapshots independently of card insertion order', () => {
    const base = {
      name: ' Mazo ', isPublic: true, isDraft: false, headerZoom: 1, headerPosX: 50, headerPosY: 50,
      lockedEdition: null, formatParam: 'pb' as const, subformat: 'pb-libre', race: 'Titan', sideDeck: {},
    };
    const a = buildEditorSnapshot({ ...base, deckCards: { 2: 1, 1: 3, 9: 0 } });
    const b = buildEditorSnapshot({ ...base, name: 'Mazo', deckCards: { 1: 3, 2: 1 } });
    expect(a).toBe(b);
  });

  it('decrements and removes cards', () => {
    expect(decrementCard({ 1: 2 }, 1)).toEqual({ 1: 1 });
    expect(decrementCard({ 1: 1, 2: 1 }, 1)).toEqual({ 2: 1 });
    expect(decrementCard({}, 7)).toEqual({});
  });

  it('groups by type, sorting Oros sin habilidad last only for the main deck', () => {
    const main = groupDeckByType({ 1: 1, 2: 2, 3: 4, 4: 1, 5: 1 }, byId, true);
    expect(main.Aliado.map((e) => e.card.name)).toEqual(['Ábaco', 'Zeus']);
    expect(main.Oro.map((e) => e.card.name)).toEqual(['Oro Dorado', 'Oro']);
    expect(sortedTypeKeys(main)).toEqual(['Aliado', 'Arma', 'Oro']);
    const side = groupDeckByType({ 3: 1, 4: 1 }, byId, false);
    expect(side.Oro.map((e) => e.card.name)).toEqual(['Oro', 'Oro Dorado']);
  });

  it('computes the cost distribution by type', () => {
    expect(computeCostDistribution({ 1: 2, 2: 1, 5: 3, 3: 10 }, byId)).toEqual([
      { cost: 2, count: 4, byType: { Oro: 0, Aliado: 1, Totem: 0, Talisman: 0, Arma: 3 } },
      { cost: 3, count: 2, byType: { Oro: 0, Aliado: 2, Totem: 0, Talisman: 0, Arma: 0 } },
    ]);
  });

  it('filters by accent-insensitive search, type and oro ability', () => {
    const filters = {
      search: '', editionFilter: '', typeFilter: '', oroFilter: 'all' as const,
      frequencyFilter: '', costFilter: '', attackFilter: '',
    };
    expect(filterBrowserCards([...cards], CollectionFormat.PRIMER_BLOQUE, { ...filters, search: 'abaco' }).map((c) => c.id)).toEqual([2]);
    expect(filterBrowserCards([...cards], CollectionFormat.PRIMER_BLOQUE, { ...filters, typeFilter: 'Oro', oroFilter: 'without' }).map((c) => c.id)).toEqual([3]);
    expect(filterBrowserCards([...cards], CollectionFormat.PRIMER_BLOQUE, { ...filters, costFilter: '2' }).map((c) => c.id)).toEqual([2, 5]);
  });
});
