import { useEffect, useMemo, useRef, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { CollectionCatalog, CollectionCard, CollectionFormat } from '../../types/collection';
import { loadCollectionCards } from '../../services/collectionService';
import type { SimpleCard } from '../../components/CardGrid';
import type { FilterParams } from '../../components/CollectionFilters';
import { useUserCollection } from '../../hooks/useUserCollection';
import { useUserCardList } from '../../hooks/useUserCardList';
import { toSimpleCards, type CardSection } from './profileUtils';

/**
 * Card catalog, filters and the profile's collection/favorites/wishlist for the
 * selected format. Format, section, filters and page live in the URL.
 */
export function useProfileCards(
  targetUserId: string | null,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
) {
  const [selectedFormat, setSelectedFormat] = useState<CollectionFormat>(
    searchParams.get('format') === CollectionFormat.FURIA_EXTENDIDO
      ? CollectionFormat.FURIA_EXTENDIDO
      : CollectionFormat.PRIMER_BLOQUE,
  );
  const [cardSection, setCardSection] = useState<CardSection>(
    (searchParams.get('section') as CardSection) || 'collection',
  );
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<SimpleCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsReady, setCardsReady] = useState(false);
  const isInitialFilterApplyRef = useRef(true);

  const collection = useUserCollection(selectedFormat, targetUserId);
  const favorites = useUserCardList('user_favorites_v2', selectedFormat, targetUserId);
  const wishlist = useUserCardList('user_wishlist_v2', selectedFormat, targetUserId);

  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const handlePageChange = (page: number) => {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (page <= 1) next.delete('page');
      else next.set('page', page.toString());
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    setCardsLoading(true);
    setCardsReady(false);
    setFilteredCards([]);
    isInitialFilterApplyRef.current = true;
    loadCollectionCards(selectedFormat)
      .then((data: CollectionCatalog) => {
        setAllCards(data.data.CardCatalog.cards);
        setFilteredCards(toSimpleCards(data.data.CardCatalog.cards));
        setCardsLoading(false);
      })
      .catch(() => setCardsLoading(false));
  }, [selectedFormat]);

  const { loadedFormat: collectionLoadedFormat, loadCollection } = collection;
  const { loadedFormat: favoritesLoadedFormat, loadList: loadFavorites } = favorites;
  const { loadedFormat: wishlistLoadedFormat, loadList: loadWishlist } = wishlist;

  useEffect(() => {
    if (targetUserId && collectionLoadedFormat !== selectedFormat) {
      loadCollection();
    }
  }, [targetUserId, selectedFormat, collectionLoadedFormat, loadCollection]);

  useEffect(() => {
    if (targetUserId && favoritesLoadedFormat !== selectedFormat) {
      loadFavorites();
    }
  }, [targetUserId, selectedFormat, favoritesLoadedFormat, loadFavorites]);

  useEffect(() => {
    if (targetUserId && wishlistLoadedFormat !== selectedFormat) {
      loadWishlist();
    }
  }, [targetUserId, selectedFormat, wishlistLoadedFormat, loadWishlist]);

  const handleFilterChange = (cards: CollectionCard[], params: FilterParams) => {
    setCardsReady(true);
    setFilteredCards(toSimpleCards(cards));
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.set('format', selectedFormat);
      next.set('section', cardSection);
      if (params.edition) next.set('edition', params.edition); else next.delete('edition');
      if (params.product) next.set('product', params.product); else next.delete('product');
      if (params.q) next.set('q', params.q); else next.delete('q');
      if (params.type) next.set('type', params.type); else next.delete('type');
      if (params.race) next.set('race', params.race); else next.delete('race');
      if (params.freq) next.set('freq', params.freq); else next.delete('freq');
      if (!isInitialFilterApplyRef.current) next.delete('page');
      return next;
    }, { replace: true });
    isInitialFilterApplyRef.current = false;
  };

  const selectSection = (section: CardSection) => {
    setCardSection(section);
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.set('section', section);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const selectFormat = (format: CollectionFormat) => {
    setSelectedFormat(format);
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.set('format', format);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const visibleCards = useMemo(() => {
    if (cardSection === 'collection') {
      return filteredCards.filter((card) => collection.ownedCardIds.has(card.id));
    }
    if (cardSection === 'favorites') {
      return filteredCards.filter((card) => favorites.cardIds.has(card.id));
    }
    return filteredCards.filter((card) => wishlist.cardIds.has(card.id));
  }, [filteredCards, cardSection, collection.ownedCardIds, favorites.cardIds, wishlist.cardIds]);

  const modalCards = useMemo(() => {
    const cardsById = new Map(allCards.map((card) => [card.id, card]));
    return visibleCards
      .map((card) => cardsById.get(card.id))
      .filter((card): card is CollectionCard => Boolean(card));
  }, [allCards, visibleCards]);

  const findCard = (cardId: number) =>
    modalCards.find((item) => item.id === cardId) ?? allCards.find((item) => item.id === cardId);

  return {
    selectedFormat, selectFormat, cardSection, selectSection,
    allCards, cardsLoading, cardsReady, visibleCards, handleFilterChange, findCard,
    collection, favorites, wishlist, pageFromUrl, handlePageChange,
  };
}

export type ProfileCards = ReturnType<typeof useProfileCards>;
