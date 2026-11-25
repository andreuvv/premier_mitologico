import { useEffect, useMemo, useState } from 'react';
import { CollectionCard, CollectionFormat } from '../../types/collection';
import { canonicalEditionNames } from '../../utils/editionName';
import { CARDS_PER_PAGE, OroFilter, filterBrowserCards } from './deckEditorUtils';

/**
 * Filter, option and pagination state for the editor's card browser.
 * `isCardVisible` comes from the deck rules (format/race/edition restrictions).
 */
export function useCardBrowserFilters(
  allCards: CollectionCard[],
  format: CollectionFormat,
  showEditionBrowserFilter: boolean,
  isCardVisible: (card: CollectionCard) => boolean,
) {
  const [search, setSearch] = useState('');
  const [editionFilter, setEditionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [oroFilter, setOroFilter] = useState<OroFilter>('all');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [costFilter, setCostFilter] = useState('');
  const [attackFilter, setAttackFilter] = useState('');
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, editionFilter, typeFilter, oroFilter, frequencyFilter, costFilter, attackFilter]);

  useEffect(() => {
    if (!showEditionBrowserFilter) setEditionFilter('');
  }, [showEditionBrowserFilter]);

  const filteredCards = useMemo(
    () =>
      filterBrowserCards(allCards.filter(isCardVisible), format, {
        search, editionFilter, typeFilter, oroFilter, frequencyFilter, costFilter, attackFilter,
      }),
    [allCards, search, editionFilter, format, typeFilter, oroFilter, frequencyFilter, costFilter, attackFilter, isCardVisible],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  const paginatedCards = filteredCards.slice(
    (page - 1) * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE,
  );

  const browserEditionOptions = useMemo(() => {
    if (format === CollectionFormat.PRIMER_BLOQUE) {
      return canonicalEditionNames(
        allCards.flatMap((c) => (c.edition?.name ? [c.edition.name] : [])),
      );
    }
    return Array.from(
      new Map(
        allCards
          .filter((c) => c.product?.productType === 'Edición')
          .map((c) => [c.product!.productName, c.product!.productName]),
      ).values(),
    ).sort((a, b) => a.localeCompare(b, 'es'));
  }, [allCards, format]);

  const costOptions = useMemo(
    () =>
      Array.from(new Set(allCards.map((c) => c.cost).filter((c) => c != null))).sort(
        (a, b) => a - b,
      ),
    [allCards],
  );

  const frequencyOptions = useMemo(
    () =>
      Array.from(new Set(allCards.map((c) => c.frequency).filter((f) => Boolean(f)))).sort(
        (a, b) => a.localeCompare(b, 'es'),
      ),
    [allCards],
  );

  const attackOptions = useMemo(
    () =>
      Array.from(
        new Set(allCards.map((c) => c.attack).filter((a) => a != null && a > 0)),
      ).sort((a, b) => a - b),
    [allCards],
  );

  const selectType = (value: string) => {
    setTypeFilter(value);
    if (value !== 'Oro') setOroFilter('all');
  };

  return {
    search, setSearch,
    editionFilter, setEditionFilter,
    typeFilter, selectType,
    oroFilter, setOroFilter,
    frequencyFilter, setFrequencyFilter,
    costFilter, setCostFilter,
    attackFilter, setAttackFilter,
    page, setPage, totalPages,
    filteredCards, paginatedCards,
    browserEditionOptions, costOptions, frequencyOptions, attackOptions,
  };
}

export type CardBrowserFilters = ReturnType<typeof useCardBrowserFilters>;
