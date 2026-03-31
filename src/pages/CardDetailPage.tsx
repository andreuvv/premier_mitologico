import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CollectionFormat, CollectionCard, CollectionCatalog } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import styles from './CardDetailPage.module.css';

function stripHtml(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

export default function CardDetailPage() {
  const { format, id } = useParams<{ format: string; id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<CollectionCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!format || !id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const collectionFormat =
      format === CollectionFormat.PRIMER_BLOQUE
        ? CollectionFormat.PRIMER_BLOQUE
        : CollectionFormat.FURIA_EXTENDIDO;

    loadCollectionCards(collectionFormat)
      .then((data: CollectionCatalog) => {
        const found = data.data.CardCatalog.cards.find(c => c.id === Number(id));
        if (found) {
          setCard(found);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [format, id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/coleccion');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando carta...</div>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Carta no encontrada.</p>
          <Link to="/coleccion" className={styles.backLink}>← Volver a la colección</Link>
        </div>
      </div>
    );
  }

  const cardType = card.type?.toUpperCase();
  const isAliado = cardType === 'ALIADO';
  const isOro = cardType === 'ORO';
  const effectText = stripHtml(card.effect);
  const flavorText = stripHtml(card.flavor);
  const productName = card.product?.productName ?? card.edition?.name;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={handleBack}>
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
          <h1 className={styles.cardName}>{card.name}</h1>

          {!isOro && (
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
              <div className={styles.stat}>
                <span className={styles.statIcon}>🪙</span>
                <div>
                  <div className={styles.statValue}>{card.cost}</div>
                  <div className={styles.statLabel}>Costo</div>
                </div>
              </div>
            </div>
          )}

          {card.type && (
            <div className={styles.type}>{card.type}</div>
          )}

          {isAliado && card.race && card.race.length > 0 && (
            <div className={styles.raceBadges}>
              {card.race.map(r => (
                <span key={r} className={styles.raceBadge}>{r}</span>
              ))}
            </div>
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
            {productName && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Producto:</span>
                <span>{productName}</span>
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
  );
}
