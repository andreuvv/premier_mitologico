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

  const handleFilterChange = (filtered: CollectionCard[]) => {
    setSidebarFilteredCards(filtered);
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
              <PBEditionSidebar cards={allCards} onFilterChange={handleFilterChange} />
              <CardGrid cards={filteredCards} />
            </>
          ) : (
            <>
              <EditionSidebar cards={allCards} onFilterChange={handleFilterChange} />
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
