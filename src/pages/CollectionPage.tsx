import { useState, useEffect } from 'react';
import { CollectionFormat, CollectionCard, CollectionCatalog } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import CardGrid from '../components/CardGrid';
import EditionSidebar from '../components/EditionSidebar';
import PBEditionSidebar from '../components/PBEditionSidebar';
import styles from './CollectionPage.module.css';

interface SimpleCard {
  id: number;
  name: string;
  imageUrl: string;
}

const CollectionPage = () => {
  const [selectedFormat, setSelectedFormat] = useState<CollectionFormat>(CollectionFormat.PRIMER_BLOQUE);
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<SimpleCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarFilteredCards, setSidebarFilteredCards] = useState<CollectionCard[]>([]);
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      imageUrl: card.imageUrl
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
      <div className={styles.header}>
        <h1>Colección</h1>
        <p>Explora todas las cartas disponibles en cada formato</p>
      </div>

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
              <CardGrid cards={filteredCards} />
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
              <CardGrid cards={filteredCards} />
            </>
          )}
        </div>
      )}

      <div className={styles.stats}>
        {searchTerm && `Búsqueda: "${searchTerm}" • `}
        Mostrando {filteredCards.length} de {allCards.length} cartas
      </div>
    </div>
  );
};

export default CollectionPage;
