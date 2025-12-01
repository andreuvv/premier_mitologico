import { useState, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { BanListFormat, BanListCategory, BanListData, BanListCard } from '../types/banlist';
import { loadBanlist } from '../services/banlistService';
import styles from './BanlistPage.module.css';

const BanlistPage = () => {
  const [selectedFormat, setSelectedFormat] = useState<BanListFormat>(BanListFormat.PRIMER_BLOQUE_LIBRE);
  const [selectedCategory, setSelectedCategory] = useState<BanListCategory>(BanListCategory.BANNED);
  const [banlistData, setBanlistData] = useState<BanListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

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
            <div className={styles.lastUpdatedWrapper}>
              <p className={styles.lastUpdated}>
                Última actualización: {new Date(banlistData.lastUpdated).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
              </p>
              <div className={styles.infoIconContainer}>
                <FaInfoCircle 
                  className={styles.infoIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoPopup(!showInfoPopup);
                  }}
                />
                <div className={styles.tooltip}>
                   Información importante de las restricciones.
                </div>
              </div>
            </div>
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

      {showInfoPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowInfoPopup(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>Información de Banlist</h3>
              <button onClick={() => setShowInfoPopup(false)}>×</button>
            </div>
            <div className={styles.popupContent}>
              <p><strong>Para todos los formatos, no se pueden incluir en el mazo:</strong></p>
              <ul>
                <li>Las cartas de Aliado sin raza</li>
                <li>Las cartas con "SP" en su nombre</li>
                <li>Las cartas con ★ en su nombre</li>
              </ul>
              <p> </p>
              <p>Las imágenes usadas son referenciales y pueden o no corresponder a la última versión impresa de la carta.</p>
              <p>Las siguientes restricciones aplican a cualquier versión de la carta.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BanlistPage;
