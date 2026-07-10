import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLayerGroup } from 'react-icons/fa';
import { PublicDeck, useUserDecks } from '../hooks/useUserDecks';
import styles from './LatestDecksSection.module.css';

const RACE_TO_EDITION: Record<string, string> = {
  Faerie: 'espada-sagrada', Dragon: 'espada-sagrada', Caballero: 'espada-sagrada',
  Titan: 'helenica', Olimpico: 'helenica', Heroe: 'helenica',
  Desafiante: 'hijos-de-daana', Defensor: 'hijos-de-daana', Sombra: 'hijos-de-daana',
  Eterno: 'dominios-de-ra', Sacerdote: 'dominios-de-ra', Faraon: 'dominios-de-ra',
};

const EDITION_LABELS: Record<string, string> = {
  'espada-sagrada': 'Espada Sagrada',
  'helenica': 'Helénica',
  'hijos-de-daana': 'Hijos de Daana',
  'dominios-de-ra': 'Dominios de Ra',
  'dracula-inferno': 'Drácula & Infierno',
};

function getCoverImageStyle(zoom: number, posX: number, posY: number) {
  const safeZoom = Math.max(1, zoom);
  const clampedX = Math.min(100, Math.max(0, posX));
  const clampedY = Math.min(100, Math.max(0, posY));
  return {
    backgroundSize: `${safeZoom * 100}% auto`,
    backgroundPosition: `${clampedX}% ${clampedY}%`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#101010',
  };
}

function getSubformatLabel(subformat: string) {
  if (subformat === 'pb-edicion') return 'Racial Edición';
  if (subformat === 'pb-libre') return 'Racial Libre';
  if (subformat === 'fx-vcr') return 'VCR';
  if (subformat === 'fx-ragnarok') return 'Racial Ragnarok';
  return 'Racial Libre';
}

function formatDeckDate(dateString?: string | null): string {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date
    .toLocaleDateString('es-ES', { month: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());
  const year = String(date.getFullYear());
  return `${day} ${month} ${year}`;
}

interface LatestDecksSectionProps {
  showTitle?: boolean;
  contained?: boolean;
  preloadedPb?: PublicDeck | null;
  preloadedFx?: PublicDeck | null;
  skipFetch?: boolean;
}

const DeckCard = ({ deck }: { deck: PublicDeck }) => {
  const navigate = useNavigate();
  const formatLabel = deck.format === 'fx' ? 'Furia Extendido' : 'Primer Bloque';
  const subformatLabel = getSubformatLabel(deck.subformat);
  const formatTagClass = deck.format === 'fx' ? styles.deckCardTagFormatFx : styles.deckCardTagFormatPb;
  const editionSlug = deck.subformat === 'pb-edicion' ? (RACE_TO_EDITION[deck.race] ?? null) : null;
  const editionLabel = editionSlug ? (EDITION_LABELS[editionSlug] ?? null) : null;

  return (
    <div className={styles.deckCard}>
      {deck.headerImageUrl && (
        <div className={styles.deckCardCover}>
          <div
            className={styles.deckCardCoverImg}
            style={{
              backgroundImage: `url(${deck.headerImageUrl})`,
              ...getCoverImageStyle(deck.headerZoom, deck.headerPosX, deck.headerPosY),
            }}
            aria-label="portada"
          />
        </div>
      )}
      <div className={styles.deckCardHeader}>
        <h3 className={styles.deckCardName}>{deck.name}</h3>
        <span className={styles.exploreAuthor}>@{deck.authorName}</span>
      </div>
      <div className={styles.deckCardMeta}>
        <span className={`${styles.deckCardTag} ${formatTagClass}`}>{formatLabel}</span>
        <span className={`${styles.deckCardTag} ${formatTagClass}`}>{subformatLabel}</span>
        {deck.race && <span className={`${styles.deckCardTag} ${styles.deckCardTagRace}`}>{deck.race}</span>}
        {editionLabel && (
          <span className={`${styles.deckCardTag} ${styles.deckCardTagEdition}`}>{editionLabel}</span>
        )}
      </div>
      <div className={styles.deckCardActions}>
        <button
          className={styles.deckViewBtn}
          onClick={() => navigate(`/deck-builder/viewer?deckId=${deck.id}`)}
        >
          👁 Ver Mazo
        </button>
      </div>
      <div className={styles.deckDateBlock}>
        <span className={styles.deckDateLabel}>Creado: {formatDeckDate(deck.created_at)}</span>
      </div>
    </div>
  );
};

const LatestDecksSection = ({
  showTitle = true,
  contained = false,
  preloadedPb,
  preloadedFx,
  skipFetch = false,
}: LatestDecksSectionProps) => {
  const { loadAllDecks } = useUserDecks();
  const [latestPb, setLatestPb] = useState<PublicDeck | null>(preloadedPb ?? null);
  const [latestFx, setLatestFx] = useState<PublicDeck | null>(preloadedFx ?? null);
  const [loading, setLoading] = useState(!skipFetch);

  useEffect(() => {
    if (skipFetch) {
      setLatestPb(preloadedPb ?? null);
      setLatestFx(preloadedFx ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadAllDecks()
      .then((all) => {
        if (cancelled) return;
        const publicDecks = all.filter((d) => d.is_public);
        const byCreatedDesc = [...publicDecks].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setLatestPb(byCreatedDesc.find((d) => d.format === 'pb') ?? null);
        setLatestFx(byCreatedDesc.find((d) => d.format === 'fx') ?? null);
      })
      .catch((err) => {
        console.error('Error loading latest decks:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadAllDecks, skipFetch, preloadedPb, preloadedFx]);

  const body = loading ? (
    <p className={styles.stateText}>Cargando mazos...</p>
  ) : (
    <div className={styles.deckGrid}>
      <div className={styles.deckSlot}>
        <span className={styles.slotLabel}>Primer Bloque</span>
        {latestPb ? (
          <DeckCard deck={latestPb} />
        ) : (
          <div className={styles.emptySlot}>Aún no hay mazos públicos de Primer Bloque.</div>
        )}
      </div>
      <div className={styles.deckSlot}>
        <span className={styles.slotLabel}>Furia Extendido</span>
        {latestFx ? (
          <DeckCard deck={latestFx} />
        ) : (
          <div className={styles.emptySlot}>Aún no hay mazos públicos de Furia Extendido.</div>
        )}
      </div>
    </div>
  );

  if (contained) {
    return (
      <section className={styles.wrapper}>
        {showTitle && (
          <div className={styles.header}>
            <FaLayerGroup className={styles.headerIcon} />
            <h3 className={styles.sectionTitle}>Últimos Mazos</h3>
          </div>
        )}
        {body}
      </section>
    );
  }

  return (
    <section className={styles.section}>
      {showTitle && <h2 className={styles.sectionTitle}>Últimos Mazos</h2>}
      {body}
    </section>
  );
};

export default LatestDecksSection;
