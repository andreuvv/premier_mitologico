import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserDecks, UserDeck, PublicDeck } from '../hooks/useUserDecks';
import { useIsAdmin } from '../hooks/useIsAdmin';
import SectionLoader from '../components/loading/SectionLoader';
import NewDeckModal from '../components/NewDeckModal';
import { Format, Subformat } from '../config/deckFormats';
import { getTabFromPath, sortDecksByDate, type ExploreSortBy } from './deck-home/deckHomeUtils';
import { useDeckFilters } from './deck-home/useDeckFilters';
import DeckFiltersBar from './deck-home/DeckFiltersBar';
import MyDeckCard from './deck-home/MyDeckCard';
import ExploreDeckCard from './deck-home/ExploreDeckCard';
import styles from './DeckBuilderHomePage.module.css';

export default function DeckBuilderHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tab = getTabFromPath(location.pathname);
  const { loadDecks, loadAllDecks, deleteDeck } = useUserDecks();
  const [showModal, setShowModal] = useState(false);
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exploreDecks, setExploreDecks] = useState<PublicDeck[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreLoaded, setExploreLoaded] = useState(false);
  const { isAdmin } = useIsAdmin();
  const myFilters = useDeckFilters();
  const exploreFilters = useDeckFilters();
  const [exploreSortBy, setExploreSortBy] = useState<ExploreSortBy>('updated');

  const fetchDecks = useCallback(async () => {
    if (!user) return;
    setDecksLoading(true);
    const loaded = await loadDecks(user.id);
    setDecks(loaded);
    setDecksLoading(false);
  }, [user, loadDecks]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Load explore decks only once when the tab is first opened
  useEffect(() => {
    if (tab !== 'explore' || exploreLoaded) return;
    setExploreLoading(true);
    loadAllDecks()
      .then((decks) => { setExploreDecks(decks); setExploreLoaded(true); })
      .finally(() => setExploreLoading(false));
  }, [tab, exploreLoaded, loadAllDecks]);

  const handleDelete = async (deckId: string) => {
    if (!window.confirm('¿Eliminar este mazo? Esta acción no se puede deshacer.')) return;
    setDeletingId(deckId);
    await deleteDeck(deckId);
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setDeletingId(null);
  };

  const handleEdit = (deck: UserDeck) => {
    navigate(
      `/deck-builder/editor?deckId=${deck.id}&format=${deck.format}&subformat=${encodeURIComponent(deck.subformat)}&race=${encodeURIComponent(deck.race)}&name=${encodeURIComponent(deck.name)}`
    );
  };

  const handleView = (deck: UserDeck) => {
    navigate(`/deck-builder/viewer?deckId=${deck.id}`);
  };

  const handleCreate = (format: Format, subformat: Subformat, race: string, name: string) => {
    navigate(
      `/deck-builder/editor?format=${format}&subformat=${subformat}&race=${encodeURIComponent(race)}&name=${encodeURIComponent(name)}`
    );
  };

  const filteredMyDecks = decks.filter(myFilters.matches);
  const filteredExploreDecks = sortDecksByDate(exploreDecks.filter(exploreFilters.matches), exploreSortBy);

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Deck Builder</h1>
          <p className={styles.pageSubtitle}>Construye y gestiona tus mazos</p>
        </div>
        <div className={styles.headerActions}>
          {isAdmin && (
            <button
              className={styles.localEditorButton}
              onClick={() => navigate('/deck-builder/local-json-editor')}
            >
              Editor JSON Local
            </button>
          )}
          {user && (
            <button className={styles.createButton} onClick={() => setShowModal(true)}>
              + Nuevo Mazo
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.navTabs}>
        <Link
          to="/deck-builder/mis-mazos"
          className={`${styles.navTab} ${tab === 'myDecks' ? styles.navTabMyDecksActive : ''}`}
        >
          Mis Mazos
        </Link>
        <Link
          to="/deck-builder/explorar"
          className={`${styles.navTab} ${tab === 'explore' ? styles.navTabExploreActive : ''}`}
        >
          Explorar
        </Link>
      </div>

      {/* Tab: Mis Mazos */}
      {tab === 'myDecks' && (
        <>
          {!user ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Inicia sesión para ver y crear tus mazos.</p>
            </div>
          ) : decksLoading ? (
            <SectionLoader message="Cargando mazos..." />
          ) : decks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🃏</div>
              <p className={styles.emptyText}>No tienes mazos guardados todavía.</p>
              <button className={styles.createButton} onClick={() => setShowModal(true)}>
                + Crear mi primer mazo
              </button>
            </div>
          ) : (
            <>
              <DeckFiltersBar filters={myFilters} />

              {filteredMyDecks.length === 0 ? (
                <div className={styles.emptyStateInline}>
                  <p className={styles.emptyText}>No se encontraron mazos con esos filtros.</p>
                </div>
              ) : (
                <div className={styles.deckGrid}>
                  {filteredMyDecks.map((deck) => (
                    <MyDeckCard
                      key={deck.id}
                      deck={deck}
                      deleting={deletingId === deck.id}
                      onView={() => handleView(deck)}
                      onEdit={() => handleEdit(deck)}
                      onDelete={() => handleDelete(deck.id)}
                    />
                  ))}
                </div>
              )}

              <div className={styles.stats}>
                Mostrando {filteredMyDecks.length} de {decks.length} mazos
              </div>
            </>
          )}
        </>
      )}

      {/* Tab: Explorar */}
      {tab === 'explore' && (
        <>
          {exploreLoading ? (
            <SectionLoader message="Cargando mazos..." />
          ) : exploreDecks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <p className={styles.emptyText}>No hay mazos públicos todavía.</p>
            </div>
          ) : (
            <>
              <DeckFiltersBar filters={exploreFilters} inputsClassName={styles.filtersInputsRowExplore}>
                <select
                  className={styles.filterSelect}
                  value={exploreSortBy}
                  onChange={(e) => setExploreSortBy(e.target.value as ExploreSortBy)}
                  aria-label="Ordenar mazos"
                >
                  <option value="updated">Modificado recientemente</option>
                  <option value="created">Creado recientemente</option>
                </select>
              </DeckFiltersBar>

              {filteredExploreDecks.length === 0 ? (
                <div className={styles.emptyStateInline}>
                  <p className={styles.emptyText}>No se encontraron mazos con esos filtros.</p>
                </div>
              ) : (
                <div className={styles.deckGrid}>
                  {filteredExploreDecks.map((deck) => (
                    <ExploreDeckCard key={deck.id} deck={deck} onView={() => handleView(deck)} />
                  ))}
                </div>
              )}

              <div className={styles.stats}>
                Mostrando {filteredExploreDecks.length} de {exploreDecks.length} mazos
              </div>
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <NewDeckModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
