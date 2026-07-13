import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollectionCard, CollectionCatalog, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import FormatBanner from '../components/FormatBanner';
import ReworkFilters, { type ReworkFilterParams } from '../components/ReworkFilters';
import ReworkComparisonList from '../components/ReworkComparisonList';
import CardDetailModal from '../components/CardDetailModal';
import { useReworkGroups } from '../hooks/useReworkGroups';
import { useScrollRestore } from '../hooks/useScrollRestore';
import styles from './ReworkPage.module.css';

function parseFormatParam(value: string | null): CollectionFormat | null {
  if (value === CollectionFormat.FURIA_EXTENDIDO) return CollectionFormat.FURIA_EXTENDIDO;
  if (value === CollectionFormat.PRIMER_BLOQUE) return CollectionFormat.PRIMER_BLOQUE;
  return null;
}

const ReworkPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFormat = parseFormatParam(searchParams.get('format'));
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [filters, setFilters] = useState<ReworkFilterParams>({ q: null, type: null });
  const [displayCount, setDisplayCount] = useState({ visible: 0, total: 0 });
  const isInitialFilterApplyRef = useRef(true);

  const urlFormat = searchParams.get('format');
  const matchesFormat = selectedFormat !== null && urlFormat === selectedFormat;

  const { filteredGroups } = useReworkGroups(allCards, filters);

  useScrollRestore(Boolean(selectedFormat) && filtersReady);

  useEffect(() => {
    if (!selectedFormat) {
      setAllCards([]);
      setLoading(false);
      setFiltersReady(false);
      return;
    }

    setLoading(true);
    setFiltersReady(false);
    isInitialFilterApplyRef.current = true;
    loadCollectionCards(selectedFormat)
      .then((data: CollectionCatalog) => {
        setAllCards(data.data.CardCatalog.cards);
      })
      .catch((err) => {
        console.error('Error loading reworks:', err);
        setAllCards([]);
      })
      .finally(() => setLoading(false));
  }, [selectedFormat]);

  const handleFormatChange = (format: CollectionFormat) => {
    setSearchParams(() => {
      const next = new URLSearchParams();
      next.set('format', format);
      return next;
    }, { replace: true });
  };

  const handleFilterChange = (params: ReworkFilterParams) => {
    setFilters(params);
    setFiltersReady(true);

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (params.q) next.set('q', params.q); else next.delete('q');
      if (params.type) next.set('type', params.type); else next.delete('type');
      return next;
    }, { replace: true });
    isInitialFilterApplyRef.current = false;
  };

  const cardsById = useMemo(
    () => new Map(allCards.map((card) => [card.id, card])),
    [allCards],
  );

  const handleViewCard = (card: CollectionCard) => {
    setSelectedCard(cardsById.get(card.id) ?? card);
  };

  const handleDisplayCountChange = useCallback((visible: number, total: number) => {
    setDisplayCount({ visible, total });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Reworks</h1>
        <p>Compara versiones antiguas y reworks de las cartas del juego.</p>
      </div>

      <div className={styles.formatBannerWrap}>
        <FormatBanner
          variant="select"
          selectedFormat={selectedFormat ?? undefined}
          onFormatChange={handleFormatChange}
          smallLabel="Comparar reworks de"
        />
      </div>

      {!selectedFormat ? (
        <div className={styles.selectFormatMessage}>
          Selecciona un formato arriba para ver las cartas con rework.
        </div>
      ) : loading ? (
        <div className={styles.loading}>Cargando cartas...</div>
      ) : (
        <div className={styles.content}>
          <ReworkFilters
            key={selectedFormat}
            onFilterChange={handleFilterChange}
            initialSearch={matchesFormat ? searchParams.get('q') : null}
            initialType={matchesFormat ? searchParams.get('type') : null}
          />

          <div className={styles.listArea}>
            {filtersReady && (
              <ReworkComparisonList
                groups={filteredGroups}
                onViewCard={handleViewCard}
                onDisplayCountChange={handleDisplayCountChange}
              />
            )}
          </div>
        </div>
      )}

      {selectedFormat && !loading && filtersReady && (
        <div className={styles.stats}>
          Mostrando {displayCount.visible} de {displayCount.total} cartas con rework
        </div>
      )}

      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};

export default ReworkPage;
