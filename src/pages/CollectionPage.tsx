import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollectionFormat, CollectionCard, CollectionCatalog } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import CardGrid, { type SimpleCard } from '../components/CardGrid';
import CollectionFilters, { type FilterParams } from '../components/CollectionFilters';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import { useScrollRestore } from '../hooks/useScrollRestore';
import CardDetailModal from '../components/CardDetailModal';
import styles from './CollectionPage.module.css';

const CollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [selectedFormat, setSelectedFormat] = useState<CollectionFormat>(
    searchParams.get('format') === CollectionFormat.FURIA_EXTENDIDO
      ? CollectionFormat.FURIA_EXTENDIDO
      : CollectionFormat.PRIMER_BLOQUE
  );
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<SimpleCard[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  // True once CollectionFilters has called onFilterChange at least once,
  // meaning the final filtered card set is ready to display.
  const [cardsReady, setCardsReady] = useState(false);
  // True only for the very first handleFilterChange call after a format load.
  // Used to avoid deleting ?page when cards first load (e.g. after back-navigation).
  const isInitialFilterApplyRef = useRef(true);

  const { ownedCardIds, cardCopies, loadedFormat, loadCollection, addCopy, removeCopy } = useUserCollection(selectedFormat);

  useScrollRestore(cardsReady);

  // Page number is stored in the URL (?page=N) so browser history preserves it
  // automatically when the user navigates back.
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const handlePageChange = (page: number) => {
    setSearchParams(p => {
      const next = new URLSearchParams(p);
      if (page <= 1) next.delete('page');
      else next.set('page', page.toString());
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    setCardsReady(false);
    setFilteredCards([]);
    isInitialFilterApplyRef.current = true;
    loadCollectionCards(selectedFormat)
      .then((data: CollectionCatalog) => {
        setAllCards(data.data.CardCatalog.cards);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading collection:', err);
        setLoading(false);
      });
  }, [selectedFormat]);

  // Load user collection when user or format changes
  useEffect(() => {
    if (user && loadedFormat !== selectedFormat) {
      loadCollection();
    }
  }, [user, selectedFormat, loadedFormat, loadCollection]);

  const handleFilterChange = (cards: CollectionCard[], params: FilterParams) => {
    setCardsReady(true);
    const simpleCards = cards.map(card => ({
      id: card.id,
      slug: card.slug,
      name: card.name,
      imageUrl: card.imageUrl,
      collectorCode: card.collectorCode,
      type: card.type,
      cost: card.cost,
      attack: card.attack,
      effect: card.effect,
      flavor: card.flavor,
      artist: card.artist,
      productName: card.product?.productName ?? card.edition?.name,
    }));
    setFilteredCards(simpleCards);

    setSearchParams(p => {
      const next = new URLSearchParams(p);
      next.set('format', selectedFormat);
      if (params.edition) next.set('edition', params.edition); else next.delete('edition');
      if (params.product) next.set('product', params.product); else next.delete('product');
      if (params.q) next.set('q', params.q); else next.delete('q');
      if (params.type) next.set('type', params.type); else next.delete('type');
      if (params.oro) next.set('oro', params.oro); else next.delete('oro');
      if (params.race) next.set('race', params.race); else next.delete('race');
      if (params.freq) next.set('freq', params.freq); else next.delete('freq');
      // Reset to page 1 when the user changes filters, but not on initial load.
      if (!isInitialFilterApplyRef.current) next.delete('page');
      return next;
    }, { replace: true });
    isInitialFilterApplyRef.current = false;
  };

  const getFormatLabel = (format: CollectionFormat): string => {
    switch (format) {
      case CollectionFormat.PRIMER_BLOQUE: return 'Primer Bloque';
      case CollectionFormat.FURIA_EXTENDIDO: return 'Furia Extendido';
    }
  };

  // Only pass URL filter values back when the URL format matches the active tab.
  const urlFormat = searchParams.get('format') ?? CollectionFormat.PRIMER_BLOQUE;
  const matchesFormat = urlFormat === selectedFormat;

  const modalCards = useMemo(() => {
    const cardsById = new Map(allCards.map((card) => [card.id, card]));
    return filteredCards
      .map((card) => cardsById.get(card.id))
      .filter((card): card is CollectionCard => Boolean(card));
  }, [allCards, filteredCards]);

  const handleViewCard = (cardId: number) => {
    const card = modalCards.find((item) => item.id === cardId) ?? allCards.find((item) => item.id === cardId);
    if (!card) return;
    setSelectedCard(card);
  };

  return (
    <div className={styles.container}>

      <div className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Abrir filtros"
        >
          ☰
        </button>
        <h2 className={styles.mobileTitle}>{getFormatLabel(selectedFormat)}</h2>
      </div>

      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={styles.formatTabs}>
        {Object.values(CollectionFormat).map(format => (
          <button
            key={format}
            className={`${styles.tab} ${selectedFormat === format ? styles.active : ''}`}
            onClick={() => {
              setSelectedFormat(format);
              setSidebarOpen(false);
              setSearchParams(() => {
                const next = new URLSearchParams();
                next.set('format', format);
                return next;
              }, { replace: true });
            }}
          >
            {getFormatLabel(format)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando cartas...</div>
      ) : (
        <div className={`${styles.content} ${styles.withSidebar}`}>
          <CollectionFilters
            key={selectedFormat}
            allCards={allCards}
            format={selectedFormat}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onFilterChange={handleFilterChange}
            initialEdition={matchesFormat ? searchParams.get('edition') : null}
            initialProduct={matchesFormat ? searchParams.get('product') : null}
            initialSearch={matchesFormat ? searchParams.get('q') : null}
            initialType={matchesFormat ? searchParams.get('type') : null}
            initialOro={matchesFormat ? (searchParams.get('oro') as 'all' | 'with' | 'without' | null) : null}
            initialRace={matchesFormat ? searchParams.get('race') : null}
            initialFreq={matchesFormat ? searchParams.get('freq') : null}
          />
          <div className={styles.gridArea}>
            {cardsReady && (
              <CardGrid
                cards={filteredCards}
                format={selectedFormat}
                ownedCardIds={user ? ownedCardIds : undefined}
                cardCopies={user ? cardCopies : undefined}
                onViewCard={handleViewCard}
                onAddCopy={user ? addCopy : undefined}
                onRemoveCopy={user ? removeCopy : undefined}
                showCopyCount={Boolean(user)}
                currentPage={pageFromUrl}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      )}

      <div className={styles.stats}>
        Mostrando {filteredCards.length} de {allCards.length} cartas
      </div>

      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};

export default CollectionPage;
