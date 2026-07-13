import { useState, useEffect, useMemo, Fragment, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import CardActionsMenu from './CardActionsMenu';
import { sortSimpleCards } from '../utils/cardSorting';
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
  categorySortOrder?: number;
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
  sortByCategoryOrder?: boolean;
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
  sortByCategoryOrder = false,
}: CardGridProps) {
  const [perPage, setPerPage] = useState<PageSizeOption>(() => readSavedPerPage(cardsPerPage));
  const [paginatedCards, setPaginatedCards] = useState<SimpleCard[]>([]);

  const sortedCards = useMemo(() => {
    return sortSimpleCards(cards, sortByCategoryOrder);
  }, [cards, sortByCategoryOrder]);

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
        <div className={styles.perPageButtons}>
          {PAGE_SIZE_OPTIONS.map((n, i) => (
            <Fragment key={n}>
              {i > 0 && <span className={styles.perPageDivider}>|</span>}
              <button
                type="button"
                className={`${styles.perPageOption} ${perPage === n ? styles.perPageActive : ''}`}
                onClick={() => handlePerPageChange(n)}
              >
                {n}
              </button>
            </Fragment>
          ))}
        </div>
        <select
          className={styles.perPageSelect}
          value={perPage}
          aria-label="Cartas por página"
          onChange={(e) => handlePerPageChange(Number(e.target.value) as PageSizeOption)}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
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
