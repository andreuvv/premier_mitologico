import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import { useBanlist } from '../hooks/useBanlist';
import { useDeckRules, DeckSubformat } from '../hooks/useDeckRules';
import { useUserDecks } from '../hooks/useUserDecks';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import CardDetailModal from '../components/CardDetailModal';
import NewDeckModal from '../components/NewDeckModal';
import { Format, Subformat, SIDEDECK_SIZE } from '../config/deckFormats';
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
const COST_CHART_TYPES = ['Oro', 'Aliado', 'Totem', 'Talisman', 'Arma'] as const;
type CostChartType = typeof COST_CHART_TYPES[number];
const COST_CHART_SEGMENT_CLASS: Record<CostChartType, string> = {
  Oro: 'costChartSegmentOro',
  Aliado: 'costChartSegmentAliado',
  Totem: 'costChartSegmentTotem',
  Talisman: 'costChartSegmentTalisman',
  Arma: 'costChartSegmentArma',
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

function isOroSinHabilidad(card: { effect?: string }): boolean {
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

function serializeDeckCards(cards: Record<number, number>): string {
  return Object.entries(cards)
    .filter(([, count]) => count > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([id, count]) => `${id}:${count}`)
    .join('|');
}

function buildEditorSnapshot(options: {
  name: string;
  isPublic: boolean;
  isDraft: boolean;
  headerImageUrl?: string;
  headerZoom: number;
  headerPosX: number;
  headerPosY: number;
  lockedEdition: string | null;
  formatParam: Format;
  subformat: string;
  race: string;
  deckCards: Record<number, number>;
  sideDeck: Record<number, number>;
}): string {
  return [
    options.name.trim(),
    options.isPublic ? '1' : '0',
    options.isDraft ? '1' : '0',
    options.headerImageUrl ?? '',
    options.headerZoom.toFixed(4),
    options.headerPosX.toFixed(2),
    options.headerPosY.toFixed(2),
    options.lockedEdition ?? '',
    options.formatParam,
    options.subformat,
    options.race,
    serializeDeckCards(options.deckCards),
    serializeDeckCards(options.sideDeck),
  ].join('::');
}

export default function DeckBuilderEditorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialFormatParam = (searchParams.get('format') ?? 'pb') as Format;
  const initialSubformat = (searchParams.get('subformat') ?? (initialFormatParam === 'pb' ? 'pb-libre' : 'fx-libre')) as DeckSubformat;
  const initialRace = searchParams.get('race') ?? '';
  const initialName = searchParams.get('name') ?? 'Nuevo Mazo';
  const urlDeckId = searchParams.get('deckId') ?? null;

  // Section (format/subformat/race) is editable in-place via the "Cambiar sección" modal.
  const [formatParam, setFormatParam] = useState<Format>(initialFormatParam);
  const [subformat, setSubformat] = useState<DeckSubformat>(initialSubformat);
  const [race, setRace] = useState(initialRace);

  const format =
    formatParam === 'fx'
      ? CollectionFormat.FURIA_EXTENDIDO
      : CollectionFormat.PRIMER_BLOQUE;

  const { user } = useAuth();
  const { saveDeck, loadDeck, saveStatus, saveError } = useUserDecks();
  const { ownedCardIds, loadedFormat: collectionLoadedFormat, loadCollection } = useUserCollection(format);

  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deckCards, setDeckCards] = useState<Record<number, number>>({});
  const [sideDeck, setSideDeck] = useState<Record<number, number>>({});
  // Which deck the +/- buttons in the card browser act on.
  const [target, setTarget] = useState<'main' | 'side'>('main');
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState<string | undefined>(undefined);
  const [headerZoom, setHeaderZoom] = useState(1);
  const [headerPosX, setHeaderPosX] = useState(50);
  const [headerPosY, setHeaderPosY] = useState(50);
  const [deckId] = useState<string | null>(urlDeckId);
  const [showExitModal, setShowExitModal] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);

  // For pb-edicion: user picks the edition from a dropdown in the editor header
  // Auto-select based on race if available
  const autoEdition = subformat === 'pb-edicion' ? (RACE_TO_EDITION[race] ?? null) : null;
  const [lockedEdition, setLockedEdition] = useState<string | null>(autoEdition);

  // Card detail modal
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [editionFilter, setEditionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [oroFilter, setOroFilter] = useState<'all' | 'with' | 'without'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [costFilter, setCostFilter] = useState('');
  const [attackFilter, setAttackFilter] = useState('');
  const [hoveredCostSegment, setHoveredCostSegment] = useState<{
    cost: number;
    type: CostChartType;
    count: number;
  } | null>(null);

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
        setSideDeck(deck.sideDeck ?? {});
        setName(deck.name);
        setIsPublic(deck.is_public ?? false);
        setIsDraft(deck.is_draft ?? false);
        setHeaderImageUrl(deck.headerImageUrl);
        setHeaderZoom(deck.headerZoom ?? 1);
        setHeaderPosX(deck.headerPosX ?? 50);
        setHeaderPosY(deck.headerPosY ?? 50);
        setLastSavedSnapshot(
          buildEditorSnapshot({
            name: deck.name,
            isPublic: deck.is_public ?? false,
            isDraft: deck.is_draft ?? false,
            headerImageUrl: deck.headerImageUrl,
            headerZoom: deck.headerZoom ?? 1,
            headerPosX: deck.headerPosX ?? 50,
            headerPosY: deck.headerPosY ?? 50,
            lockedEdition: autoEdition,
            formatParam,
            subformat,
            race,
            deckCards: deck.cards,
            sideDeck: deck.sideDeck ?? {},
          }),
        );
      }
    });
  // Run only once when allCards first become available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards.length === 0 ? '' : urlDeckId]);

  const currentSnapshot = useMemo(
    () =>
      buildEditorSnapshot({
        name,
        isPublic,
        isDraft,
        headerImageUrl,
        headerZoom,
        headerPosX,
        headerPosY,
        lockedEdition,
        formatParam,
        subformat,
        race,
        deckCards,
        sideDeck,
      }),
    [name, isPublic, isDraft, headerImageUrl, headerZoom, headerPosX, headerPosY, lockedEdition, formatParam, subformat, race, deckCards, sideDeck],
  );

  useEffect(() => {
    if (loading) return;
    if (lastSavedSnapshot !== null) return;
    setLastSavedSnapshot(currentSnapshot);
  }, [loading, lastSavedSnapshot, currentSnapshot]);

  const hasUnsavedChanges = lastSavedSnapshot !== null && currentSnapshot !== lastSavedSnapshot;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const onPopState = () => {
      if (hasUnsavedChanges) {
        setShowExitModal(true);
        window.history.pushState({ deckBuilderGuard: true }, '', window.location.href);
        return;
      }
      navigate('/deck-builder');
    };

    window.history.pushState({ deckBuilderGuard: true }, '', window.location.href);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [hasUnsavedChanges, navigate]);

  useEffect(() => {
    if (user && collectionLoadedFormat !== format) {
      loadCollection();
    }
  }, [user, format, collectionLoadedFormat, loadCollection]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, editionFilter, typeFilter, oroFilter, frequencyFilter, costFilter, attackFilter]);

  const showEditionBrowserFilter = subformat !== 'pb-edicion';

  useEffect(() => {
    if (!showEditionBrowserFilter) setEditionFilter('');
  }, [showEditionBrowserFilter]);

  // Banlist
  const { banlist } = useBanlist(formatParam as 'pb' | 'fx', subformat);

  // Deck rules (copy limits count main deck + sidedeck combined)
  const rules = useDeckRules({
    subformat,
    race,
    allCards,
    deckCards,
    banlist,
    isDraft,
    lockedEdition,
    sideDeck,
  });

  const sideMax = SIDEDECK_SIZE[formatParam];

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
    if (editionFilter) {
      if (format === CollectionFormat.PRIMER_BLOQUE) {
        cards = cards.filter((c) => c.edition?.name === editionFilter);
      } else {
        cards = cards.filter(
          (c) =>
            c.product?.productName === editionFilter &&
            c.product?.productType === 'Edición',
        );
      }
    }
    if (typeFilter === 'Oro' && oroFilter !== 'all') {
      cards = cards.filter((c) => {
        if (c.type?.toUpperCase() !== 'ORO') return false;
        const sinHabilidad = isOroSinHabilidad(c);
        return oroFilter === 'with' ? !sinHabilidad : sinHabilidad;
      });
    }
    if (frequencyFilter) {
      cards = cards.filter((c) => c.frequency === frequencyFilter);
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
  }, [allCards, search, editionFilter, format, typeFilter, oroFilter, frequencyFilter, costFilter, attackFilter, rules.isCardVisible]);

  const navigateCardDetail = (card: CollectionCard) => {
    setSelectedCard(card);
  };

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

  const totalSideCount = useMemo(
    () => Object.values(sideDeck).reduce((a, b) => a + b, 0),
    [sideDeck],
  );

  useEffect(() => {
    if (isDraft && isPublic) {
      setIsPublic(false);
    }
  }, [isDraft, isPublic]);

  // Can add to main deck: respects combined copy limit + 50-card cap (unless draft).
  const canAddToMain = (card: CollectionCard) => rules.canAdd(card);
  // Can add to sidedeck: respects combined copy limit + sidedeck size cap.
  const canAddToSide = (card: CollectionCard) =>
    rules.availableToAdd(card) > 0 && totalSideCount < sideMax;

  const addToMain = (card: CollectionCard) => {
    if (!canAddToMain(card)) return;
    setDeckCards((prev) => ({ ...prev, [card.id]: (prev[card.id] ?? 0) + 1 }));
  };

  const addToSide = (card: CollectionCard) => {
    if (!canAddToSide(card)) return;
    setSideDeck((prev) => ({ ...prev, [card.id]: (prev[card.id] ?? 0) + 1 }));
  };

  const removeFromMain = (cardId: number) => {
    setDeckCards((prev) => {
      const next = { ...prev };
      if ((next[cardId] ?? 0) <= 1) delete next[cardId];
      else next[cardId]--;
      return next;
    });
  };

  const removeFromSide = (cardId: number) => {
    setSideDeck((prev) => {
      const next = { ...prev };
      if ((next[cardId] ?? 0) <= 1) delete next[cardId];
      else next[cardId]--;
      return next;
    });
  };

  // Browser +/- act on the currently selected target.
  const addCard = (card: CollectionCard) => (target === 'side' ? addToSide(card) : addToMain(card));
  const removeCard = (cardId: number) => (target === 'side' ? removeFromSide(cardId) : removeFromMain(cardId));

  const applySectionChange = (
    nextFormat: Format,
    nextSubformat: Subformat,
    nextRace: string,
    nextName: string,
  ) => {
    const formatChanged = nextFormat !== formatParam;
    setFormatParam(nextFormat);
    setSubformat(nextSubformat as DeckSubformat);
    setRace(nextRace);
    setName(nextName);
    setLockedEdition(
      nextSubformat === 'pb-edicion' ? (RACE_TO_EDITION[nextRace] ?? null) : null,
    );
    // Different format ⇒ different card catalog ⇒ existing cards are invalid.
    if (formatChanged) {
      setDeckCards({});
      setSideDeck({});
      setHeaderImageUrl(undefined);
      setTarget('main');
    }
    // Keep the URL in sync so a refresh preserves the chosen section.
    const params = new URLSearchParams(searchParams);
    params.set('format', nextFormat);
    params.set('subformat', nextSubformat);
    params.set('race', nextRace);
    params.set('name', nextName);
    setSearchParams(params, { replace: true });
    setShowSectionModal(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!isDraft && totalDeckCount !== DECK_SIZE) {
      return;
    }
    const id = await saveDeck({
      deckId,
      userId: user.id,
      name: name.trim() || 'Nuevo Mazo',
      isPublic: isDraft ? false : isPublic,
      isDraft,
      headerImageUrl,
      headerZoom,
      headerPosX,
      headerPosY,
      format: formatParam,
      subformat,
      race,
      cards: deckCards,
      sideDeck,
    });
    if (id) {
      setLastSavedSnapshot(currentSnapshot);
      navigate('/deck-builder');
    }
  };

  const handleExitRequest = () => {
    if (!hasUnsavedChanges) {
      navigate('/deck-builder');
      return;
    }
    setShowExitModal(true);
  };

  const handleExitWithoutSaving = () => {
    setShowExitModal(false);
    navigate('/deck-builder');
  };

  const handleSaveDraftAndExit = async () => {
    if (!user || saveStatus === 'saving') return;
    const id = await saveDeck({
      deckId,
      userId: user.id,
      name: name.trim() || 'Nuevo Mazo',
      isPublic: false,
      isDraft: true,
      headerImageUrl,
      headerZoom,
      headerPosX,
      headerPosY,
      format: formatParam,
      subformat,
      race,
      cards: deckCards,
      sideDeck,
    });
    if (id) {
      const draftSnapshot = buildEditorSnapshot({
        name,
        isPublic: false,
        isDraft: true,
        headerImageUrl,
        headerZoom,
        headerPosX,
        headerPosY,
        lockedEdition,
        formatParam,
        subformat,
        race,
        deckCards,
        sideDeck,
      });
      setLastSavedSnapshot(draftSnapshot);
      setShowExitModal(false);
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

  // Sidedeck grouped by type (independent from main deck stats)
  const sideByType = useMemo(() => {
    const groups: Record<string, { card: CollectionCard; count: number }[]> = {};
    for (const [idStr, count] of Object.entries(sideDeck)) {
      if (count <= 0) continue;
      const card = cardById.get(Number(idStr));
      if (!card) continue;
      const rawType = card.type ?? 'Otro';
      const t = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push({ card, count });
    }
    for (const items of Object.values(groups)) {
      items.sort((a, b) => a.card.name.localeCompare(b.card.name, 'es'));
    }
    return groups;
  }, [sideDeck, cardById]);

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
      if (normalizedType) {
        bucket.byType[normalizedType] += copies;
      }
      counts.set(card.cost, bucket);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([cost, data]) => ({ cost, count: data.total, byType: data.byType }));
  }, [deckCards, cardById]);

  const maxCostCount = Math.max(1, ...costDistribution.map((item) => item.count));

  // ── Filter options ────────────────────────────────────────────────────────
  const browserEditionOptions = useMemo(() => {
    if (format === CollectionFormat.PRIMER_BLOQUE) {
      return Array.from(
        new Map(
          allCards
            .filter((c) => c.edition?.name)
            .map((c) => [c.edition!.name, c.edition!.name]),
        ).values(),
      ).sort((a, b) => a.localeCompare(b, 'es'));
    }
    return Array.from(
      new Map(
        allCards
          .filter((c) => c.product?.productType === 'Edición')
          .map((c) => [c.product!.productName, c.product!.productName]),
      ).values(),
    ).sort((a, b) => a.localeCompare(b, 'es'));
  }, [allCards, format]);

  const costOptions = useMemo(
    () =>
      Array.from(new Set(allCards.map((c) => c.cost).filter((c) => c != null))).sort(
        (a, b) => a - b,
      ),
    [allCards],
  );

  const frequencyOptions = useMemo(
    () =>
      Array.from(new Set(allCards.map((c) => c.frequency).filter((f) => Boolean(f)))).sort(
        (a, b) => a.localeCompare(b, 'es'),
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
    subformat === 'pb-libre' ? 'Racial Libre' :
    subformat === 'fx-vcr' ? 'VCR' :
    subformat === 'fx-ragnarok' ? 'Racial Ragnarok' :
    'Racial Libre';

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

  const sideSortedTypeKeys = TYPE_ORDER.filter((t) => sideByType[t]).concat(
    Object.keys(sideByType).filter((t) => !TYPE_ORDER.includes(t)),
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
            {isDraft && <span className={`${styles.tag} ${styles.draftTag}`}>📝 Modo Borrador</span>}
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
              checked={!isDraft && isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={saveStatus === 'saving' || isDraft}
            />
            <span className={styles.publicToggleSlider} />
            <span className={styles.publicToggleText}>{!isDraft && isPublic ? 'Público' : 'Privado'}</span>
          </label>
          <label className={styles.draftToggle}>
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              disabled={saveStatus === 'saving'}
            />
            <span className={styles.draftToggleSlider} />
            <span className={styles.draftToggleText}>Modo Borrador</span>
          </label>
          <button
            className={styles.changeSectionButton}
            onClick={() => setShowSectionModal(true)}
            title="Cambiar formato, subformato o raza"
          >
            ⚙ Cambiar sección
          </button>
          <button
            className={styles.backButton}
            onClick={handleExitRequest}
          >
            ← Salir
          </button>
          <button
            className={`${styles.saveButton} ${saveStatus === 'saved' ? styles.saveButtonSaved : saveStatus === 'error' ? styles.saveButtonError : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !user || (!isDraft && totalDeckCount !== DECK_SIZE)}
            title={!user ? 'Inicia sesión para guardar' : !isDraft && totalDeckCount !== DECK_SIZE ? 'El mazo debe tener 50 cartas para publicarse' : saveError ?? undefined}
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

      {showExitModal && (
        <div className={styles.exitConfirmOverlay} onClick={() => setShowExitModal(false)}>
          <div className={styles.exitConfirmModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.exitConfirmClose}
              onClick={() => setShowExitModal(false)}
              aria-label="Cerrar"
              type="button"
            >
              ✕
            </button>
            <h3 className={styles.exitConfirmTitle}>¿Seguro que quieres salir sin guardar?</h3>
            <p className={styles.exitConfirmText}>
              Tienes cambios sin guardar en este mazo.
            </p>
            {totalDeckCount !== DECK_SIZE && (
              <p className={styles.exitConfirmWarning}>
                El mazo no está completo: tienes {totalDeckCount} de {DECK_SIZE} cartas.
                Si guardas al salir, se guardará como borrador privado.
              </p>
            )}
            {!user && (
              <p className={styles.exitConfirmWarning}>
                No hay sesión iniciada. Solo podrás salir sin guardar.
              </p>
            )}
            <div className={styles.exitConfirmActions}>
              <button
                type="button"
                className={styles.exitWithoutSaveButton}
                onClick={handleExitWithoutSaving}
                disabled={saveStatus === 'saving'}
              >
                Salir sin Guardar
              </button>
              <button
                type="button"
                className={styles.saveDraftExitButton}
                onClick={handleSaveDraftAndExit}
                disabled={saveStatus === 'saving' || !user}
                title={!user ? 'Inicia sesión para guardar como borrador' : undefined}
              >
                Guardar como Borrador y Salir
              </button>
            </div>
          </div>
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

          {/* Target selector: main deck vs sidedeck */}
          <div className={styles.targetToggle}>
            <span className={styles.targetToggleLabel}>Agregar a:</span>
            <button
              type="button"
              className={`${styles.targetBtn} ${target === 'main' ? styles.targetBtnActiveMain : ''}`}
              onClick={() => setTarget('main')}
              aria-pressed={target === 'main'}
            >
              Mazo principal <span className={styles.targetBtnCount}>{totalDeckCount}/{DECK_SIZE}</span>
            </button>
            <button
              type="button"
              className={`${styles.targetBtn} ${target === 'side' ? styles.targetBtnActiveSide : ''}`}
              onClick={() => setTarget('side')}
              aria-pressed={target === 'side'}
            >
              Sidedeck <span className={styles.targetBtnCount}>{totalSideCount}/{sideMax}</span>
            </button>
          </div>

          {/* Type tabs */}
          <div className={styles.typeTabs}>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`${styles.typeTab} ${typeFilter === tab.value ? styles.typeTabActive : ''}`}
                onClick={() => {
                  setTypeFilter(tab.value);
                  if (tab.value !== 'Oro') setOroFilter('all');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className={styles.filtersRow}>
            {showEditionBrowserFilter && (
              <select
                className={styles.filterSelect}
                value={editionFilter}
                onChange={(e) => setEditionFilter(e.target.value)}
              >
                <option value="">Todas las ediciones</option>
                {browserEditionOptions.map((edition) => (
                  <option key={edition} value={edition}>
                    {edition}
                  </option>
                ))}
              </select>
            )}
            {typeFilter === 'Oro' && (
              <select
                className={styles.filterSelect}
                value={oroFilter}
                onChange={(e) => setOroFilter(e.target.value as 'all' | 'with' | 'without')}
              >
                <option value="all">Todos los oros</option>
                <option value="with">Con habilidad</option>
                <option value="without">Sin habilidad</option>
              </select>
            )}
            <select
              className={styles.filterSelect}
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
            >
              <option value="">Toda frecuencia</option>
              {frequencyOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
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
              const sideCount = sideDeck[card.id] ?? 0;
              const groupCount = rules.getGroupCount(card);
              const hardMax = rules.getHardMax(card);
              const canAddMore = target === 'side' ? canAddToSide(card) : canAddToMain(card);
              const targetCount = target === 'side' ? sideCount : count;
              const isBanned = hardMax === 0;
              const isUnique = card.unique === true;
              const isInCollection = Boolean(user && ownedCardIds.has(card.id));
              const maxLabel = hardMax === Infinity ? '∞' : String(hardMax);
              return (
                <div
                  key={card.id}
                  className={`${styles.cardItem} ${count > 0 ? styles.cardInDeck : ''} ${sideCount > 0 ? styles.cardInSide : ''} ${isBanned ? styles.cardBanned : ''}`}
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
                    )}
                    {sideCount > 0 && (
                      <div className={styles.cardSideBadge} title={`${sideCount} en sidedeck`}>S{sideCount}</div>
                    )}
                    {isBanned && (
                      <div className={styles.bannedOverlay}>PROHIBIDA</div>
                    )}
                    {isUnique && (
                      <div className={styles.uniqueBadge}>ÚNICA</div>
                    )}
                    {isInCollection && (
                      <div className={styles.collectionBadge}>En colección</div>
                    )}
                  </div>
                  <div className={styles.cardControls}>
                    <button
                      className={styles.btnMinus}
                      onClick={() => removeCard(card.id)}
                      disabled={targetCount === 0}
                      title={target === 'side' ? 'Quitar del sidedeck' : 'Quitar del mazo'}
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
                      title={target === 'side' ? 'Agregar al sidedeck' : 'Agregar al mazo'}
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
              {isDraft && (
                <div className={styles.draftNotice}>
                  Modo borrador activo: puedes superar las 50 cartas, pero el mazo quedará privado.
                </div>
              )}
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
                        <div
                          key={card.id}
                          className={`${styles.deckCardRow} ${isCover ? styles.deckCardRowCover : ''}`}
                          onClick={() => setSelectedCard(card)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedCard(card);
                            }
                          }}
                          title="Ver detalle"
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className={styles.deckCardThumb}
                          />
                          <span className={styles.deckCardName}>{card.name}</span>
                          <button
                            className={`${styles.coverBtn} ${isCover ? styles.coverBtnActive : ''}`}
                            title={isCover ? 'Quitar portada' : 'Usar como portada'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setHeaderImageUrl(isCover ? undefined : card.imageUrl);
                            }}
                          >
                            ★
                          </button>
                          <div className={styles.deckCardControls}>
                            <button
                              className={styles.deckMinus}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCard(card.id);
                              }}
                            >
                              −
                            </button>
                            <span className={styles.deckCardCount}>{count}</span>
                            <button
                              className={styles.deckPlus}
                              onClick={(e) => {
                                e.stopPropagation();
                                addCard(card);
                              }}
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

          {/* Sidedeck list */}
          <section className={styles.deckSection}>
            <div className={styles.sideSectionHeader}>
              <h3 className={styles.sectionTitle}>🔁 Sidedeck</h3>
              <span
                className={`${styles.sideCountBadge} ${totalSideCount > sideMax ? styles.sideCountBadgeOver : totalSideCount === sideMax ? styles.sideCountBadgeFull : ''}`}
              >
                {totalSideCount} / {sideMax}
              </span>
            </div>
            <p className={styles.coverHint}>
              Cartas de cambio (cualquier tipo). No cuentan en las estadísticas de construcción.
            </p>
            {totalSideCount > sideMax && (
              <div className={styles.validationError}>
                ✕ El sidedeck supera el máximo de {sideMax} cartas
              </div>
            )}
            {sideSortedTypeKeys.length === 0 ? (
              <p className={styles.deckEmpty}>
                Selecciona «Sidedeck» arriba y agrega cartas desde la grilla
              </p>
            ) : (
              sideSortedTypeKeys.map((type) => {
                const items = sideByType[type];
                const groupCount = items.reduce((s, i) => s + i.count, 0);
                return (
                  <div key={type} className={styles.deckTypeGroup}>
                    <div className={styles.deckTypeHeader}>
                      <span>{TYPE_DISPLAY[type] ?? type}</span>
                      <span className={styles.deckTypeCount}>{groupCount}</span>
                    </div>
                    {items.map(({ card, count }) => (
                      <div
                        key={card.id}
                        className={styles.deckCardRow}
                        onClick={() => setSelectedCard(card)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedCard(card);
                          }
                        }}
                        title="Ver detalle"
                      >
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className={styles.deckCardThumb}
                        />
                        <span className={styles.deckCardName}>{card.name}</span>
                        <div className={styles.deckCardControls}>
                          <button
                            className={styles.deckMinus}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromSide(card.id);
                            }}
                          >
                            −
                          </button>
                          <span className={styles.deckCardCount}>{count}</span>
                          <button
                            className={styles.deckPlus}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToSide(card);
                            }}
                            disabled={!canAddToSide(card)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
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
        cards={filteredCards}
        onNavigate={navigateCardDetail}
      />

      {/* ── Change section modal ─────────────────────────────────────────── */}
      {showSectionModal && (
        <NewDeckModal
          title="Cambiar sección"
          submitLabel="Aplicar cambios"
          initialFormat={formatParam}
          initialSubformat={subformat}
          initialRace={race}
          initialName={name}
          onClose={() => setShowSectionModal(false)}
          onSubmit={applySectionChange}
        />
      )}
    </div>
  );
}
