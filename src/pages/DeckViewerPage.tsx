import { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toBlob } from 'html-to-image';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import { useBanlist } from '../hooks/useBanlist';
import { useDeckRules, DeckSubformat } from '../hooks/useDeckRules';
import { useUserDecks, UserDeck } from '../hooks/useUserDecks';
import { supabase } from '../config/supabase';
import CardDetailModal from '../components/CardDetailModal';
import { MITOXICOS_LOADER_COLOR } from '../config/loadingAssets';
import styles from './DeckViewerPage.module.css';

const DECK_SIZE = 50;
const STACK_OFFSET = 13; // px offset per stacked copy
const CARD_WIDTH = 100;  // px

// Rejects if the given promise doesn't settle in time, so the "Generando..."
// state can never get stuck permanently (e.g. if the browser can't rasterize
// the SVG on a low-memory device).
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('export-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

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

const FORMAT_LABELS: Record<string, string> = {
  pb: 'Primer Bloque',
  fx: 'Furia Extendido',
};

const SUBFORMAT_LABELS: Record<string, string> = {
  'pb-edicion': 'Racial Edición',
  'pb-libre':   'Racial Libre',
  'fx-vcr':     'VCR',
  'fx-libre':   'Racial Libre',
  'fx-ragnarok': 'Racial Ragnarok',
};

const TYPE_ORDER = ['Aliado', 'Arma', 'Talisman', 'Totem', 'Oro'];
const COST_CHART_TYPES = ['Oro', 'Aliado', 'Totem', 'Talisman', 'Arma'] as const;
type CostChartType = typeof COST_CHART_TYPES[number];
const COST_CHART_SEGMENT_CLASS: Record<CostChartType, string> = {
  Oro: 'costChartSegmentOro',
  Aliado: 'costChartSegmentAliado',
  Totem: 'costChartSegmentTotem',
  Talisman: 'costChartSegmentTalisman',
  Arma: 'costChartSegmentArma',
};
const TYPE_DISPLAY: Record<string, string> = {
  Aliado:   'Aliados',
  Arma:     'Armas',
  Talisman: 'Talismanes',
  Totem:    'Tótems',
  Oro:      'Oros',
};

const TYPE_STATS = [
  { type: 'Aliado',   label: 'Aliados' },
  { type: 'Arma',     label: 'Armas' },
  { type: 'Talisman', label: 'Talismanes' },
  { type: 'Totem',    label: 'Tótems' },
  { type: 'Oro',      label: 'Oros' },
];

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

function isOroSinHabilidad(card: CollectionCard): boolean {
  const text = stripHtml(card.effect ?? '').toLowerCase();
  return text === '' || text.includes('oro sin habilidad');
}

function normalizeChartType(rawType?: string | null): CostChartType | null {
  switch (rawType?.toUpperCase()) {
    case 'ORO':
      return 'Oro';
    case 'ALIADO':
      return 'Aliado';
    case 'TOTEM':
      return 'Totem';
    case 'TALISMAN':
      return 'Talisman';
    case 'ARMA':
      return 'Arma';
    default:
      return null;
  }
}

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
  const [hoveredCostSegment, setHoveredCostSegment] = useState<{
    cost: number;
    type: CostChartType;
    count: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportView, setExportView] = useState<'grouped' | 'grid'>('grid');
  const [exportRatio, setExportRatio] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [exportIncludeSide, setExportIncludeSide] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);

  // Derived from deck
  const format = (deck?.format ?? 'pb') as 'pb' | 'fx';
  const subformat = (deck?.subformat ?? 'pb-edicion') as DeckSubformat;
  const race = deck?.race ?? '';
  const deckCards = useMemo(() => deck?.cards ?? {}, [deck]);
  const sideDeckCards = useMemo(() => deck?.sideDeck ?? {}, [deck]);
  const isDraft = deck?.is_draft ?? false;

  const { banlist } = useBanlist(format, subformat);
  const rules = useDeckRules({ subformat, race, allCards, deckCards, banlist, isDraft, lockedEdition: null, sideDeck: sideDeckCards });

  // Load deck then cards sequentially using async/await
  useEffect(() => {
    if (!deckId) { setLoading(false); return; }
    let cancelled = false;

    const run = async () => {
      try {
        const d = await loadDeck(deckId);
        if (cancelled) return;
        if (!d) { setLoading(false); return; }
        setDeck(d);

        // Fetch deck owner's username from profiles
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
      } catch (_) {
        // keep loading=false path below
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Card lookup
  const cardById = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards],
  );

  // Group deck cards by type, sorted, with Oros sin habilidad at end
  const deckByType = useMemo(() => {
    const groups: Record<string, { card: CollectionCard; count: number }[]> = {};
    for (const [idStr, count] of Object.entries(deckCards)) {
      if (count <= 0) continue;
      const card = cardById.get(Number(idStr));
      if (!card) continue;
      const rawType = card.type ?? 'Otro';
      const t = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push({ card, count });
    }
    // Sort within each type by name
    for (const [type, items] of Object.entries(groups)) {
      if (type === 'Oro') {
        items.sort((a, b) => {
          const aOro = isOroSinHabilidad(a.card) ? 1 : 0;
          const bOro = isOroSinHabilidad(b.card) ? 1 : 0;
          if (aOro !== bOro) return aOro - bOro;
          return a.card.name.localeCompare(b.card.name);
        });
      } else {
        items.sort((a, b) => a.card.name.localeCompare(b.card.name));
      }
    }
    return groups;
  }, [deckCards, cardById]);

  const sortedTypeKeys = TYPE_ORDER.filter((t) => deckByType[t]).concat(
    Object.keys(deckByType).filter((t) => !TYPE_ORDER.includes(t)),
  );

  // Sidedeck grouped by type (shown separately, excluded from stats)
  const sideByType = useMemo(() => {
    const groups: Record<string, { card: CollectionCard; count: number }[]> = {};
    for (const [idStr, count] of Object.entries(sideDeckCards)) {
      if (count <= 0) continue;
      const card = cardById.get(Number(idStr));
      if (!card) continue;
      const rawType = card.type ?? 'Otro';
      const t = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push({ card, count });
    }
    for (const items of Object.values(groups)) {
      items.sort((a, b) => a.card.name.localeCompare(b.card.name));
    }
    return groups;
  }, [sideDeckCards, cardById]);

  const sideSortedTypeKeys = TYPE_ORDER.filter((t) => sideByType[t]).concat(
    Object.keys(sideByType).filter((t) => !TYPE_ORDER.includes(t)),
  );

  const totalSideCount = useMemo(
    () => Object.values(sideDeckCards).reduce((a, b) => a + b, 0),
    [sideDeckCards],
  );

  const totalDeckCount = useMemo(
    () => Object.values(deckCards).reduce((a, b) => a + b, 0),
    [deckCards],
  );

  const countByType = (type: string) =>
    deckByType[type]?.reduce((s, { count }) => s + count, 0) ?? 0;

  const costDistribution = useMemo(() => {
    const counts = new Map<number, { total: number; byType: Record<CostChartType, number> }>();
    for (const [idStr, copies] of Object.entries(deckCards)) {
      if (copies <= 0) continue;
      const card = cardById.get(Number(idStr));
      if (!card || card.cost == null) continue;
      const byTypeDefault: Record<CostChartType, number> = {
        Oro: 0,
        Aliado: 0,
        Totem: 0,
        Talisman: 0,
        Arma: 0,
      };
      const bucket = counts.get(card.cost) ?? { total: 0, byType: byTypeDefault };
      bucket.total += copies;
      const normalizedType = normalizeChartType(card.type);
      if (normalizedType) bucket.byType[normalizedType] += copies;
      counts.set(card.cost, bucket);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([cost, data]) => ({ cost, count: data.total, byType: data.byType }));
  }, [deckCards, cardById]);

  const maxCostCount = Math.max(1, ...costDistribution.map((item) => item.count));

  // Edition badge (for pb-edicion only)
  const editionSlug = subformat === 'pb-edicion' ? (RACE_TO_EDITION[race] ?? null) : null;
  const editionLabel = editionSlug ? (EDITION_LABELS[editionSlug] ?? editionSlug) : null;

  // Flattened lists (same order as grouped view) for the grid view mode
  const flatMainItems = useMemo(
    () => sortedTypeKeys.flatMap((t) => deckByType[t]),
    [sortedTypeKeys, deckByType],
  );
  const flatSideItems = useMemo(
    () => sideSortedTypeKeys.flatMap((t) => sideByType[t]),
    [sideSortedTypeKeys, sideByType],
  );

  // Cards are rendered a bit smaller for the tablet/mobile export formats
  // (resolution is preserved via the pixel ratio used during capture)
  const exportCardWidth = exporting
    ? exportRatio === 'mobile'
      ? 72
      : exportRatio === 'tablet'
        ? 82
        : CARD_WIDTH
    : CARD_WIDTH;
  const exportStackOffset = exporting
    ? exportRatio === 'mobile'
      ? 10
      : exportRatio === 'tablet'
        ? 11
        : STACK_OFFSET
    : STACK_OFFSET;
  const exportCardHeight = Math.round(exportCardWidth / 0.72);

  const renderCardStack = (card: CollectionCard, count: number, cardW: number, stackOff: number) => {
    const stackWidth = cardW + (count - 1) * stackOff;
    return (
      <div
        key={card.id}
        className={styles.cardStack}
        style={{ width: `${stackWidth}px` }}
        onClick={() => setSelectedCard(card)}
        title={count > 1 ? `${card.name} ×${count}` : card.name}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={styles.stackedCard}
            style={{ left: `${i * stackOff}px`, zIndex: i }}
          >
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className={styles.cardImg} loading="lazy" />
            ) : (
              <div className={styles.cardPlaceholder}>{card.name}</div>
            )}
          </div>
        ))}
        {count > 1 && <span className={styles.countBadge}>×{count}</span>}
      </div>
    );
  };

  const handleExport = useCallback(async () => {
    if (exporting) return;
    // Setting `exporting` mounts a hidden, off-screen copy with the chosen
    // options (see render), so the visible page is never resized.
    setExporting(true);
    // Wait for React to commit and the browser to paint the off-screen copy
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
    );
    const node = exportRef.current;
    if (!node) {
      setExporting(false);
      setShowExportModal(false);
      return;
    }
    try {
      // Wait until every card image inside the export copy has loaded, otherwise
      // the capture can come out blank on slower / mobile connections.
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              }),
        ),
      );

      // Mobile browsers (iOS Safari especially) cap canvas size (~4096px per
      // side, ~16.7M px total). Scale the pixel ratio down so we stay under
      // that limit while keeping the best quality the device allows.
      const w = node.scrollWidth || node.getBoundingClientRect().width;
      const h = node.scrollHeight || node.getBoundingClientRect().height;
      const MAX_SIDE = 4096;
      const MAX_AREA = 16_777_216;
      let pixelRatio = 3;
      if (w > 0 && h > 0) {
        pixelRatio = Math.min(
          pixelRatio,
          MAX_SIDE / w,
          MAX_SIDE / h,
          Math.sqrt(MAX_AREA / (w * h)),
        );
        pixelRatio = Math.max(1, pixelRatio);
      }

      // skipFonts avoids embedding heavy @font-face data (which produces a huge
      // SVG that low-memory mobile browsers fail to rasterize) and also silences
      // the cross-origin (Google Fonts) CORS errors from stylesheet scanning.
      const options = { cacheBust: true, backgroundColor: '#2D2D2D', skipFonts: true } as const;
      let blob = await withTimeout(toBlob(node, { ...options, pixelRatio }), 30_000);
      // Fallback: if the device still couldn't allocate the canvas, retry at 1x.
      if (!blob && pixelRatio > 1) {
        blob = await withTimeout(toBlob(node, { ...options, pixelRatio: 1 }), 30_000);
      }
      if (!blob) throw new Error('El navegador no pudo generar la imagen.');

      const safeName = (deck?.name ?? 'mazo').trim().replace(/[^\w-]+/g, '_') || 'mazo';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = url;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      console.error('No se pudo exportar la imagen del mazo', err);
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  }, [exporting, deck]);

  const openExportModal = () => {
    setExportView(viewMode);
    setExportRatio('desktop');
    setExportIncludeSide(true);
    setShowExportModal(true);
  };

  // authorName is set from profiles table in useEffect

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

  const exportRatioClass = exportRatio === 'desktop'
    ? styles.ratioDesktop
    : exportRatio === 'tablet'
      ? styles.ratioTablet
      : styles.ratioMobile;

  // Full deck body (header + cards + stats + branding). Rendered once for the
  // visible page and again, off-screen, for the exported image — so the visible
  // page is never resized while exporting.
  const renderDeckBody = (
    view: 'grouped' | 'grid',
    includeSide: boolean,
    cardW: number,
    stackOff: number,
  ) => (
    <>
      {/* Deck header */}
      <div className={styles.deckHeader}>
        <div className={styles.deckHeaderMain}>
          <h1 className={styles.deckTitle}>{deck.name}</h1>
          <div className={styles.badgesRow}>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${format === 'pb' ? styles.badgePb : styles.badgeFx}`}>
                {FORMAT_LABELS[format] ?? format}
              </span>
              <span className={styles.badge}>{SUBFORMAT_LABELS[subformat] ?? subformat}</span>
              {isDraft && <span className={styles.badge}>Borrador</span>}
              {race && <span className={styles.badge}>{race}</span>}
              {editionLabel && <span className={`${styles.badge} ${styles.badgeEdition}`}>{editionLabel}</span>}
            </div>
            <span className={styles.authorLabel}>por <strong>{authorName}</strong></span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Card container */}
        <div className={styles.cardContainer}>
          {sortedTypeKeys.length === 0 ? (
            <p className={styles.emptyDeck}>Este mazo no tiene cartas.</p>
          ) : view === 'grouped' ? (
            sortedTypeKeys.map((type) => {
              const items = deckByType[type];
              const groupTotal = items.reduce((s, i) => s + i.count, 0);
              return (
                <div key={type} className={styles.typeGroup}>
                  <div className={styles.typeHeader}>
                    <span className={styles.typeLabel}>{TYPE_DISPLAY[type] ?? type}</span>
                    <span className={styles.typeCount}>{groupTotal}</span>
                  </div>
                  <div className={styles.cardsRow}>
                    {items.map(({ card, count }) => renderCardStack(card, count, cardW, stackOff))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.cardsRow}>
              {flatMainItems.map(({ card, count }) => renderCardStack(card, count, cardW, stackOff))}
            </div>
          )}

          {/* Sidedeck (shown separately, excluded from stats) */}
          {sideSortedTypeKeys.length > 0 && includeSide && (
            <div className={styles.sideDeckBlock}>
              <div className={styles.sideDeckDivider}>
                <span className={styles.sideDeckTitle}>Sidedeck</span>
                <span className={styles.sideDeckCount}>{totalSideCount} cartas</span>
              </div>
              {view === 'grouped' ? (
                sideSortedTypeKeys.map((type) => {
                  const items = sideByType[type];
                  const groupTotal = items.reduce((s, i) => s + i.count, 0);
                  return (
                    <div key={type} className={styles.typeGroup}>
                      <div className={styles.typeHeader}>
                        <span className={styles.typeLabel}>{TYPE_DISPLAY[type] ?? type}</span>
                        <span className={styles.typeCount}>{groupTotal}</span>
                      </div>
                      <div className={styles.cardsRow}>
                        {items.map(({ card, count }) => renderCardStack(card, count, cardW, stackOff))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.cardsRow}>
                  {flatSideItems.map(({ card, count }) => renderCardStack(card, count, cardW, stackOff))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: stats + branding */}
        <div className={styles.rightColumn}>
          <aside className={styles.statsPanel}>
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>📊 Estadísticas de construcción</h3>
            <div className={styles.statsList}>
              {TYPE_STATS.map(({ type, label }) => {
                const n = countByType(type);
                return (
                  <div key={type} className={styles.statRow}>
                    <span className={styles.statLabel}>{label}</span>
                    <span className={`${styles.statCount} ${n > 0 ? styles.statCountActive : ''}`}>
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={styles.progressArea}>
              {totalDeckCount < DECK_SIZE && (
                <div className={styles.missingLabel}>
                  Falta {DECK_SIZE - totalDeckCount} para completar el mazo
                </div>
              )}
              {totalDeckCount > DECK_SIZE && (
                <div className={styles.overLabel}>
                  Te pasas por {totalDeckCount - DECK_SIZE} cartas
                </div>
              )}
              <div className={`${styles.countBadge2} ${
                totalDeckCount === DECK_SIZE
                  ? styles.countBadgeFull
                  : totalDeckCount > DECK_SIZE
                  ? styles.countBadgeOver
                  : ''
              }`}>
                {totalDeckCount} / {DECK_SIZE}
              </div>
            </div>

            <div className={styles.costChartSection}>
              <h4 className={styles.costChartTitle}>Distribución por costo</h4>
              <div className={styles.costChartHoverInfo}>
                {hoveredCostSegment
                  ? `Costo ${hoveredCostSegment.cost} · ${hoveredCostSegment.type}: ${hoveredCostSegment.count}`
                  : 'Pasa el cursor por un color para ver tipo y cantidad'}
              </div>
              {costDistribution.length === 0 ? (
                <div className={styles.costChartEmpty}>Aún no hay cartas para mostrar.</div>
              ) : (
                <div className={styles.costChart}>
                  <div className={styles.costChartHeaderRow}>
                    <span className={styles.costChartColHeader}>Costo</span>
                    <span className={styles.costChartColHeaderSpacer} aria-hidden />
                    <span className={styles.costChartColHeader} title="Cantidad">Cant.</span>
                  </div>
                  {costDistribution.map(({ cost, count, byType }) => {
                    const segments = COST_CHART_TYPES
                      .map((type) => ({ type, count: byType[type] }))
                      .filter((item) => item.count > 0);
                    const breakdown = segments
                      .map((item) => `${item.type}: ${item.count}`)
                      .join(' | ');
                    return (
                      <div key={cost} className={styles.costChartBarGroup}>
                        <span className={styles.costChartLabel}>{cost}</span>
                        <div className={styles.costChartBarTrack}>
                          <div
                            className={styles.costChartBar}
                            style={{ width: `${Math.max(8, (count / maxCostCount) * 100)}%` }}
                            title={`Costo ${cost}: ${count} carta${count === 1 ? '' : 's'}${breakdown ? ` (${breakdown})` : ''}`}
                            aria-label={`Costo ${cost}: ${count} carta${count === 1 ? '' : 's'}`}
                          >
                            {segments.map((item) => (
                              <div
                                key={`${cost}-${item.type}`}
                                className={`${styles.costChartSegment} ${styles[COST_CHART_SEGMENT_CLASS[item.type]]}`}
                                style={{ width: `${(item.count / count) * 100}%` }}
                                title={`${item.type}: ${item.count}`}
                                onMouseEnter={() =>
                                  setHoveredCostSegment({ cost, type: item.type, count: item.count })
                                }
                                onMouseLeave={() => setHoveredCostSegment(null)}
                              />
                            ))}
                          </div>
                        </div>
                        <span className={styles.costChartCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className={styles.costChartLegend}>
                {COST_CHART_TYPES.map((type) => (
                  <span key={type} className={styles.costChartLegendItem}>
                    <span
                      className={`${styles.costChartLegendSwatch} ${styles[COST_CHART_SEGMENT_CLASS[type]]}`}
                      aria-hidden="true"
                    />
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Validation */}
          {(rules.errors.length > 0 || rules.warnings.length > 0) && (
            <section className={styles.validationSection}>
              {rules.errors.map((e, i) => (
                <div key={i} className={styles.validationError}>✕ {e}</div>
              ))}
              {rules.warnings.map((w, i) => (
                <div key={i} className={styles.validationWarning}>ℹ {w}</div>
              ))}
            </section>
          )}
        </aside>

          {/* Branding shown below the stats panel */}
          <div className={styles.exportBrand}>
            <img src={MITOXICOS_LOADER_COLOR} alt="Mitoxicos" className={styles.brandLogo} />
            <span className={styles.brandText}>mitoxicos.cl</span>
          </div>
        </div>
      </div>
    </>
  );

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
            onClick={openExportModal}
            disabled={exporting}
          >
            📷 Exportar imagen
          </button>
        </div>
      </div>

      {/* Visible deck — never resized while exporting */}
      <div className={styles.exportArea}>
        {renderDeckBody(viewMode, true, CARD_WIDTH, STACK_OFFSET)}
      </div>

      {/* Off-screen copy captured for the exported image. The offset lives on
          the wrapper; the captured node itself keeps normal positioning so
          html-to-image renders its content at the origin. */}
      {exporting && (
        <div className={styles.exportOffscreen} aria-hidden="true">
          <div
            ref={exportRef}
            className={`${styles.exportArea} ${styles.exportPadded} ${exportRatioClass}`}
            style={{
              '--card-w': `${exportCardWidth}px`,
              '--card-h': `${exportCardHeight}px`,
            } as CSSProperties}
          >
            {renderDeckBody(exportView, exportIncludeSide, exportCardWidth, exportStackOffset)}
          </div>
        </div>
      )}

      {showExportModal && (
        <div
          className={styles.exportModalOverlay}
          onClick={() => !exporting && setShowExportModal(false)}
        >
          <div className={styles.exportModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.exportModalClose}
              onClick={() => setShowExportModal(false)}
              disabled={exporting}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <h3 className={styles.exportModalTitle}>Exportar imagen</h3>

            <div className={styles.exportField}>
              <span className={styles.exportFieldLabel}>Vista de las cartas</span>
              <div className={styles.optionRow}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${exportView === 'grouped' ? styles.optionBtnActive : ''}`}
                  onClick={() => setExportView('grouped')}
                  disabled={exporting}
                >
                  Agrupado
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${exportView === 'grid' ? styles.optionBtnActive : ''}`}
                  onClick={() => setExportView('grid')}
                  disabled={exporting}
                >
                  Grilla
                </button>
              </div>
            </div>

            <div className={styles.exportField}>
              <span className={styles.exportFieldLabel}>Formato de pantalla</span>
              <div className={styles.optionRow}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${exportRatio === 'desktop' ? styles.optionBtnActive : ''}`}
                  onClick={() => setExportRatio('desktop')}
                  disabled={exporting}
                >
                  🖥️ Escritorio
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${exportRatio === 'tablet' ? styles.optionBtnActive : ''}`}
                  onClick={() => setExportRatio('tablet')}
                  disabled={exporting}
                >
                  📔 Tablet
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${exportRatio === 'mobile' ? styles.optionBtnActive : ''}`}
                  onClick={() => setExportRatio('mobile')}
                  disabled={exporting}
                >
                  📱 Móvil
                </button>
              </div>
            </div>

            {totalSideCount > 0 && (
              <div className={styles.exportField}>
                <div className={styles.switchRow}>
                  <span className={styles.exportFieldLabel}>Incluir sidedeck</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={exportIncludeSide}
                    aria-label="Incluir sidedeck"
                    className={`${styles.switch} ${exportIncludeSide ? styles.switchOn : ''}`}
                    onClick={() => setExportIncludeSide((v) => !v)}
                    disabled={exporting}
                  >
                    <span className={styles.switchKnob} />
                  </button>
                </div>
              </div>
            )}

            <div className={styles.exportModalFooter}>
              <button
                type="button"
                className={styles.exportCancelBtn}
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.exportConfirmBtn}
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <span className={styles.btnSpinner} aria-hidden="true" />
                    Generando...
                  </>
                ) : (
                  '📷 Exportar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
