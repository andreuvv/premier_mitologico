import { useEffect } from 'react';
import { CollectionCard } from '../types/collection';
import styles from './CardDetailModal.module.css';

interface CardDetailModalProps {
  card: CollectionCard | null;
  onClose: () => void;
  cards?: CollectionCard[];
  onNavigate?: (card: CollectionCard) => void;
}

function stripHtml(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

export default function CardDetailModal({ card, onClose, cards, onNavigate }: CardDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!card || !cards || !onNavigate) return;
      const index = cards.findIndex((item) => item.id === card.id);
      if (index < 0) return;
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        onNavigate(cards[index - 1]);
      }
      if (e.key === 'ArrowRight' && index < cards.length - 1) {
        e.preventDefault();
        onNavigate(cards[index + 1]);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [card, cards, onClose, onNavigate]);

  // Prevent body scroll when open
  useEffect(() => {
    if (card) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [card]);

  if (!card) return null;

  const currentIndex = cards?.findIndex((item) => item.id === card.id) ?? -1;
  const hasPrev = Boolean(cards && currentIndex > 0 && onNavigate);
  const hasNext = Boolean(cards && currentIndex >= 0 && currentIndex < cards.length - 1 && onNavigate);

  const cardType = card.type?.toUpperCase();
  const isAliado = cardType === 'ALIADO';
  const isOro = cardType === 'ORO';
  const effectText = stripHtml(card.effect);
  const flavorText = stripHtml(card.flavor);
  const productName = card.product?.productName ?? card.edition?.name;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${card.name}`}
    >
      {hasPrev && (
        <button
          className={`${styles.navBtn} ${styles.navBtnLeft}`}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(cards![currentIndex - 1]);
          }}
          aria-label="Carta anterior"
          type="button"
        >
          ‹
        </button>
      )}

      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className={styles.body}>
          {/* Left: card image */}
          <div className={styles.imageWrapper}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
            ) : (
              <div className={styles.placeholder}>{card.name}</div>
            )}
          </div>

          {/* Right: info */}
          <div className={styles.info}>
            <h2 className={styles.cardName}>{card.name}</h2>

            {!isOro && (
              <div className={styles.statsRow}>
                {isAliado && (
                  <div className={styles.stat}>
                    <span className={styles.statIcon}>⚔️</span>
                    <div>
                      <div className={styles.statValue}>{card.attack}</div>
                      <div className={styles.statLabel}>Fuerza</div>
                    </div>
                  </div>
                )}
                <div className={styles.stat}>
                  <span className={styles.statIcon}>🪙</span>
                  <div>
                    <div className={styles.statValue}>{card.cost}</div>
                    <div className={styles.statLabel}>Coste</div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.typeLine}>
              {card.type && <span className={styles.typeBadge}>{card.type}</span>}
              {isAliado && card.race && card.race.length > 0 && (
                <div className={styles.raceBadges}>
                  {card.race.map((r) => (
                    <span key={r} className={styles.raceBadge}>{r}</span>
                  ))}
                </div>
              )}
            </div>

            {effectText && (
              <div className={styles.effect}>
                <p>{effectText}</p>
              </div>
            )}

            {flavorText && (
              <div className={styles.flavor}>
                <p>{flavorText}</p>
              </div>
            )}

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Código:</span>
                <span>{card.collectorCode}</span>
              </div>
              {productName && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Producto:</span>
                  <span>{productName}</span>
                </div>
              )}
              {card.artist && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Artista:</span>
                  <span>{card.artist}</span>
                </div>
              )}
              {card.frequency && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Frecuencia:</span>
                  <span>{card.frequency}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasNext && (
        <button
          className={`${styles.navBtn} ${styles.navBtnRight}`}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(cards![currentIndex + 1]);
          }}
          aria-label="Carta siguiente"
          type="button"
        >
          ›
        </button>
      )}
    </div>
  );
}
