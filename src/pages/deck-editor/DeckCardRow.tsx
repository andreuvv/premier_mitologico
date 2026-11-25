import { CollectionCard } from '../../types/collection';
import styles from '../DeckBuilderEditorPage.module.css';

interface DeckCardRowProps {
  card: CollectionCard;
  count: number;
  onSelect: (card: CollectionCard) => void;
  onAdd: (card: CollectionCard) => void;
  onRemove: (cardId: number) => void;
  addDisabled?: boolean;
  /** Only the main deck shows the ★ cover toggle. */
  cover?: { isCover: boolean; onToggle: () => void };
}

export default function DeckCardRow({
  card, count, onSelect, onAdd, onRemove, addDisabled, cover,
}: DeckCardRowProps) {
  const isCover = cover?.isCover ?? false;
  return (
    <div
      className={cover ? `${styles.deckCardRow} ${isCover ? styles.deckCardRowCover : ''}` : styles.deckCardRow}
      onClick={() => onSelect(card)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(card);
        }
      }}
      title="Ver detalle"
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className={styles.deckCardThumb}
      />
      <span className={styles.deckCardName}>{card.name}</span>
      {cover && (
        <button
          className={`${styles.coverBtn} ${isCover ? styles.coverBtnActive : ''}`}
          title={isCover ? 'Quitar portada' : 'Usar como portada'}
          onClick={(e) => {
            e.stopPropagation();
            cover.onToggle();
          }}
        >
          ★
        </button>
      )}
      <div className={styles.deckCardControls}>
        <button
          className={styles.deckMinus}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(card.id);
          }}
        >
          −
        </button>
        <span className={styles.deckCardCount}>{count}</span>
        <button
          className={styles.deckPlus}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(card);
          }}
          disabled={addDisabled}
        >
          +
        </button>
      </div>
    </div>
  );
}
