import { useState, useEffect } from 'react';
import { CollectionFormat, CollectionCard, CollectionCatalog } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import CardGrid, { type SimpleCard } from '../components/CardGrid';
import CardDetailModal from '../components/CardDetailModal';
import EditionSidebar from '../components/EditionSidebar';
import PBEditionSidebar from '../components/PBEditionSidebar';
import styles from './CollectionPage.module.css';

const CollectionPage = () => {
  const [selectedFormat, setSelectedFormat] = useState<CollectionFormat>(CollectionFormat.PRIMER_BLOQUE);
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<SimpleCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarFilteredCards, setSidebarFilteredCards] = useState<CollectionCard[]>([]);
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<SimpleCard | null>(null);

  useEffect(() => {
    setLoading(true);
    loadCollectionCards(selectedFormat)
      .then((data: CollectionCatalog) => {
        setAllCards(data.data.CardCatalog.cards);
        setSidebarFilteredCards(data.data.CardCatalog.cards);
        setSearchTerm('');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading collection:', err);
        setLoading(false);
      });
  }, [selectedFormat]);

  useEffect(() => {
    setSidebarOpen(false);
    setActiveFilterLabel(null);
  }, [selectedFormat]);

  useEffect(() => {
    let filtered = sidebarFilteredCards;

    if (searchTerm.trim()) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const simpleCards = filtered.map(card => ({
      id: card.id,
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
  }, [searchTerm, sidebarFilteredCards]);

  const handleFilterChange = (data: { cards: CollectionCard[], filterLabel: string | null }) => {
    setSidebarFilteredCards(data.cards);
    setActiveFilterLabel(data.filterLabel);
  };

  const getFormatLabel = (format: CollectionFormat): string => {
    switch (format) {
      case CollectionFormat.PRIMER_BLOQUE:
        return 'Primer Bloque';
      case CollectionFormat.FURIA_EXTENDIDO:
        return 'Furia Extendido';
    }
  };

  return (
    <div className={styles.container}>

      <div className={styles.mobileHeader}>
        <button 
          className={styles.hamburger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div className={styles.mobileHeaderContent}>
          <h2 className={styles.mobileTitle}>{getFormatLabel(selectedFormat)}</h2>
          {activeFilterLabel && !sidebarOpen && (
            <div className={styles.mobileFilterBadge}>
              {activeFilterLabel}
            </div>
          )}
        </div>
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
            onClick={() => setSelectedFormat(format)}
          >
            {getFormatLabel(format)}
          </button>
        ))}
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando cartas...</div>
      ) : (
        <div className={`${styles.content} ${styles.withSidebar}`}>
          {selectedFormat === CollectionFormat.PRIMER_BLOQUE ? (
            <>
              <PBEditionSidebar 
                key="pb-sidebar"
                cards={allCards} 
                onFilterChange={handleFilterChange}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <CardGrid cards={filteredCards} onCardClick={setSelectedCard} />
            </>
          ) : (
            <>
              <EditionSidebar 
                key="fx-sidebar"
                cards={allCards} 
                onFilterChange={handleFilterChange}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <CardGrid cards={filteredCards} onCardClick={setSelectedCard} />
            </>
          )}
        </div>
      )}

      <div className={styles.stats}>
        {searchTerm && `Búsqueda: "${searchTerm}" • `}
        Mostrando {filteredCards.length} de {allCards.length} cartas
      </div>

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default CollectionPage;
