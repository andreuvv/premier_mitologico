import { useEffect, useRef, useState } from 'react';
import { BanListCard } from '../types/banlist';
import styles from './BanlistMarqueeCarousel.module.css';

type Props = {
  cards: BanListCard[];
  onCardClick: (card: BanListCard) => void;
  emptyMessage?: string;
};

export default function BanlistMarqueeCarousel({ cards, onCardClick, emptyMessage = 'Sin cartas' }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const updateScrollDistance = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const overflow = Math.max(0, track.scrollWidth - viewport.clientWidth);
      setScrollDistance(overflow);
    };

    updateScrollDistance();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScrollDistance)
      : null;

    if (resizeObserver && viewportRef.current) {
      resizeObserver.observe(viewportRef.current);
    }
    if (resizeObserver && trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    window.addEventListener('resize', updateScrollDistance);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScrollDistance);
    };
  }, [cards]);

  if (cards.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  const shouldAnimate = scrollDistance > 0;

  return (
    <div className={styles.marqueeViewport} ref={viewportRef}>
      <div
        ref={trackRef}
        className={`${styles.marqueeTrack} ${shouldAnimate ? styles.marqueeTrackAnimated : ''}`}
        style={{
          '--max-scroll': `-${scrollDistance}px`,
          '--marquee-duration': `${Math.max(cards.length * 6, 20)}s`,
        } as React.CSSProperties}
      >
        {cards.map((card, index) => (
          <button
            key={`${card.name}-${index}`}
            type="button"
            className={styles.marqueeCard}
            onClick={() => onCardClick(card)}
            aria-label={`Ver detalle de ${card.name}`}
          >
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
            ) : (
              <div className={styles.cardPlaceholder}>
                <span>{card.name.charAt(0)}</span>
              </div>
            )}
            <span className={styles.cardName}>{card.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
