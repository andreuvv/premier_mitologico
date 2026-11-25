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
import {
  DECK_SIZE,
  DeckTarget,
  RACE_TO_EDITION,
  buildEditorSnapshot,
  computeCostDistribution,
  countCards,
  decrementCard,
  groupDeckByType,
} from './deck-editor/deckEditorUtils';
import { useCardBrowserFilters } from './deck-editor/useCardBrowserFilters';
import EditorHeader from './deck-editor/EditorHeader';
import ExitConfirmModal from './deck-editor/ExitConfirmModal';
import CardBrowser from './deck-editor/CardBrowser';
import EditorStatsPanel from './deck-editor/EditorStatsPanel';
import MainDeckList from './deck-editor/MainDeckList';
import SideDeckList from './deck-editor/SideDeckList';
import styles from './DeckBuilderEditorPage.module.css';

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
  const [target, setTarget] = useState<DeckTarget>('main');
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

  const showEditionBrowserFilter = subformat !== 'pb-edicion';

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

  const filters = useCardBrowserFilters(allCards, format, showEditionBrowserFilter, rules.isCardVisible);

  // ── Deck helpers ──────────────────────────────────────────────────────────
  const totalDeckCount = useMemo(() => countCards(deckCards), [deckCards]);
  const totalSideCount = useMemo(() => countCards(sideDeck), [sideDeck]);

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

  const removeFromMain = (cardId: number) => setDeckCards((prev) => decrementCard(prev, cardId));
  const removeFromSide = (cardId: number) => setSideDeck((prev) => decrementCard(prev, cardId));

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

  const deckPayload = (overrides: { isPublic: boolean; isDraft: boolean }) => ({
    deckId,
    userId: user!.id,
    name: name.trim() || 'Nuevo Mazo',
    ...overrides,
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

  const handleSave = async () => {
    if (!user) return;
    if (!isDraft && totalDeckCount !== DECK_SIZE) {
      return;
    }
    const id = await saveDeck(deckPayload({ isPublic: isDraft ? false : isPublic, isDraft }));
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
    const id = await saveDeck(deckPayload({ isPublic: false, isDraft: true }));
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

  // Main deck: Oros con habilidad first, then sin habilidad; others alphabetically.
  const deckByType = useMemo(() => groupDeckByType(deckCards, cardById, true), [deckCards, cardById]);
  // Sidedeck grouped by type (independent from main deck stats)
  const sideByType = useMemo(() => groupDeckByType(sideDeck, cardById, false), [sideDeck, cardById]);
  const costDistribution = useMemo(() => computeCostDistribution(deckCards, cardById), [deckCards, cardById]);

  // Edition options for pb-edicion. Drácula is reprints-only, and
  // Oros Iniciales Teams is usable in every edition, so neither is a lockable edition.
  const editionOptions = useMemo(() => {
    if (subformat !== 'pb-edicion') return [];
    const seen = new Map<string, { slug: string; name: string }>();
    for (const c of allCards) {
      const slug = c.edition?.slug;
      if (
        slug &&
        slug !== 'dracula-inferno' &&
        slug !== 'oros-iniciales-teams' &&
        !seen.has(slug)
      ) {
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

  return (
    <div className={styles.page}>
      <EditorHeader
        name={name}
        onNameChange={setName}
        formatParam={formatParam}
        subformat={subformat}
        race={race}
        isDraft={isDraft}
        onDraftChange={setIsDraft}
        isPublic={isPublic}
        onPublicChange={setIsPublic}
        lockedEdition={lockedEdition}
        onLockedEditionChange={setLockedEdition}
        editionLocked={autoEdition !== null}
        editionOptions={editionOptions}
        saveStatus={saveStatus}
        saveError={saveError}
        canSave={!(saveStatus === 'saving' || !user || (!isDraft && totalDeckCount !== DECK_SIZE))}
        hasUser={Boolean(user)}
        totalDeckCount={totalDeckCount}
        onChangeSection={() => setShowSectionModal(true)}
        onExit={handleExitRequest}
        onSave={handleSave}
      />

      {/* ── Saving overlay ──────────────────────────────────────────────── */}
      {saveStatus === 'saving' && (
        <div className={styles.savingOverlay}>
          <div className={styles.savingSpinner} />
          <span>Guardando mazo...</span>
        </div>
      )}

      {showExitModal && (
        <ExitConfirmModal
          totalDeckCount={totalDeckCount}
          hasUser={Boolean(user)}
          saving={saveStatus === 'saving'}
          onClose={() => setShowExitModal(false)}
          onExitWithoutSaving={handleExitWithoutSaving}
          onSaveDraftAndExit={handleSaveDraftAndExit}
        />
      )}

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className={styles.layout}>
        <CardBrowser
          filters={filters}
          showEditionBrowserFilter={showEditionBrowserFilter}
          target={target}
          onTargetChange={setTarget}
          deckCards={deckCards}
          sideDeck={sideDeck}
          totalDeckCount={totalDeckCount}
          totalSideCount={totalSideCount}
          sideMax={sideMax}
          getGroupCount={rules.getGroupCount}
          getHardMax={rules.getHardMax}
          canAddToMain={canAddToMain}
          canAddToSide={canAddToSide}
          isInCollection={(card) => Boolean(user && ownedCardIds.has(card.id))}
          onSelectCard={setSelectedCard}
          onAdd={addCard}
          onRemove={removeCard}
        />

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <aside className={styles.sidePanel}>
          <EditorStatsPanel
            deckByType={deckByType}
            totalDeckCount={totalDeckCount}
            isDraft={isDraft}
            costDistribution={costDistribution}
          />

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

          <MainDeckList
            deckByType={deckByType}
            cover={{ imageUrl: headerImageUrl, zoom: headerZoom, posX: headerPosX, posY: headerPosY }}
            onCoverImageChange={setHeaderImageUrl}
            onZoomChange={setHeaderZoom}
            onPosXChange={setHeaderPosX}
            onPosYChange={setHeaderPosY}
            onSelectCard={setSelectedCard}
            onAdd={addCard}
            onRemove={removeCard}
          />

          <SideDeckList
            sideByType={sideByType}
            totalSideCount={totalSideCount}
            sideMax={sideMax}
            canAdd={canAddToSide}
            onSelectCard={setSelectedCard}
            onAdd={addToSide}
            onRemove={removeFromSide}
          />
        </aside>
      </div>

      {/* ── Card detail modal ───────────────────────────────────────────── */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        cards={filters.filteredCards}
        onNavigate={setSelectedCard}
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
