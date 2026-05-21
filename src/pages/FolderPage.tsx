import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollectionCatalog, CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import CardGrid, { type SimpleCard } from '../components/CardGrid';
import CollectionFilters, { type FilterParams } from '../components/CollectionFilters';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import { useScrollRestore } from '../hooks/useScrollRestore';
import styles from './CollectionPage.module.css';

const toSimpleCards = (cards: CollectionCard[]): SimpleCard[] => {
  return cards.map(card => ({
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
};

const FolderPage = () => {
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
  const [showOwnedOnly, setShowOwnedOnly] = useState(searchParams.get('owned') === '1');
  const [showNotOwnedOnly, setShowNotOwnedOnly] = useState(searchParams.get('notOwned') === '1');
  // True once CollectionFilters has called onFilterChange at least once.
  const [cardsReady, setCardsReady] = useState(false);
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
        setFilteredCards(toSimpleCards(data.data.CardCatalog.cards));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading cards for folder:', err);
        setLoading(false);
      });
  }, [selectedFormat]);

  useEffect(() => {
    if (user && loadedFormat !== selectedFormat) {
      loadCollection();
    }
  }, [user, loadedFormat, selectedFormat, loadCollection]);

  const handleFilterChange = (cards: CollectionCard[], params: FilterParams) => {
    setCardsReady(true);
    const simpleCards = toSimpleCards(cards);
    setFilteredCards(simpleCards);
    setShowOwnedOnly(params.ownedOnly === true);
    setShowNotOwnedOnly(params.notOwnedOnly === true);

    setSearchParams(p => {
      const next = new URLSearchParams(p);
      next.set('format', selectedFormat);
      if (params.edition) next.set('edition', params.edition); else next.delete('edition');
      if (params.product) next.set('product', params.product); else next.delete('product');
      if (params.q) next.set('q', params.q); else next.delete('q');
      if (params.type) next.set('type', params.type); else next.delete('type');
      if (params.race) next.set('race', params.race); else next.delete('race');
      if (params.freq) next.set('freq', params.freq); else next.delete('freq');
      if (params.ownedOnly) next.set('owned', '1'); else next.delete('owned');
      if (params.notOwnedOnly) next.set('notOwned', '1'); else next.delete('notOwned');
      if (!isInitialFilterApplyRef.current) next.delete('page');
      return next;
    }, { replace: true });
    isInitialFilterApplyRef.current = false;
  };

  const ownedCards = useMemo(() => {
    return filteredCards.filter(card => ownedCardIds.has(card.id));
  }, [filteredCards, ownedCardIds]);

  const ownedTotalByFormat = useMemo(() => {
    return allCards.filter(card => ownedCardIds.has(card.id)).length;
  }, [allCards, ownedCardIds]);

  const visibleCards = useMemo(() => {
    if (showOwnedOnly) return filteredCards.filter(card => ownedCardIds.has(card.id));
    if (showNotOwnedOnly) return filteredCards.filter(card => !ownedCardIds.has(card.id));
    return filteredCards;
  }, [filteredCards, ownedCardIds, showOwnedOnly, showNotOwnedOnly]);

  const getFormatLabel = (format: CollectionFormat): string => {
    switch (format) {
      case CollectionFormat.PRIMER_BLOQUE:
        return 'Primer Bloque';
      case CollectionFormat.FURIA_EXTENDIDO:
        return 'Furia Extendido';
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Carpeta</h2>
          <p>Inicia sesión para ver y administrar tu Carpeta de cartas.</p>
        </div>
      </div>
    );
  }

  const urlFormat = searchParams.get('format') ?? CollectionFormat.PRIMER_BLOQUE;
  const matchesFormat = urlFormat === selectedFormat;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Carpeta</h1>
        <p>Tu colección personal de cartas guardadas</p>
      </div>

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
        <div className={styles.loading}>Cargando carpeta...</div>
      ) : (
        <div className={`${styles.content} ${styles.withSidebar}`}>
          <CollectionFilters
            key={`folder-${selectedFormat}`}
            allCards={allCards}
            format={selectedFormat}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onFilterChange={handleFilterChange}
            initialEdition={matchesFormat ? searchParams.get('edition') : null}
            initialProduct={matchesFormat ? searchParams.get('product') : null}
            initialSearch={matchesFormat ? searchParams.get('q') : null}
            initialType={matchesFormat ? searchParams.get('type') : null}
            initialRace={matchesFormat ? searchParams.get('race') : null}
            initialFreq={matchesFormat ? searchParams.get('freq') : null}
            initialOwnedOnly={matchesFormat ? searchParams.get('owned') === '1' : false}
            initialNotOwnedOnly={matchesFormat ? searchParams.get('notOwned') === '1' : false}
            showOwnedOnlyToggle={true}
          />
          <div className={styles.gridArea}>
            {!cardsReady ? null : visibleCards.length === 0 ? (
              <div className={styles.stats}>
                No hay cartas para los filtros actuales en {getFormatLabel(selectedFormat)}.
              </div>
            ) : (
              <CardGrid
                cards={visibleCards}
                format={selectedFormat}
                ownedCardIds={ownedCardIds}
                cardCopies={cardCopies}
                onAddCopy={addCopy}
                onRemoveCopy={removeCopy}
                showUnownedMuted={true}
                showCopyCount={true}
                currentPage={pageFromUrl}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      )}

      <div className={styles.stats}>
        Mostrando {ownedCards.length} de {ownedTotalByFormat} cartas en tu Carpeta ({getFormatLabel(selectedFormat)})
      </div>
    </div>
  );
};

export default FolderPage;
