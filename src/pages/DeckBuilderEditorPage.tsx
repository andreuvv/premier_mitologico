import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import { useBanlist } from '../hooks/useBanlist';
import { useDeckRules, DeckSubformat } from '../hooks/useDeckRules';
import { useUserDecks } from '../hooks/useUserDecks';
import { useAuth } from '../hooks/useAuth';import CardDetailModal from '../components/CardDetailModal';
import styles from './DeckBuilderEditorPage.module.css';

const DECK_SIZE = 50;
const CARDS_PER_PAGE = 75;

// Auto-select edition for pb-edicion based on race
const RACE_TO_EDITION: Record<string, string> = {
  // Espada Sagrada
  Faerie: 'espada-sagrada', Dragon: 'espada-sagrada', Caballero: 'espada-sagrada',
  // Helénica
  Titan: 'helenica', Olimpico: 'helenica', Heroe: 'helenica',
  // Hijos de Daana
  Desafiante: 'hijos-de-daana', Defensor: 'hijos-de-daana', Sombra: 'hijos-de-daana',
  // Dominios de Ra
  Eterno: 'dominios-de-ra', Sacerdote: 'dominios-de-ra', Faraon: 'dominios-de-ra',
};

const TYPE_TABS = [
  { value: '', label: 'Todos' },
  { value: 'Aliado', label: 'Aliados' },
  { value: 'Talisman', label: 'Talismanes' },
  { value: 'Totem', label: 'Tótems' },
  { value: 'Arma', label: 'Armas' },
  { value: 'Oro', label: 'Oros' },
];

const TYPE_STATS = [
  { type: 'Aliado',   label: 'Aliados' },
  { type: 'Arma',     label: 'Armas' },
  { type: 'Talisman', label: 'Talismanes' },
  { type: 'Totem',    label: 'Tótems' },
  { type: 'Oro',      label: 'Oros' },
];

const TYPE_DISPLAY: Record<string, string> = {
  Aliado:   'Aliados',
  Arma:     'Armas',
  Talisman: 'Talismanes',
  Totem:    'Tótems',
  Oro:      'Oros',
};

const TYPE_ORDER = ['Aliado', 'Arma', 'Talisman', 'Totem', 'Oro'];

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

function isOroSinHabilidad(card: { effect?: string }): boolean {
  const text = stripHtml(card.effect ?? '').toLowerCase();
  return text === '' || text.includes('oro sin habilidad');
}

const normalizeStr = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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

