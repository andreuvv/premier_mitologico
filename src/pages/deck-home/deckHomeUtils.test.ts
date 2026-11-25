import { describe, expect, it } from 'vitest';
import {
  editionLabelForDeck,
  getDeckDateLines,
  getVisibleSubformats,
  matchesDeckFilters,
  sortDecksByDate,
  subformatFitsFormat,
} from './deckHomeUtils';

describe('deckHomeUtils', () => {
  it('filters by format, subformat and accent-insensitive race', () => {
    const deck = { format: 'pb' as const, subformat: 'pb-edicion' as const, race: 'Titán' };
    expect(matchesDeckFilters(deck, 'all', 'all', '')).toBe(true);
    expect(matchesDeckFilters(deck, 'pb', 'pb-edicion', 'Titan')).toBe(true);
    expect(matchesDeckFilters(deck, 'fx', 'all', '')).toBe(false);
    expect(matchesDeckFilters(deck, 'pb', 'pb-libre', '')).toBe(false);
    expect(matchesDeckFilters(deck, 'pb', 'all', 'Faerie')).toBe(false);
  });

  it('lists the subformats of each format and checks they fit', () => {
    expect(getVisibleSubformats('pb').map((s) => s.value)).toEqual(['pb-edicion', 'pb-libre']);
    expect(getVisibleSubformats('fx').map((s) => s.value)).toEqual(['fx-vcr', 'fx-libre', 'fx-ragnarok']);
    expect(getVisibleSubformats('all')).toHaveLength(5);
    expect(subformatFitsFormat('pb', 'fx-vcr')).toBe(false);
    expect(subformatFitsFormat('fx', 'fx-vcr')).toBe(true);
    expect(subformatFitsFormat('pb', 'all')).toBe(true);
  });

  it('shows the modified date only after more than a minute', () => {
    expect(getDeckDateLines(null, null)).toEqual(['Creado: Sin fecha']);
    expect(getDeckDateLines('2026-06-27T12:00:00', '2026-06-27T12:00:30')).toHaveLength(1);
    expect(getDeckDateLines('2026-06-27T12:00:00', '2026-08-21T12:00:00')).toHaveLength(2);
  });

  it('sorts newest first by the chosen date', () => {
    const decks = [
      { id: 'a', created_at: '2026-01-01', updated_at: '2026-05-01' },
      { id: 'b', created_at: '2026-03-01', updated_at: '2026-03-02' },
    ];
    expect(sortDecksByDate(decks, 'updated').map((d) => d.id)).toEqual(['a', 'b']);
    expect(sortDecksByDate(decks, 'created').map((d) => d.id)).toEqual(['b', 'a']);
  });

  it('labels the edition of pb-edicion decks only', () => {
    expect(editionLabelForDeck({ subformat: 'pb-edicion', race: 'Titan' })).toBe('Helénica');
    expect(editionLabelForDeck({ subformat: 'pb-libre', race: 'Titan' })).toBeNull();
  });
});
