import { useState } from 'react';
import { CollectionCard } from '../types/collection';
import { isNewestCard } from '../utils/cardGrouping';
import styles from './ReworkVersionColumn.module.css';

interface ReworkVersionColumnProps {
  title: string;
  versions: CollectionCard[];
  onViewCard?: (card: CollectionCard) => void;
  showNewestBadge?: boolean;
}

export default function ReworkVersionColumn({
  title,
  versions,
  onViewCard,
  showNewestBadge = false,
}: ReworkVersionColumnProps) {
  const [index, setIndex] = useState(0);
  const safeIndex = versions.length > 0 ? Math.min(index, versions.length - 1) : 0;
  const card = versions[safeIndex];
  const hasMultiple = versions.length > 1;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(versions.length - 1, i + 1));

  return (
    <div className={styles.column}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.imageSlot}>
        {card ? (
          <div className={styles.imageWrap}>
            <button
              type="button"
              className={styles.imageButton}
              onClick={() => onViewCard?.(card)}
              aria-label={`Ver detalle de ${card.name}`}
            >
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} className={styles.image} />
              ) : (
                <div className={styles.placeholder}>Sin imagen</div>
              )}
            </button>
            {showNewestBadge && isNewestCard(card) && (
              <span className={styles.newestBadge}>Carta más Nueva</span>
            )}
          </div>
        ) : (
          <div className={styles.emptyImage} aria-hidden="true" />
        )}
      </div>

      <div className={styles.meta}>
        {card ? (
          <>
            <span className={styles.name}>{card.name}</span>
            <span className={styles.code}>{card.collectorCode}</span>
          </>
        ) : (
          <span className={styles.emptyLabel}>Sin versión disponible</span>
        )}
      </div>

      <div className={styles.navSlot}>
        {hasMultiple ? (
          <div className={styles.nav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goPrev}
              disabled={safeIndex === 0}
              aria-label="Versión anterior"
            >
              ‹
            </button>
            <span className={styles.counter}>
              {safeIndex + 1} / {versions.length}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goNext}
              disabled={safeIndex === versions.length - 1}
              aria-label="Versión siguiente"
            >
              ›
            </button>
          </div>
        ) : (
          <div className={styles.navPlaceholder} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