export default function DeckBuilderEditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const formatParam = searchParams.get('format') ?? 'pb';
  const subformat = (searchParams.get('subformat') ?? (formatParam === 'pb' ? 'pb-libre' : 'fx-libre')) as DeckSubformat;
  const race = searchParams.get('race') ?? '';
  const initialName = searchParams.get('name') ?? 'Nuevo Mazo';
  const urlDeckId = searchParams.get('deckId') ?? null;

  const format =
    formatParam === 'fx'
      ? CollectionFormat.FURIA_EXTENDIDO
      : CollectionFormat.PRIMER_BLOQUE;

  const { user } = useAuth();
  const { saveDeck, loadDeck, saveStatus, saveError } = useUserDecks();

  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deckCards, setDeckCards] = useState<Record<number, number>>({});
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState<string | undefined>(undefined);
  const [headerZoom, setHeaderZoom] = useState(1);
  const [headerPosX, setHeaderPosX] = useState(50);
  const [headerPosY, setHeaderPosY] = useState(50);
  const [deckId] = useState<string | null>(urlDeckId);

  // For pb-edicion: user picks the edition from a dropdown in the editor header
  // Auto-select based on race if available
  const autoEdition = subformat === 'pb-edicion' ? (RACE_TO_EDITION[race] ?? null) : null;
  const [lockedEdition, setLockedEdition] = useState<string | null>(autoEdition);

  // Card detail modal
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [costFilter, setCostFilter] = useState('');
  const [attackFilter, setAttackFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    loadCollectionCards(format)
      .then((data) => {
        setAllCards(data.data.CardCatalog.cards);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [format]);

  // If editing an existing deck, load its cards once allCards are ready
  useEffect(() => {
    if (!urlDeckId || allCards.length === 0) return;
    loadDeck(urlDeckId).then((deck) => {
      if (deck) {
        setDeckCards(deck.cards);
        setName(deck.name);
        setIsPublic(deck.is_public ?? false);
        setHeaderImageUrl(deck.headerImageUrl);
        setHeaderZoom(deck.headerZoom ?? 1);
        setHeaderPosX(deck.headerPosX ?? 50);
        setHeaderPosY(deck.headerPosY ?? 50);
      }
    });
  // Run only once when allCards first become available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards.length === 0 ? '' : urlDeckId]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, costFilter, attackFilter]);

  // Banlist
  const { banlist } = useBanlist(formatParam as 'pb' | 'fx', subformat);

  // Deck rules
  const rules = useDeckRules({
    subformat,
    race,
    allCards,
    deckCards,
    banlist,
    lockedEdition,
  });

  // ── Filtered cards ────────────────────────────────────────────────────────
  const filteredCards = useMemo(() => {
    let cards = allCards.filter(rules.isCardVisible);
    const q = search.trim();
    if (q) {
      const norm = normalizeStr(q);
      cards = cards.filter(
        (c) =>
          normalizeStr(c.name).includes(norm) ||
          c.collectorCode.toLowerCase().includes(q.toLowerCase()),
      );
    }
    if (typeFilter) {
      cards = cards.filter(
        (c) => c.type?.toUpperCase() === typeFilter.toUpperCase(),
      );
    }
    if (costFilter !== '') {
      cards = cards.filter((c) => c.cost === parseInt(costFilter, 10));
    }
    if (attackFilter !== '') {
      cards = cards.filter((c) => c.attack === parseInt(attackFilter, 10));
    }
    // Group same-name cards together so different designs/editions of the
    // same card appear side by side. Sort by normalized name first, then
    // by edition slug as a secondary key.
    cards.sort((a, b) => {
      const na = normalizeStr(a.name);
      const nb = normalizeStr(b.name);
      if (na !== nb) return na.localeCompare(nb);
      return (a.edition?.slug ?? '').localeCompare(b.edition?.slug ?? '');
    });
    return cards;
  }, [allCards, search, typeFilter, costFilter, attackFilter, rules.isCardVisible]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  const paginatedCards = filteredCards.slice(
    (page - 1) * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE,
  );

  // ── Deck helpers ──────────────────────────────────────────────────────────
  const totalDeckCount = useMemo(
    () => Object.values(deckCards).reduce((a, b) => a + b, 0),
    [deckCards],
  );

  const addCard = (card: CollectionCard) => {
    if (!rules.canAdd(card)) return;
    setDeckCards((prev) => ({ ...prev, [card.id]: (prev[card.id] ?? 0) + 1 }));
  };

  const removeCard = (cardId: number) => {
    setDeckCards((prev) => {
      const next = { ...prev };
      if ((next[cardId] ?? 0) <= 1) delete next[cardId];
      else next[cardId]--;
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    const id = await saveDeck({
      deckId,
      userId: user.id,
      name: name.trim() || 'Nuevo Mazo',
      isPublic,
      headerImageUrl,
      headerZoom,
      headerPosX,
      headerPosY,
      format: formatParam as 'pb' | 'fx',
      subformat,
      race,
      cards: deckCards,
    });
    if (id) {
      navigate('/deck-builder');
    }
  };

  // ── Deck list (with card objects) ─────────────────────────────────────────
  const cardById = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards],
  );

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
    // Sort: Oros con habilidad first, then sin habilidad; others alphabetically
    for (const [type, items] of Object.entries(groups)) {
      if (type === 'Oro') {
        items.sort((a, b) => {
          const aOro = isOroSinHabilidad(a.card) ? 1 : 0;
          const bOro = isOroSinHabilidad(b.card) ? 1 : 0;
          if (aOro !== bOro) return aOro - bOro;
          return a.card.name.localeCompare(b.card.name, 'es');
        });
      } else {
        items.sort((a, b) => a.card.name.localeCompare(b.card.name, 'es'));
      }
    }
    return groups;
  }, [deckCards, cardById]);

  const countByType = (type: string) =>
    deckByType[type]?.reduce((s, { count }) => s + count, 0) ?? 0;

  // ── Filter options ────────────────────────────────────────────────────────
  const costOptions = useMemo(
    () =>
      Array.from(new Set(allCards.map((c) => c.cost).filter((c) => c != null))).sort(
        (a, b) => a - b,
      ),
    [allCards],
  );

  const attackOptions = useMemo(
    () =>
      Array.from(
        new Set(allCards.map((c) => c.attack).filter((a) => a != null && a > 0)),
      ).sort((a, b) => a - b),
    [allCards],
  );

  const formatLabel = formatParam === 'fx' ? 'Furia Extendido' : 'Primer Bloque';
  const subformatLabel =
    subformat === 'pb-edicion' ? 'Racial Edición' :
    subformat === 'pb-libre'  ? 'Racial Libre' :
    subformat === 'fx-vcr'    ? 'VCR' : 'Racial Libre';

  // Edition options for pb-edicion (derived from loaded cards, excluding Drácula)
  const editionOptions = useMemo(() => {
    if (subformat !== 'pb-edicion') return [];
    const seen = new Map<string, { slug: string; name: string }>();
    for (const c of allCards) {
      const slug = c.edition?.slug;
      if (slug && slug !== 'dracula-inferno' && !seen.has(slug)) {
        seen.set(slug, { slug, name: c.edition.name });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [allCards, subformat]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Cargando cartas...</p>
      </div>
    );
  }

  const sortedTypeKeys = TYPE_ORDER.filter((t) => deckByType[t]).concat(
    Object.keys(deckByType).filter((t) => !TYPE_ORDER.includes(t)),
  );

  return (
    <div className={styles.page}>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            <span className={styles.deckIcon}>✦</span>
            <span className={styles.deckLabel}>NUEVO MAZO</span>
          </div>
          <input
            className={styles.nameInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dale un nombre a tu baraja"
            maxLength={100}
          />
          <div className={styles.tagRow}>
            <span className={styles.tag}>🎮 <strong>{formatLabel}</strong></span>
            <span className={styles.tag}>📋 <strong>{subformatLabel}</strong></span>
            <span className={styles.tag}>🔖 Raza: <strong>{race}</strong></span>
          </div>
          {/* Edition picker for pb-edicion */}
          {subformat === 'pb-edicion' && (
            <div className={styles.editionPickerRow}>
              <span className={styles.editionPickerLabel}>Edición:</span>
              <select
                className={styles.editionPickerSelect}
                value={lockedEdition ?? ''}
                onChange={(e) => setLockedEdition(e.target.value || null)}
                disabled={autoEdition !== null}
              >
                <option value="">— Selecciona una edición —</option>
                {editionOptions.map((ed) => (
                  <option key={ed.slug} value={ed.slug}>{ed.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <label className={styles.publicToggle}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={saveStatus === 'saving'}
            />
            <span className={styles.publicToggleSlider} />
            <span className={styles.publicToggleText}>{isPublic ? 'Público' : 'Privado'}</span>
          </label>
          <button
            className={styles.backButton}
            onClick={() => navigate('/deck-builder')}
          >
            ← Cambiar selección
          </button>
          <button
            className={`${styles.saveButton} ${saveStatus === 'saved' ? styles.saveButtonSaved : saveStatus === 'error' ? styles.saveButtonError : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !user}
            title={!user ? 'Inicia sesión para guardar' : saveError ?? undefined}
          >
            {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'saved' ? '✓ Guardado' : saveStatus === 'error' ? '✕ Error' : '💾 Guardar'}
          </button>
        </div>
      </div>

      {/* ── Saving overlay ──────────────────────────────────────────────── */}
      {saveStatus === 'saving' && (
        <div className={styles.savingOverlay}>
          <div className={styles.savingSpinner} />
          <span>Guardando mazo...</span>
        </div>
      )}

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className={styles.layout}>
        {/* ── Left: card browser ──────────────────────────────────────────── */}
        <div className={styles.cardBrowser}>
          {/* Search row */}
          <div className={styles.searchRow}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                placeholder="Buscar cartas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.pageInfo}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              <span>
                {page}/{totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
              <span className={styles.pageRange}>
                {(page - 1) * CARDS_PER_PAGE + 1}–
                {Math.min(page * CARDS_PER_PAGE, filteredCards.length)} de{' '}
                {filteredCards.length}
              </span>
            </div>
          </div>

          {/* Type tabs */}
          <div className={styles.typeTabs}>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`${styles.typeTab} ${typeFilter === tab.value ? styles.typeTabActive : ''}`}
                onClick={() => setTypeFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className={styles.filtersRow}>
            <select
              className={styles.filterSelect}
              value={costFilter}
              onChange={(e) => setCostFilter(e.target.value)}
            >
              <option value="">Todo coste</option>
              {costOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={attackFilter}
              onChange={(e) => setAttackFilter(e.target.value)}
            >
              <option value="">Toda fuerza</option>
              {attackOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Card grid */}
          <div className={styles.cardGrid}>
            {paginatedCards.map((card) => {
              const count = deckCards[card.id] ?? 0;
              const groupCount = rules.getGroupCount(card);
              const hardMax = rules.getHardMax(card);
              const canAddMore = rules.canAdd(card);
              const isBanned = hardMax === 0;
              const isUnique = card.unique === true;
              const maxLabel = hardMax === Infinity ? '∞' : String(hardMax);
              return (
                <div
                  key={card.id}
                  className={`${styles.cardItem} ${count > 0 ? styles.cardInDeck : ''} ${isBanned ? styles.cardBanned : ''}`}
                >
                  <div
                    className={styles.cardImageWrapper}
                    onClick={() => setSelectedCard(card)}
                    title="Ver detalle"
                    style={{ cursor: 'pointer' }}
                  >
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className={styles.cardImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.cardPlaceholder}>{card.name}</div>
                    )}
                    {count > 0 && (
                      <div className={styles.cardCountBadge}>{count}</div>
                    )}                    {isBanned && (
                      <div className={styles.bannedOverlay}>PROHIBIDA</div>
                    )}
                    {isUnique && (
                      <div className={styles.uniqueBadge}>ÚNICA</div>
                    )}
                  </div>
                  <div className={styles.cardControls}>
                    <button
                      className={styles.btnMinus}
                      onClick={() => removeCard(card.id)}
                      disabled={count === 0}
                    >
                      −
                    </button>
                    <span className={styles.cardCountText}>
                      {groupCount}/{maxLabel}
                    </span>
                    <button
                      className={styles.btnPlus}
                      onClick={() => addCard(card)}
                      disabled={!canAddMore}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationBtn}
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                ← Primera
              </button>
              <button
                className={styles.paginationBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <span className={styles.paginationLabel}>
                Página {page} de {totalPages}
              </span>
              <button
                className={styles.paginationBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </button>
              <button
                className={styles.paginationBtn}
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Última →
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <aside className={styles.sidePanel}>
          {/* Stats */}
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
              <div
                className={`${styles.countBadge} ${
                  totalDeckCount === DECK_SIZE
                    ? styles.countBadgeFull
                    : totalDeckCount > DECK_SIZE
                    ? styles.countBadgeOver
                    : ''
                }`}
              >
                {totalDeckCount} / {DECK_SIZE}
              </div>
            </div>
          </section>

          {/* Validation */}
          {(rules.errors.length > 0 || rules.warnings.length > 0) && (
            <section className={styles.validationSection}>
              {rules.errors.map((e, i) => (
                <div key={i} className={styles.validationError}>
                  ✕ {e}
                </div>
              ))}
              {rules.warnings.map((w, i) => (
                <div key={i} className={styles.validationWarning}>
                  ℹ {w}
                </div>
              ))}
            </section>
          )}

          {/* Deck card list */}
          <section className={styles.deckSection}>
            <h3 className={styles.sectionTitle}>🃏 Cartas del mazo</h3>
            <p className={styles.coverHint}>
              {headerImageUrl
                ? 'Portada activa. Presiona ★ en otra carta para cambiarla o en la misma para quitarla.'
                : 'Tip: presiona ★ en una carta del mazo para usarla como portada.'}
            </p>
            {headerImageUrl && (
              <div className={styles.coverControls}>
                <div className={styles.coverPreview}>
                  <div
                    className={styles.coverPreviewImage}
                    style={{
                      backgroundImage: `url(${headerImageUrl})`,
                      ...getCoverImageStyle(headerZoom, headerPosX, headerPosY),
                    }}
                    aria-label="Vista previa portada"
                  />
                </div>
                <label className={styles.coverControlRow}>
                  <span>Zoom ({headerZoom.toFixed(2)}x)</span>
                  <input
                    type="range"
                    min={1}
                    max={2}
                    step={0.01}
                    value={headerZoom}
                    onChange={(e) => setHeaderZoom(Number(e.target.value))}
                  />
                </label>
                <label className={styles.coverControlRow}>
                  <span>Posición horizontal ({Math.round(headerPosX)}%)</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={headerPosX}
                    onChange={(e) => setHeaderPosX(Number(e.target.value))}
                  />
                </label>
                <label className={styles.coverControlRow}>
                  <span>Posición vertical ({Math.round(headerPosY)}%)</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={headerPosY}
                    onChange={(e) => setHeaderPosY(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className={styles.coverResetBtn}
                  onClick={() => {
                    setHeaderZoom(1);
                    setHeaderPosX(50);
                    setHeaderPosY(50);
                  }}
                >
                  Reset portada
                </button>
              </div>
            )}
            {sortedTypeKeys.length === 0 ? (
              <p className={styles.deckEmpty}>Agrega cartas desde la grilla</p>
            ) : (
              sortedTypeKeys.map((type) => {
                const items = deckByType[type];
                const groupCount = items.reduce((s, i) => s + i.count, 0);
                return (
                  <div key={type} className={styles.deckTypeGroup}>
                    <div className={styles.deckTypeHeader}>
                      <span>{TYPE_DISPLAY[type] ?? type}</span>
                      <span className={styles.deckTypeCount}>{groupCount}</span>
                    </div>
                    {items.map(({ card, count }) => {
                      const isCover = headerImageUrl === card.imageUrl;
                      return (
                        <div key={card.id} className={`${styles.deckCardRow} ${isCover ? styles.deckCardRowCover : ''}`}>
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className={styles.deckCardThumb}
                          />
                          <span className={styles.deckCardName}>{card.name}</span>
                          <button
                            className={`${styles.coverBtn} ${isCover ? styles.coverBtnActive : ''}`}
                            title={isCover ? 'Quitar portada' : 'Usar como portada'}
                            onClick={() => setHeaderImageUrl(isCover ? undefined : card.imageUrl)}
                          >
                            ★
                          </button>
                          <div className={styles.deckCardControls}>
                            <button
                              className={styles.deckMinus}
                              onClick={() => removeCard(card.id)}
                            >
                              −
                            </button>
                            <span className={styles.deckCardCount}>{count}</span>
                            <button
                              className={styles.deckPlus}
                              onClick={() => addCard(card)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </section>
        </aside>
      </div>

      {/* ── Card detail modal ───────────────────────────────────────────── */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
