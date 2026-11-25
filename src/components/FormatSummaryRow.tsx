import styles from './FormatSummaryRow.module.css';
import { BanListFormat } from '../types/banlist';
import {
  FormatSummary,
  ChangeType,
  getChangeArrowInfo,
} from '../data/banlistSummary';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaList,
  FaImages,
} from 'react-icons/fa';
import {
  BiChevronDown,
  BiChevronUp,
  BiChevronsDown,
  BiChevronsUp,
} from 'react-icons/bi';
import TripleChevronIcon from './TripleChevronIcon';
import CardDetailModal from './CardDetailModal';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';

type Props = {
  summaries: Record<BanListFormat, FormatSummary[]>;
};

type ViewMode = 'carousel' | 'list';

type HoveredCard = {
  imageUrl: string;
  x: number;
  y: number;
} | null;

const formatLabels: Record<BanListFormat, string> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: 'PB Racial Libre',
  [BanListFormat.PRIMER_BLOQUE_EDICION]: 'PB Racial Edición',
  [BanListFormat.BLOQUE_FURIA_LIBRE]: 'FX Racial Libre',
  [BanListFormat.BLOQUE_FURIA_RAGNAROK]: 'FX Racial Ragnarok',
};

const getRowClassName = (changeType?: ChangeType): string => {
  switch (changeType) {
    case 'positive':
      return styles.rowPositiveStrong;
    case 'positiveSoft':
      return styles.rowPositiveSoft;
    case 'negative':
      return styles.rowNegativeStrong;
    case 'negativeSoft':
      return styles.rowNegativeSoft;
    case 'neutral':
      return styles.rowNeutral;
    default:
      return '';
  }
};

const getArrowColorClass = (changeType?: ChangeType): string => {
  switch (changeType) {
    case 'positive':
      return styles.arrowPositiveStrong;
    case 'positiveSoft':
      return styles.arrowPositiveSoft;
    case 'negative':
      return styles.arrowNegativeStrong;
    case 'negativeSoft':
      return styles.arrowNegativeSoft;
    case 'neutral':
      return styles.arrowNeutral;
    default:
      return '';
  }
};

function ChangeArrows({ item }: { item: FormatSummary }) {
  const { count, direction } = getChangeArrowInfo(item.pastMonth, item.currentMonth);
  const colorClass = getArrowColorClass(item.changeType);

  if (count === 0 || direction === 'none') {
    return <span className={styles.arrowNeutral}>—</span>;
  }

  const isDown = direction === 'down';
  const SingleIcon = isDown ? BiChevronDown : BiChevronUp;
  const DoubleIcon = isDown ? BiChevronsDown : BiChevronsUp;

  if (count === 1) {
    return <SingleIcon className={`${styles.arrowIcon} ${colorClass}`} aria-hidden="true" />;
  }

  if (count === 2) {
    return <DoubleIcon className={`${styles.arrowIconDouble} ${colorClass}`} aria-hidden="true" />;
  }

  return (
    <TripleChevronIcon
      direction={isDown ? 'down' : 'up'}
      className={`${styles.arrowIconTriple} ${colorClass}`}
    />
  );
}

type CarouselSlideProps = {
  item: FormatSummary;
  onCardClick: (item: FormatSummary) => void;
};

function CarouselSlide({ item, onCardClick }: CarouselSlideProps) {
  return (
    <div className={styles.carouselSlide}>
      <button
        type="button"
        className={styles.cardImageButton}
        onClick={() => onCardClick(item)}
        aria-label={`Ver detalle de ${item.card}`}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.card} className={styles.carouselCardImage} />
        ) : (
          <div className={styles.cardPlaceholder}>
            <span>{item.card.charAt(0)}</span>
          </div>
        )}
      </button>

      <p className={styles.carouselCardName}>{item.card}</p>

      <div className={styles.changeGrid}>
        <span className={styles.changeLabelBefore}>Antes</span>
        <span className={styles.changeLabelAfter}>Ahora</span>
        <span className={styles.changeValueBefore}>{item.pastMonth}</span>
        <div className={styles.changeColumnArrows}>
          <ChangeArrows item={item} />
        </div>
        <span className={styles.changeValueAfter}>{item.currentMonth}</span>
      </div>
    </div>
  );
}

type FormatCarouselProps = {
  items: FormatSummary[];
  onCardClick: (item: FormatSummary) => void;
};

