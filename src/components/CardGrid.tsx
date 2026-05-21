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
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

interface ParsedCollectorCode {
  priorityGroup: number;
  editionCode: string;
  number: number;
  suffix: string;
}

const parseCollectorCode = (code: string): ParsedCollectorCode => {
  const original = (code || '').toUpperCase().trim();
  const cleaned = original.replace(/\s+[A-Z]+\s*$/, '').trim();
  const startsWithNumber = /^\d/.test(cleaned);

  const dashIndex = cleaned.indexOf('-');
  const editionCode = dashIndex >= 0 ? cleaned.slice(0, dashIndex).trim() : cleaned.replace(/\d.*$/, '').trim();
  const remainder = dashIndex >= 0 ? cleaned.slice(dashIndex + 1).trim() : cleaned;
  const cardNumberText = remainder.split('/')[0].trim();
  const cardNumberMatch = cardNumberText.match(/^\d+/);
  const number = cardNumberMatch ? Number(cardNumberMatch[0]) : Number.MAX_SAFE_INTEGER;
  const suffix = remainder.split('/')[1]?.trim() ?? '';

  return {
    priorityGroup: startsWithNumber ? 0 : 1,
    editionCode,
    number,
    suffix,
  };
};

const compareByCollectorCode = (a: SimpleCard, b: SimpleCard): number => {
  const aParsed = parseCollectorCode(a.collectorCode);
  const bParsed = parseCollectorCode(b.collectorCode);

  if (aParsed.priorityGroup !== bParsed.priorityGroup) {
    return aParsed.priorityGroup - bParsed.priorityGroup;
  }

  const editionComparison = aParsed.editionCode.localeCompare(bParsed.editionCode, 'es', { sensitivity: 'base' });
  if (editionComparison !== 0) {
    return editionComparison;
  }

  if (aParsed.number !== bParsed.number) {
    return aParsed.number - bParsed.number;
  }

  if (aParsed.suffix !== bParsed.suffix) {
    return aParsed.suffix.localeCompare(bParsed.suffix, 'es', { sensitivity: 'base' });
  }

  return a.collectorCode.localeCompare(b.collectorCode, 'es', { sensitivity: 'base' });
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
  currentPage = 1,
  onPageChange,
}: CardGridProps) {
  const [paginatedCards, setPaginatedCards] = useState<SimpleCard[]>([]);

  const sortedCards = useMemo(() => {
    return [...cards].sort(compareByCollectorCode);
  }, [cards]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    setPaginatedCards(sortedCards.slice(startIndex, endIndex));
  }, [currentPage, sortedCards, cardsPerPage]);

  const goToPage = (page: number) => {
    onPageChange?.(page);
  };

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
                  {showCopyCount && <span className={styles.copyCount}>Tienes {copyCount} copias en tu Carpeta</span>}
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
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            ← Primera
          </button>
          
          <button 
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Anterior
          </button>

          <div className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </div>

          <button 
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Siguiente
          </button>

          <button 
            onClick={() => goToPage(totalPages)}
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
