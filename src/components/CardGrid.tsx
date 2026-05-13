import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './CardGrid.module.css';

export interface SimpleCard {
  id: number;
  slug: string;
  name: string;
  imageUrl: string;
  collectorCode: string;
  type: string;
  cost: number;
  attack: number;
  effect?: string;
  flavor?: string;
  artist: string;
  productName?: string;
}

interface CardGridProps {
  cards: SimpleCard[];
  format: string;
  cardsPerPage?: number;
  ownedCardIds?: Set<number>;
  onToggleOwned?: (cardId: number) => void;
}

export default function CardGrid({ cards, format, cardsPerPage = 100, ownedCardIds, onToggleOwned }: CardGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedCards, setPaginatedCards] = useState<SimpleCard[]>([]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    setPaginatedCards(cards.slice(startIndex, endIndex));
  }, [currentPage, cards, cardsPerPage]);

  const totalPages = Math.ceil(cards.length / cardsPerPage);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {paginatedCards.map((card) => {
          const isOwned = ownedCardIds?.has(card.id) ?? false;
          const detailPath = `/coleccion/carta/${format}/${card.id}/${card.slug}`;
          const showActions = Boolean(onToggleOwned);
          return (
            <div key={card.id} className={`${styles.cardItem} ${isOwned ? styles.cardOwned : ''}`}>
              <Link to={detailPath} className={styles.cardLink}>
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className={styles.cardImage}
                  />
                ) : (
                  <div className={styles.placeholder}>Sin imagen</div>
                )}
                <div className={styles.cardInfo}>
                  <h4>{card.name}</h4>
                  <span className={styles.cardCode}>{card.collectorCode}</span>
                </div>
              </Link>

              {showActions && (
                <div className={styles.actionsOverlay}>
                  <Link to={detailPath} className={`${styles.actionButton} ${styles.actionView}`}>
                    Ver Carta
                  </Link>
                  <button
                    className={`${styles.actionButton} ${styles.actionAdd}`}
                    onClick={(e) => { e.preventDefault(); onToggleOwned?.(card.id); }}
                    disabled={isOwned}
                  >
                    Agregar a Carpeta
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.actionRemove}`}
                    onClick={(e) => { e.preventDefault(); onToggleOwned?.(card.id); }}
                    disabled={!isOwned}
                  >
                    Quitar de Carpeta
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            ← Primera
          </button>
          
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Anterior
          </button>

          <div className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Siguiente
          </button>

          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Última →
          </button>
        </div>
      )}
    </div>
  );
}
