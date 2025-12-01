import { useState, useEffect } from 'react';
import { BanListFormat, BanListCategory, BanListData, BanListCard } from '../types/banlist';
import { loadBanlist } from '../services/banlistService';
import styles from './BanlistPage.module.css';

const BanlistPage = () => {
  const [selectedFormat, setSelectedFormat] = useState<BanListFormat>(BanListFormat.PRIMER_BLOQUE_LIBRE);
  const [selectedCategory, setSelectedCategory] = useState<BanListCategory>(BanListCategory.BANNED);
  const [banlistData, setBanlistData] = useState<BanListData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadBanlist(selectedFormat)
      .then(data => {
        setBanlistData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading banlist:', err);
        setLoading(false);
      });
  }, [selectedFormat]);

  const getFormatLabel = (format: BanListFormat): string => {
    switch (format) {
      case BanListFormat.PRIMER_BLOQUE_LIBRE:
        return 'Primer Bloque Racial Libre';
      case BanListFormat.PRIMER_BLOQUE_EDICION:
        return 'Primer Bloque Racial Edición';
      case BanListFormat.BLOQUE_FURIA_LIBRE:
        return 'Bloque Furia Racial Libre';
      case BanListFormat.BLOQUE_FURIA_LIMITED:
        return 'Bloque Furia Limitado';
    }
  };

  const getCategoryLabel = (category: BanListCategory): string => {
    switch (category) {
      case BanListCategory.BANNED:
        return 'Baneadas';
      case BanListCategory.LIMITED_X1:
        return 'Limitadas x1';
      case BanListCategory.LIMITED_X2:
        return 'Limitadas x2';
    }
  };

  const getCurrentCards = (): BanListCard[] => {
    if (!banlistData) return [];
    switch (selectedCategory) {
      case BanListCategory.BANNED:
        return banlistData.banned;
      case BanListCategory.LIMITED_X1:
        return banlistData.limitedX1;
      case BanListCategory.LIMITED_X2:
        return banlistData.limitedX2;
    }
  };

  const cards = getCurrentCards();

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.formatSelector}>
          <label>Formato:</label>
          <select 
            value={selectedFormat} 
            onChange={(e) => setSelectedFormat(e.target.value as BanListFormat)}
          >
            {Object.values(BanListFormat).map(format => (
              <option key={format} value={format}>
                {getFormatLabel(format)}
              </option>
            ))}
          </select>
          {banlistData && (
            <p className={styles.lastUpdated}>
              Última actualización: {new Date(banlistData.lastUpdated).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
            </p>
          )}
        </div>

        <div className={styles.categoryTabs}>
          {Object.values(BanListCategory).map(category => (
            <button
              key={category}
              className={selectedCategory === category ? styles.activeTab : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : (
        <div className={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div key={index} className={styles.card}>
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} />
              ) : (
                <div className={styles.placeholder}>Sin imagen</div>
              )}
              <div className={styles.cardInfo}>
                <h3>{card.name}</h3>
                <p>{card.type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BanlistPage;
