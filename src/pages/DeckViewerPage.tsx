import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import { useBanlist } from '../hooks/useBanlist';
import { useDeckRules, DeckSubformat } from '../hooks/useDeckRules';
import { useUserDecks, UserDeck } from '../hooks/useUserDecks';
import { supabase } from '../config/supabase';
import CardDetailModal from '../components/CardDetailModal';
import styles from './DeckViewerPage.module.css';
import DeckBody, { type DeckViewData } from './deck-viewer/DeckBody';
import ExportModal from './deck-viewer/ExportModal';
import { useDeckExport } from './deck-viewer/useDeckExport';
import {
  CARD_WIDTH,
  STACK_OFFSET,
  costDistribution,
  editionLabelFor,
  groupByType,
  sortedTypeKeys,
} from './deck-viewer/deckViewerUtils';

export default function DeckViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadDeck } = useUserDecks();

  const deckId = searchParams.get('deckId') ?? '';

  const [deck, setDeck] = useState<UserDeck | null>(null);
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [authorName, setAuthorName] = useState<string>('Anónimo');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const exporter = useDeckExport(deck?.name);

  // Derived from deck
  const format = (deck?.format ?? 'pb') as 'pb' | 'fx';
  const subformat = (deck?.subformat ?? 'pb-edicion') as DeckSubformat;
  const race = deck?.race ?? '';
  const deckCards = useMemo(() => deck?.cards ?? {}, [deck]);
  const sideDeckCards = useMemo(() => deck?.sideDeck ?? {}, [deck]);
  const isDraft = deck?.is_draft ?? false;

  const { banlist } = useBanlist(format, subformat);
  const rules = useDeckRules({ subformat, race, allCards, deckCards, banlist, isDraft, lockedEdition: null, sideDeck: sideDeckCards });

  // Load the deck, its author's username and then the card catalog.
  useEffect(() => {
    if (!deckId) { setLoading(false); return; }
    let cancelled = false;

    const run = async () => {
      try {
        const d = await loadDeck(deckId);
        if (cancelled) return;
        if (!d) { setLoading(false); return; }
        setDeck(d);

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', d.user_id)
          .single();
        if (!cancelled) {
          setAuthorName((profile as { username: string } | null)?.username ?? 'Anónimo');
        }

        const collectionFormat = d.format === 'fx'
          ? CollectionFormat.FURIA_EXTENDIDO
          : CollectionFormat.PRIMER_BLOQUE;
        const catalog = await loadCollectionCards(collectionFormat);
        if (cancelled) return;
        setAllCards(catalog.data.CardCatalog.cards);
      } catch {
        // keep loading=false path below
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [deckId, loadDeck]);

  const cardById = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards],
  );

  const viewData = useMemo<DeckViewData>(() => {
    const mainGroups = groupByType(deckCards, cardById, true);
    const sideGroups = groupByType(sideDeckCards, cardById, false);
    return {
      name: deck?.name ?? '',
      format,
      subformat,
      race,
      isDraft,
      authorName,
      editionLabel: editionLabelFor(subformat, race),
      mainGroups,
      mainTypeKeys: sortedTypeKeys(mainGroups),
      sideGroups,
      sideTypeKeys: sortedTypeKeys(sideGroups),
      totalSideCount: Object.values(sideDeckCards).reduce((a, b) => a + b, 0),
      totalDeckCount: Object.values(deckCards).reduce((a, b) => a + b, 0),
      costBuckets: costDistribution(deckCards, cardById),
      errors: rules.errors,
      warnings: rules.warnings,
    };
  }, [deck?.name, format, subformat, race, isDraft, authorName, deckCards, sideDeckCards, cardById, rules.errors, rules.warnings]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Cargando mazo...</span>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className={styles.loadingScreen}>
        <p>Mazo no encontrado.</p>
        <button className={styles.backBtn} onClick={() => navigate('/deck-builder')}>
          ← Volver
        </button>
      </div>
    );
  }

  const exportRatioClass = exporter.exportRatio === 'desktop'
    ? styles.ratioDesktop
    : exporter.exportRatio === 'tablet'
      ? styles.ratioTablet
      : styles.ratioMobile;

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/deck-builder')}>
          ← Mis Mazos
        </button>
        <div className={styles.topBarActions}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'grouped' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('grouped')}
              aria-pressed={viewMode === 'grouped'}
            >
              Agrupado
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
            >
              Grilla
            </button>
          </div>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => exporter.openExportModal(viewMode)}
            disabled={exporter.exporting}
          >
            📷 Exportar imagen
          </button>
        </div>
      </div>

      {/* Visible deck — never resized while exporting */}
      <div className={styles.exportArea}>
        <DeckBody data={viewData} view={viewMode} includeSide cardWidth={CARD_WIDTH} stackOffset={STACK_OFFSET} onSelectCard={setSelectedCard} />
      </div>

      {/* Off-screen copy captured for the exported image. The offset lives on
          the wrapper; the captured node itself keeps normal positioning so
          html-to-image renders its content at the origin. */}
      {exporter.exporting && (
        <div className={styles.exportOffscreen} aria-hidden="true">
          <div
            ref={exporter.exportRef}
            className={`${styles.exportArea} ${styles.exportPadded} ${exportRatioClass}`}
            style={{
              '--card-w': `${exporter.exportCardWidth}px`,
              '--card-h': `${exporter.exportCardHeight}px`,
            } as CSSProperties}
          >
            <DeckBody
              data={viewData}
              view={exporter.exportView}
              includeSide={exporter.exportIncludeSide}
              cardWidth={exporter.exportCardWidth}
              stackOffset={exporter.exportStackOffset}
              onSelectCard={setSelectedCard}
            />
          </div>
        </div>
      )}

      {exporter.showExportModal && (
        <ExportModal exporter={exporter} hasSideDeck={viewData.totalSideCount > 0} />
      )}

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
