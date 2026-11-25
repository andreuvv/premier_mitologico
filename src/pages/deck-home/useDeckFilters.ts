import { useMemo, useState } from 'react';
import {
  getVisibleRaces,
  getVisibleSubformats,
  matchesDeckFilters,
  subformatFitsFormat,
  type FormatFilter,
  type SubformatFilter,
} from './deckHomeUtils';
import type { UserDeck } from '../../hooks/useUserDecks';

/** Format / subformat / race filters of a deck list. */
export function useDeckFilters() {
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [subformatFilter, setSubformatFilter] = useState<SubformatFilter>('all');
  const [raceFilter, setRaceFilter] = useState('');

  const visibleSubformats = useMemo(() => getVisibleSubformats(formatFilter), [formatFilter]);
  const visibleRaces = useMemo(() => getVisibleRaces(formatFilter), [formatFilter]);

  // Changing the format clears a subformat or race filter that no longer applies.
  const changeFormatFilter = (next: FormatFilter) => {
    setFormatFilter(next);
    if (!subformatFitsFormat(next, subformatFilter)) setSubformatFilter('all');
    if (raceFilter && !getVisibleRaces(next).includes(raceFilter)) setRaceFilter('');
  };

  const matches = (deck: Pick<UserDeck, 'format' | 'subformat' | 'race'>) =>
    matchesDeckFilters(deck, formatFilter, subformatFilter, raceFilter);

  return {
    formatFilter, changeFormatFilter,
    subformatFilter, setSubformatFilter,
    raceFilter, setRaceFilter,
    visibleSubformats, visibleRaces, matches,
  };
}

export type DeckFilters = ReturnType<typeof useDeckFilters>;
