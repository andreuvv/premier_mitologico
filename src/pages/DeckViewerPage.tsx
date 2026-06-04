import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import { useBanlist } from '../hooks/useBanlist';
import { useDeckRules, DeckSubformat } from '../hooks/useDeckRules';
import { useUserDecks, UserDeck } from '../hooks/useUserDecks';
import { supabase } from '../config/supabase';
import CardDetailModal from '../components/CardDetailModal';
import styles from './DeckViewerPage.module.css';

const DECK_SIZE = 50;
const STACK_OFFSET = 13; // px offset per stacked copy
const CARD_WIDTH = 100;  // px

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

  // Derived from deck
  const format = (deck?.format ?? 'pb') as 'pb' | 'fx';
  const subformat = (deck?.subformat ?? 'pb-edicion') as DeckSubformat;
  const race = deck?.race ?? '';
  const deckCards = useMemo(() => deck?.cards ?? {}, [deck]);
  const isDraft = deck?.is_draft ?? false;

  const { banlist } = useBanlist(format, subformat);
  const rules = useDeckRules({ subformat, race, allCards, deckCards, banlist, isDraft, lockedEdition: null });

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

  return (
    <div className={styles.page}>
      {/* Back button */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/deck-builder')}>
          ← Mis Mazos
        </button>
      </div>

      {/* Deck header */}
      <div className={styles.deckHeader}>
        <div className={styles.deckHeaderMain}>
          <h1 className={styles.deckTitle}>{deck.name}</h1>
          <div className={styles.badgesRow}>
            <div className={styles.badges}>
              <span className={styles.badge}>{FORMAT_LABELS[format] ?? format}</span>
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
        {/* Card groups */}
        <div className={styles.cardContainer}>
          {sortedTypeKeys.length === 0 ? (
            <p className={styles.emptyDeck}>Este mazo no tiene cartas.</p>
          ) : (
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
                    {items.map(({ card, count }) => {
                      const stackWidth = CARD_WIDTH + (count - 1) * STACK_OFFSET;
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
                              style={{
                                left: `${i * STACK_OFFSET}px`,
                                zIndex: i,
                              }}
                            >
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={card.name}
                                  className={styles.cardImg}
                                  loading="lazy"
                                />
                              ) : (
                                <div className={styles.cardPlaceholder}>{card.name}</div>
                              )}
                            </div>
                          ))}
                          {count > 1 && (
                            <span className={styles.countBadge}>×{count}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats panel */}
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
                  {costDistribution.map(({ cost, count, byType }) => {
                    const segments = COST_CHART_TYPES
                      .map((type) => ({ type, count: byType[type] }))
                      .filter((item) => item.count > 0);
                    const breakdown = segments
                      .map((item) => `${item.type}: ${item.count}`)
                      .join(' | ');
                    return (
                      <div key={cost} className={styles.costChartBarGroup}>
                        <div className={styles.costChartBarTrack}>
                          <div
                            className={styles.costChartBar}
                            style={{ height: `${Math.max(8, (count / maxCostCount) * 100)}%` }}
                            title={`Costo ${cost}: ${count} carta${count === 1 ? '' : 's'}${breakdown ? ` (${breakdown})` : ''}`}
                            aria-label={`Costo ${cost}: ${count} carta${count === 1 ? '' : 's'}`}
                          >
                            {segments.map((item) => (
                              <div
                                key={`${cost}-${item.type}`}
                                className={`${styles.costChartSegment} ${styles[COST_CHART_SEGMENT_CLASS[item.type]]}`}
                                style={{ height: `${(item.count / count) * 100}%` }}
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
                        <span className={styles.costChartLabel}>{cost}</span>
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
      </div>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
