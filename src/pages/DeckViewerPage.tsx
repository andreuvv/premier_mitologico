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
};

const TYPE_ORDER = ['Aliado', 'Arma', 'Talisman', 'Totem', 'Oro'];
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

  // Derived from deck
  const format = (deck?.format ?? 'pb') as 'pb' | 'fx';
  const subformat = (deck?.subformat ?? 'pb-edicion') as DeckSubformat;
  const race = deck?.race ?? '';
  const deckCards = useMemo(() => deck?.cards ?? {}, [deck]);

  const { banlist } = useBanlist(format, subformat);
  const rules = useDeckRules({ subformat, race, allCards, deckCards, banlist, lockedEdition: null });

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
