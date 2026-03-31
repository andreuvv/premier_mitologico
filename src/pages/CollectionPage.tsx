import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollectionFormat, CollectionCard, CollectionCatalog } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import CardGrid, { type SimpleCard } from '../components/CardGrid';
import CollectionFilters, { type FilterParams } from '../components/CollectionFilters';
import styles from './CollectionPage.module.css';

const CollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedFormat, setSelectedFormat] = useState<CollectionFormat>(
    searchParams.get('format') === CollectionFormat.FURIA_EXTENDIDO
      ? CollectionFormat.FURIA_EXTENDIDO
      : CollectionFormat.PRIMER_BLOQUE
  );
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<SimpleCard[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setFilteredCards([]);
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

  const handleFilterChange = (cards: CollectionCard[], params: FilterParams) => {
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
      if (params.race) next.set('race', params.race); else next.delete('race');
      if (params.freq) next.set('freq', params.freq); else next.delete('freq');
      return next;
    }, { replace: true });
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
              });
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
            initialRace={matchesFormat ? searchParams.get('race') : null}
            initialFreq={matchesFormat ? searchParams.get('freq') : null}
          />
          <CardGrid cards={filteredCards} format={selectedFormat} />
        </div>
      )}

      <div className={styles.stats}>
        Mostrando {filteredCards.length} de {allCards.length} cartas
      </div>
    </div>
  );
};

export default CollectionPage;
