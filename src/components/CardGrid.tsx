import { useState, useEffect, useMemo, Fragment, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import CardActionsMenu from './CardActionsMenu';
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
  favoriteCardIds?: Set<number>;
  wishlistCardIds?: Set<number>;
  onViewCard?: (cardId: number) => void;
  onAddCopy?: (cardId: number) => void;
  onRemoveCopy?: (cardId: number) => void;
  onSetCopies?: (cardId: number, count: number) => void;
  onToggleFavorite?: (cardId: number) => void;
  onToggleWishlist?: (cardId: number) => void;
  showUnownedMuted?: boolean;
  showCopyCount?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

interface CopyStepperProps {
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  onSet: (count: number) => void;
}

function CopyStepper({ count, onAdd, onRemove, onSet }: CopyStepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(count));

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 0 && n !== count) {
      onSet(n);
    }
    setEditing(false);
  };

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={`${styles.stepperBtn} ${styles.stepperBtnRemove}`}
        onClick={onRemove}
        disabled={count <= 0}
        aria-label="Quitar una copia"
      >
        −
      </button>
      {editing ? (
        <input
          type="number"
          min={0}
          className={styles.stepperInput}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          className={styles.stepperLabel}
          onClick={() => {
            setDraft(String(count));
            setEditing(true);
          }}
          aria-label="Editar cantidad en Carpeta"
        >
          {count} en Carpeta
        </button>
      )}
      <button
        type="button"
        className={`${styles.stepperBtn} ${styles.stepperBtnAdd}`}
        onClick={onAdd}
        aria-label="Agregar una copia"
      >
        +
      </button>
    </div>
  );
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

const PAGE_SIZE_OPTIONS = [100, 200, 300, 400, 500] as const;
type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];

function readSavedPerPage(defaultSize: number): PageSizeOption {
  const raw = localStorage.getItem('myl_cardsPerPage');
  const n = raw ? parseInt(raw, 10) : NaN;
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? (n as PageSizeOption) : (defaultSize as PageSizeOption);
}

export default function CardGrid({
  cards,
  format,
  cardsPerPage = 100,
  ownedCardIds,
  cardCopies,
  favoriteCardIds,
  wishlistCardIds,
  onViewCard,
  onAddCopy,
  onRemoveCopy,
  onSetCopies,
  onToggleFavorite,
  onToggleWishlist,
  showUnownedMuted = false,
  showCopyCount = false,
  currentPage = 1,
  onPageChange,
}: CardGridProps) {
  const [perPage, setPerPage] = useState<PageSizeOption>(() => readSavedPerPage(cardsPerPage));
  const [paginatedCards, setPaginatedCards] = useState<SimpleCard[]>([]);

  const sortedCards = useMemo(() => {
    return [...cards].sort(compareByCollectorCode);
  }, [cards]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    setPaginatedCards(sortedCards.slice(startIndex, endIndex));
  }, [currentPage, sortedCards, perPage]);

  const handlePerPageChange = (newPerPage: PageSizeOption) => {
    localStorage.setItem('myl_cardsPerPage', newPerPage.toString());
    setPerPage(newPerPage);
    onPageChange?.(1);
  };

  const goToPage = (page: number) => {
    onPageChange?.(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const totalPages = Math.ceil(sortedCards.length / perPage);

  return (
    <div className={styles.container}>
      <div className={styles.perPageSelector}>
        <span>Mostrando</span>
        {PAGE_SIZE_OPTIONS.map((n, i) => (
          <Fragment key={n}>
            {i > 0 && <span className={styles.perPageDivider}>|</span>}
            <button
              className={`${styles.perPageOption} ${perPage === n ? styles.perPageActive : ''}`}
              onClick={() => handlePerPageChange(n)}
            >
              {n}
            </button>
          </Fragment>
        ))}
        <span>cartas por página</span>
      </div>
      <div className={styles.grid}>
        {paginatedCards.map((card) => {
          const copyCount = cardCopies?.get(card.id) ?? ((ownedCardIds?.has(card.id) ?? false) ? 1 : 0);
          const isOwned = copyCount > 0;
          const detailPath = `/coleccion/carta/${format}/${card.id}/${card.slug}`;
          const isMutedUnowned = showUnownedMuted && !isOwned;
          const showStepper = showCopyCount && Boolean(onSetCopies && onAddCopy && onRemoveCopy);

          const handleViewCard = (e: MouseEvent<HTMLAnchorElement>) => {
            if (!onViewCard) return;
            e.preventDefault();
            onViewCard(card.id);
          };

          return (
            <div key={card.id} className={`${styles.cardItem} ${isOwned ? styles.cardOwned : ''} ${isMutedUnowned ? styles.cardUnownedMuted : ''}`}>
              <Link to={detailPath} className={styles.cardImageLink} onClick={handleViewCard}>
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className={styles.cardImage}
                  />
                ) : (
                  <div className={styles.placeholder}>Sin imagen</div>
                )}
                {isMutedUnowned && <div className={styles.unownedOverlay} aria-hidden="true" />}
              </Link>

              <div className={`${styles.cardInfo} ${isOwned ? styles.cardInfoOwned : ''}`}>
                <div className={styles.cardInfoHeader}>
                  <CardActionsMenu
                    isOwned={isOwned}
                    isFavorite={favoriteCardIds?.has(card.id) ?? false}
                    isWishlisted={wishlistCardIds?.has(card.id) ?? false}
                    onViewCard={onViewCard ? () => onViewCard(card.id) : undefined}
                    onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(card.id) : undefined}
                    onToggleWishlist={onToggleWishlist ? () => onToggleWishlist(card.id) : undefined}
                    onAddToFolder={onAddCopy ? () => onAddCopy(card.id) : undefined}
                    onRemoveFromFolder={onSetCopies ? () => onSetCopies(card.id, 0) : undefined}
                  />
                  <Link to={detailPath} className={styles.cardTitleLink} onClick={handleViewCard}>
                    <h4>{card.name}</h4>
                    <span className={styles.cardCode}>{card.collectorCode}</span>
                  </Link>
                </div>
                {showStepper && onAddCopy && onRemoveCopy && onSetCopies && (
                  <CopyStepper
                    count={copyCount}
                    onAdd={() => onAddCopy(card.id)}
                    onRemove={() => onRemoveCopy(card.id)}
                    onSet={(n) => onSetCopies(card.id, n)}
                  />
                )}
              </div>
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
