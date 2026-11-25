import type { CollectionCard } from '../../types/collection';
import styles from '../DeckViewerPage.module.css';

interface CardStackProps {
  card: CollectionCard;
  count: number;
  cardWidth: number;
  stackOffset: number;
  onSelect: (card: CollectionCard) => void;
}

/** The copies of a card fanned out horizontally, with a ×N badge. */
export default function CardStack({ card, count, cardWidth, stackOffset, onSelect }: CardStackProps) {
  const stackWidth = cardWidth + (count - 1) * stackOffset;
  return (
    <div
      className={styles.cardStack}
      style={{ width: `${stackWidth}px` }}
      onClick={() => onSelect(card)}
      title={count > 1 ? `${card.name} ×${count}` : card.name}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={styles.stackedCard}
          style={{ left: `${i * stackOffset}px`, zIndex: i }}
        >
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className={styles.cardImg} loading="lazy" />
          ) : (
            <div className={styles.cardPlaceholder}>{card.name}</div>
          )}
        </div>
      ))}
      {count > 1 && <span className={styles.countBadge}>×{count}</span>}
    </div>
  );
}