function FormatCarousel({ items, onCardClick }: FormatCarouselProps) {
  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAutoAdvance = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoAdvance = useCallback(() => {
    clearAutoAdvance();
    if (items.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2000);
  }, [clearAutoAdvance, items.length]);

  useEffect(() => {
    setEnableTransition(false);
    setIndex(0);
    startAutoAdvance();

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnableTransition(true));
    });

    return () => {
      cancelAnimationFrame(frame);
      clearAutoAdvance();
    };
  }, [items, startAutoAdvance, clearAutoAdvance]);

  const goTo = (nextIndex: number) => {
    setIndex(nextIndex);
    startAutoAdvance();
  };

  const handlePrev = () => {
    goTo((index - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    goTo((index + 1) % items.length);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselViewport}>
        <div
          className={styles.carouselTrack}
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: enableTransition
              ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
          }}
        >
          {items.map((item) => (
            <CarouselSlide
              key={item.card}
              item={item}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className={styles.carouselControls}>
          <button
            type="button"
            className={styles.carouselArrow}
            onClick={handlePrev}
            aria-label="Carta anterior"
          >
            <FaChevronLeft />
          </button>
          <span className={styles.carouselCounter}>
            {index + 1} / {items.length}
          </span>
          <button
            type="button"
            className={styles.carouselArrow}
            onClick={handleNext}
            aria-label="Siguiente carta"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

type CardLookup = {
  all: CollectionCard[];
  byId: Map<CollectionCard['id'], CollectionCard>;
  byName: Map<string, CollectionCard>;
};

// The full catalogs are several MB, so they are only downloaded when the user
// opens a card's detail, not when the summary renders (e.g. on the Home page).
let cardLookupRequest: Promise<CardLookup> | null = null;

function loadCardLookup(): Promise<CardLookup> {
  if (!cardLookupRequest) {
    cardLookupRequest = Promise.all([
      loadCollectionCards(CollectionFormat.PRIMER_BLOQUE),
      loadCollectionCards(CollectionFormat.FURIA_EXTENDIDO),
    ]).then(([pbCatalog, fxCatalog]) => {
      const all = [...pbCatalog.data.CardCatalog.cards, ...fxCatalog.data.CardCatalog.cards];
      const byId = new Map(all.map((card) => [card.id, card] as const));
      const byName = new Map<string, CollectionCard>();
      all.forEach((card) => byName.set(card.name.toLowerCase(), card));
      return { all, byId, byName };
    });
    cardLookupRequest.catch(() => {
      cardLookupRequest = null;
    });
  }
  return cardLookupRequest;
}

function resolveCollectionCard(item: FormatSummary, lookup: CardLookup): CollectionCard | null {
  if (item.cardId) {
    const byId = lookup.byId.get(item.cardId);
    if (byId) return byId;
  }

  const byName = lookup.byName.get(item.card.toLowerCase());
  if (byName) return byName;

  if (item.imageUrl) {
    const byImage = lookup.all.find((card) => card.imageUrl === item.imageUrl);
    if (byImage) return byImage;
  }

  return null;
}

export default function FormatSummaryRow({ summaries }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [hoveredCard, setHoveredCard] = useState<HoveredCard>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [modalCards, setModalCards] = useState<CollectionCard[]>([]);
  const [loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 800);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleMouseEnter = (imageUrl: string, e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!imageUrl || isMobile) return;
    setHoveredCard({
      imageUrl,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (isMobile) return;
    setHoveredCard((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };

  const handleRowClick = (item: FormatSummary, formatItems: FormatSummary[]) => {
    handleCarouselCardClick(item, formatItems);
  };

  const handleCarouselCardClick = async (item: FormatSummary, formatItems: FormatSummary[]) => {
    if (loadingCard) return;
    setLoadingCard(true);
    try {
      const lookup = await loadCardLookup();
      const card = resolveCollectionCard(item, lookup);
      if (!card) return;

      const resolvedCards = formatItems
        .map((formatItem) => resolveCollectionCard(formatItem, lookup))
        .filter((formatCard): formatCard is CollectionCard => formatCard !== null);

      setModalCards(resolvedCards);
      setSelectedCard(card);
    } catch (error) {
      console.error('Error loading collection cards for banlist summary:', error);
    } finally {
      setLoadingCard(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
    setModalCards([]);
  };

  return (
    <div className={styles.wrapper} aria-busy={loadingCard} style={loadingCard ? { cursor: 'progress' } : undefined}>
      <div className={styles.summaryToolbar}>
        <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
        <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.viewToggleButton} ${viewMode === 'carousel' ? styles.viewToggleActive : ''}`}
          onClick={() => setViewMode('carousel')}
          aria-pressed={viewMode === 'carousel'}
          aria-label="Vista carrusel"
          title="Vista carrusel"
        >
          <FaImages />
        </button>
        <button
          type="button"
          className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
          onClick={() => setViewMode('list')}
          aria-pressed={viewMode === 'list'}
          aria-label="Vista lista"
          title="Vista lista"
        >
          <FaList />
        </button>
      </div>
      </div>

      <div className={styles.row}>
        {Object.keys(summaries).map((k) => {
          const key = k as BanListFormat;
          const items = summaries[key];
          return (
            <div key={k} className={styles.card}>
              <h4 className={styles.title}>{formatLabels[key]}</h4>
              {items.length === 0 ? (
                <p className={styles.noChanges}>Sin cambios</p>
              ) : viewMode === 'carousel' ? (
                <FormatCarousel
                  items={items}
                  onCardClick={(item) => handleCarouselCardClick(item, items)}
                />
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Carta</th>
                      <th>Antes</th>
                      <th>Ahora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={idx}
                        className={getRowClassName(item.changeType)}
                        onMouseEnter={(e) => handleMouseEnter(item.imageUrl || '', e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleRowClick(item, items)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <strong>{item.card}</strong>
                        </td>
                        <td>{item.pastMonth}</td>
                        <td>{item.currentMonth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      {!isMobile && hoveredCard && (
        <div
          className={styles.cardTooltip}
          style={{
            left: `${hoveredCard.x + 10}px`,
            top: `${hoveredCard.y + 10}px`,
          }}
        >
          <img src={hoveredCard.imageUrl} alt="Card" />
        </div>
      )}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          cards={modalCards.length > 1 ? modalCards : undefined}
          onNavigate={modalCards.length > 1 ? setSelectedCard : undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
