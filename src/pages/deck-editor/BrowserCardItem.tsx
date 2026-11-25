import { CollectionCard } from '../../types/collection';
import { DeckTarget } from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

interface BrowserCardItemProps {
  card: CollectionCard;
  target: DeckTarget;
  mainCount: number;
  sideCount: number;
  groupCount: number;
  hardMax: number;
  canAddMore: boolean;
  isInCollection: boolean;
  onSelect: (card: CollectionCard) => void;
  onAdd: (card: CollectionCard) => void;
  onRemove: (cardId: number) => void;
}

export default function BrowserCardItem({
  card, target, mainCount: count, sideCount, groupCount, hardMax, canAddMore, isInCollection,
  onSelect, onAdd, onRemove,
}: BrowserCardItemProps) {
  const targetCount = target === 'side' ? sideCount : count;
  const isBanned = hardMax === 0;
  const isUnique = card.unique === true;
  const maxLabel = hardMax === Infinity ? '∞' : String(hardMax);
  return (
    <div
      className={`${styles.cardItem} ${count > 0 ? styles.cardInDeck : ''} ${sideCount > 0 ? styles.cardInSide : ''} ${isBanned ? styles.cardBanned : ''}`}
    >
      <div
        className={styles.cardImageWrapper}
        onClick={() => onSelect(card)}
        title="Ver detalle"
        style={{ cursor: 'pointer' }}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={styles.cardImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.cardPlaceholder}>{card.name}</div>
        )}
        {count > 0 && (
          <div className={styles.cardCountBadge}>{count}</div>
        )}
        {sideCount > 0 && (
          <div className={styles.cardSideBadge} title={`${sideCount} en sidedeck`}>S{sideCount}</div>
        )}
        {isBanned && (
          <div className={styles.bannedOverlay}>PROHIBIDA</div>
        )}
        {isUnique && (
          <div className={styles.uniqueBadge}>ÚNICA</div>
        )}
        {isInCollection && (
          <div className={styles.collectionBadge}>En colección</div>
        )}
      </div>
      <div className={styles.cardControls}>
        <button
          className={styles.btnMinus}
          onClick={() => onRemove(card.id)}
          disabled={targetCount === 0}
          title={target === 'side' ? 'Quitar del sidedeck' : 'Quitar del mazo'}
        >
          −
        </button>
        <span className={styles.cardCountText}>
          {groupCount}/{maxLabel}
        </span>
        <button
          className={styles.btnPlus}
          onClick={() => onAdd(card)}
          disabled={!canAddMore}
          title={target === 'side' ? 'Agregar al sidedeck' : 'Agregar al mazo'}
        >
          +
        </button>
      </div>
    </div>
  );
}
