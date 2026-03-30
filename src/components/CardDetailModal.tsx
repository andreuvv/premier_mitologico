import styles from './CardDetailModal.module.css';
import type { SimpleCard } from './CardGrid';

function stripHtml(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

interface CardDetailModalProps {
  card: SimpleCard;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const cardType = card.type?.toUpperCase();
  const isAliado = cardType === 'ALIADO';
  const isOro = cardType === 'ORO';
  const effectText = stripHtml(card.effect);
  const flavorText = stripHtml(card.flavor);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={onClose}>
            ← Volver
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.imageWrapper}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
            ) : (
              <div className={styles.placeholder}>Sin imagen</div>
            )}
          </div>

          <div className={styles.info}>
            <div className={styles.statsRow}>
              {isAliado && (
                <div className={styles.stat}>
                  <span className={styles.statIcon}>⚔️</span>
                  <div>
                    <div className={styles.statValue}>{card.attack}</div>
                    <div className={styles.statLabel}>Ataque</div>
                  </div>
                </div>
              )}
              {!isOro && (
                <div className={styles.stat}>
                  <span className={styles.statIcon}>🪙</span>
                  <div>
                    <div className={styles.statValue}>{card.cost}</div>
                    <div className={styles.statLabel}>Costo</div>
                  </div>
                </div>
              )}
            </div>

            {card.type && (
              <div className={styles.type}>{card.type}</div>
            )}

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
              {card.productName && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Producto:</span>
                  <span>{card.productName}</span>
                </div>
              )}
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Artista:</span>
                <span>{card.artist}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
