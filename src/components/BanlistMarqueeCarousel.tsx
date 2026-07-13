import { useCallback, useEffect, useRef, useState } from 'react';
import { BanListCard } from '../types/banlist';
import styles from './BanlistMarqueeCarousel.module.css';

type Props = {
  cards: BanListCard[];
  onCardClick: (card: BanListCard) => void;
  emptyMessage?: string;
};

const AUTO_SCROLL_SPEED = 72;
const DRAG_CLICK_THRESHOLD = 6;

export default function BanlistMarqueeCarousel({ cards, onCardClick, emptyMessage = 'Sin cartas' }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const maxScrollRef = useRef(0);
  const offsetRef = useRef(0);
  const directionRef = useRef(-1);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [canScroll, setCanScroll] = useState(false);

  const applyOffset = useCallback((nextOffset: number) => {
    const clamped = Math.min(0, Math.max(-maxScrollRef.current, nextOffset));
    offsetRef.current = clamped;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${clamped}px)`;
    }
  }, []);

  useEffect(() => {
    const updateMaxScroll = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const overflow = Math.max(0, track.scrollWidth - viewport.clientWidth);
      maxScrollRef.current = overflow;
      setCanScroll(overflow > 0);

      if (overflow === 0) {
        applyOffset(0);
        return;
      }

      if (Math.abs(offsetRef.current) > overflow) {
        applyOffset(-overflow);
      }
    };

    updateMaxScroll();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateMaxScroll)
      : null;

    if (resizeObserver && viewportRef.current) {
      resizeObserver.observe(viewportRef.current);
    }
    if (resizeObserver && trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    window.addEventListener('resize', updateMaxScroll);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateMaxScroll);
    };
  }, [cards, applyOffset]);

  useEffect(() => {
    offsetRef.current = 0;
    directionRef.current = -1;
    setCanScroll(false);
    if (trackRef.current) {
      trackRef.current.style.transform = 'translateX(0px)';
    }
  }, [cards]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const lastTime = lastFrameTimeRef.current ?? timestamp;
      const deltaSeconds = (timestamp - lastTime) / 1000;
      lastFrameTimeRef.current = timestamp;

      if (!isDraggingRef.current && maxScrollRef.current > 0) {
        let nextOffset = offsetRef.current + directionRef.current * AUTO_SCROLL_SPEED * deltaSeconds;

        if (nextOffset <= -maxScrollRef.current) {
          nextOffset = -maxScrollRef.current;
          directionRef.current = 1;
        } else if (nextOffset >= 0) {
          nextOffset = 0;
          directionRef.current = -1;
        }

        applyOffset(nextOffset);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastFrameTimeRef.current = null;
    };
  }, [applyOffset]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (maxScrollRef.current <= 0) return;

    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const delta = event.clientX - dragStartXRef.current;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(delta));
    applyOffset(dragStartOffsetRef.current + delta);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCardClick = (card: BanListCard) => {
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) return;
    onCardClick(card);
  };

  if (cards.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  const isDraggable = canScroll;

  return (
    <div
      ref={viewportRef}
      className={`${styles.marqueeViewport} ${isDraggable ? styles.marqueeViewportDraggable : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div ref={trackRef} className={styles.marqueeTrack}>
        {cards.map((card, index) => (
          <button
            key={`${card.name}-${index}`}
            type="button"
            className={styles.marqueeCard}
            onClick={() => handleCardClick(card)}
            aria-label={`Ver detalle de ${card.name}`}
          >
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className={styles.cardImage} draggable={false} />
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
