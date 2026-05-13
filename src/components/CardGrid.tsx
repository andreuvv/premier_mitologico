import { useState, useEffect, useMemo } from 'react';
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
  cardCopies?: Map<number, number>;
  onToggleOwned?: (cardId: number) => void;
  onAddCopy?: (cardId: number) => void;
  onRemoveCopy?: (cardId: number) => void;
  showUnownedMuted?: boolean;
  showCopyCount?: boolean;
}

const parseCollectorCode = (code: string): { letters: string; number: number } => {
  const normalized = (code || '').toUpperCase();
  const letters = normalized.replace(/[^A-Z]/g, '');
  const numberMatch = normalized.match(/(\d+)/);
  const number = numberMatch ? Number(numberMatch[1]) : Number.MAX_SAFE_INTEGER;
  return { letters, number };
};

const compareByCollectorCode = (a: SimpleCard, b: SimpleCard): number => {
  const aParsed = parseCollectorCode(a.collectorCode);
  const bParsed = parseCollectorCode(b.collectorCode);

  if (aParsed.letters !== bParsed.letters) {
    return aParsed.letters.localeCompare(bParsed.letters, 'es');
  }

  if (aParsed.number !== bParsed.number) {
    return aParsed.number - bParsed.number;
  }

  return a.collectorCode.localeCompare(b.collectorCode, 'es');
};

export default function CardGrid({
  cards,
  format,
  cardsPerPage = 100,
  ownedCardIds,
  cardCopies,
  onToggleOwned,
  onAddCopy,
  onRemoveCopy,
  showUnownedMuted = false,
  showCopyCount = false,
}: CardGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedCards, setPaginatedCards] = useState<SimpleCard[]>([]);

  const sortedCards = useMemo(() => {
    return [...cards].sort(compareByCollectorCode);
  }, [cards]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    setPaginatedCards(sortedCards.slice(startIndex, endIndex));
  }, [currentPage, sortedCards, cardsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedCards, cardsPerPage]);

  const totalPages = Math.ceil(sortedCards.length / cardsPerPage);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {paginatedCards.map((card) => {
          const copyCount = cardCopies?.get(card.id) ?? ((ownedCardIds?.has(card.id) ?? false) ? 1 : 0);
          const isOwned = copyCount > 0;
          const detailPath = `/coleccion/carta/${format}/${card.id}/${card.slug}`;
          const showActions = Boolean(onToggleOwned || onAddCopy || onRemoveCopy);
          const canManageCopies = Boolean(onAddCopy || onRemoveCopy);
          const isMutedUnowned = showUnownedMuted && !isOwned;
          return (
            <div key={card.id} className={`${styles.cardItem} ${isOwned ? styles.cardOwned : ''} ${isMutedUnowned ? styles.cardUnownedMuted : ''}`}>
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
                  {showCopyCount && <span className={styles.copyCount}>Tienes {copyCount} copias</span>}
                </div>
              </Link>

              {isMutedUnowned && <div className={styles.unownedOverlay} aria-hidden="true" />}

              {showActions && (
                <div className={styles.actionsOverlay}>
                  <Link to={detailPath} className={`${styles.actionButton} ${styles.actionView}`}>
                    Ver Carta
                  </Link>
                  <button
                    className={`${styles.actionButton} ${styles.actionAdd}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onAddCopy) {
                        onAddCopy(card.id);
                        return;
                      }
                      onToggleOwned?.(card.id);
                    }}
                    disabled={!onAddCopy && !onToggleOwned}
                  >
                    {canManageCopies ? 'Agregar copia' : 'Agregar a Carpeta'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.actionRemove}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onRemoveCopy) {
                        onRemoveCopy(card.id);
                        return;
                      }
                      onToggleOwned?.(card.id);
                    }}
                    disabled={onRemoveCopy ? copyCount <= 0 : !isOwned}
                  >
                    {canManageCopies ? 'Quitar copia' : 'Quitar de Carpeta'}
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
