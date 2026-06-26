import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserDecks, UserDeck, PublicDeck } from '../hooks/useUserDecks';
import { isCurrentUserBanlistAdmin } from '../services/monthlyBanlistService';
import styles from './DeckBuilderHomePage.module.css';

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

const PB_RACES = [
  'Caballero', 'Defensor', 'Desafiante', 'Dragon', 'Eterno',
  'Faerie', 'Faraon', 'Heroe', 'Olimpico', 'Sacerdote', 'Sombra', 'Titan',
];
const FX_RACES = [
  'Ancestral', 'Barbaro', 'Bestia', 'Caballero', 'Dragon',
  'Eterno', 'Guerrero', 'Heroe', 'Sacerdote', 'Sombra',
];
const FX_TOTEM_RACE = 'Tótem';

function getFxRacesForSubformat(subformat: Subformat): string[] {
  if (subformat === 'fx-libre' || subformat === 'fx-ragnarok') {
    return [...FX_RACES, FX_TOTEM_RACE];
  }
  return FX_RACES;
}

type Tab = 'myDecks' | 'explore';
type Format = 'pb' | 'fx';
type Subformat = 'pb-edicion' | 'pb-libre' | 'fx-vcr' | 'fx-libre' | 'fx-ragnarok';
type FormatFilter = 'all' | Format;
type SubformatFilter = 'all' | Subformat;

const PB_SUBFORMATS: { value: Subformat; label: string; desc: string }[] = [
  { value: 'pb-edicion', label: 'Racial Edición', desc: 'Solo cartas de una misma edición' },
  { value: 'pb-libre',   label: 'Racial Libre',   desc: 'Cartas de todas las ediciones PB' },
];

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
const FX_SUBFORMATS: { value: Subformat; label: string; desc: string }[] = [
  { value: 'fx-vcr',   label: 'VCR',         desc: 'Solo cartas Vasallo, Cortesano o Real' },
  { value: 'fx-libre', label: 'Racial Libre', desc: 'Cartas de todas las ediciones FX' },
  { value: 'fx-ragnarok', label: 'Racial Ragnarok', desc: 'Todas las cartas son únicas salvo Oros sin habilidad' },
];

const ALL_SUBFORMATS: { value: Subformat; label: string }[] = [
  { value: 'pb-edicion', label: 'Racial Edición' },
  { value: 'pb-libre', label: 'Racial Libre (PB)' },
  { value: 'fx-vcr', label: 'VCR' },
  { value: 'fx-libre', label: 'Racial Libre (FX)' },
  { value: 'fx-ragnarok', label: 'Racial Ragnarok (FX)' },
];

function normalizeStr(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchesDeckFilters(
  deck: Pick<UserDeck, 'format' | 'subformat' | 'race'>,
  formatFilter: FormatFilter,
  subformatFilter: SubformatFilter,
  raceFilter: string,
) {
  if (formatFilter !== 'all' && deck.format !== formatFilter) return false;
  if (subformatFilter !== 'all' && deck.subformat !== subformatFilter) return false;
  if (raceFilter.trim()) {
    const raceNorm = normalizeStr(deck.race ?? '');
    const queryNorm = normalizeStr(raceFilter.trim());
    if (raceNorm !== queryNorm) return false;
  }
  return true;
}

function getVisibleRaces(formatFilter: FormatFilter) {
  if (formatFilter === 'pb') return PB_RACES;
  if (formatFilter === 'fx') return [...FX_RACES, FX_TOTEM_RACE];
  return [...new Set([...PB_RACES, ...FX_RACES, FX_TOTEM_RACE])].sort((a, b) => a.localeCompare(b, 'es'));
}

function getSubformatLabel(subformat: string) {
  if (subformat === 'pb-edicion') return 'Racial Edición';
  if (subformat === 'pb-libre') return 'Racial Libre';
  if (subformat === 'fx-vcr') return 'VCR';
  if (subformat === 'fx-ragnarok') return 'Racial Ragnarok';
  return 'Racial Libre';
}

function formatDeckDate(dateString?: string | null): string {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  const day = String(date.getDate()).padStart(2, '0');
  const month = date
    .toLocaleDateString('es-ES', { month: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());
  const year = String(date.getFullYear());

  return `${day} ${month} ${year}`;
}

function getDeckDateLines(createdAt?: string | null, updatedAt?: string | null): string[] {
  const lines: string[] = [`Creado: ${formatDeckDate(createdAt)}`];

  if (createdAt && updatedAt) {
    const created = new Date(createdAt).getTime();
    const updated = new Date(updatedAt).getTime();
    if (!Number.isNaN(created) && !Number.isNaN(updated) && updated - created > 60_000) {
      lines.push(`Modificado: ${formatDeckDate(updatedAt)}`);
    }
  }

  return lines;
}

function getTabFromPath(pathname: string): Tab {
  return pathname.endsWith('/explorar') ? 'explore' : 'myDecks';
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface NewDeckModalProps {
  onClose: () => void;
  onCreate: (format: Format, subformat: Subformat, race: string, name: string) => void;
}

function NewDeckModal({ onClose, onCreate }: NewDeckModalProps) {
  const [format, setFormat] = useState<Format>('pb');
  const [subformat, setSubformat] = useState<Subformat>('pb-edicion');
  const [race, setRace] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const races = format === 'pb' ? PB_RACES : getFxRacesForSubformat(subformat);
  const subformats = format === 'pb' ? PB_SUBFORMATS : FX_SUBFORMATS;

  const handleFormatChange = (f: Format) => {
    setFormat(f);
    setSubformat(f === 'pb' ? 'pb-edicion' : 'fx-vcr');
    setRace('');
  };

  const handleSubformatChange = (sf: Subformat) => {
    setSubformat(sf);
    if (race === FX_TOTEM_RACE && sf === 'fx-vcr') setRace('');
  };

  const handleCreate = () => {
    setError(null);
    if (!name.trim()) { setError('Dale un nombre a tu mazo.'); return; }
    if (!race) { setError('Selecciona una raza.'); return; }
    onCreate(format, subformat, race, name.trim());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className={styles.modalTitle}>Nuevo Mazo</h2>

        {/* Nombre */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Nombre</label>
          <input
            className={styles.nameInput}
            type="text"
            placeholder="Ej: Mi mazo Caballero"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        {/* Formato */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Formato</label>
          <div className={styles.formatRow}>
            <button
              className={format === 'pb' ? styles.formatBtnActive : styles.formatBtn}
              onClick={() => handleFormatChange('pb')}
            >
              <span className={styles.formatIcon}>📖</span>
              <span className={styles.formatName}>Primer Bloque</span>
            </button>
            <button
              className={format === 'fx' ? styles.formatBtnActive : styles.formatBtn}
              onClick={() => handleFormatChange('fx')}
            >
              <span className={styles.formatIcon}>⚡</span>
              <span className={styles.formatName}>Furia Extendido</span>
            </button>
          </div>
        </div>

        {/* Subformato */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Subformato</label>
          <div className={styles.subformatRow}>
            {subformats.map(sf => (
              <button
                key={sf.value}
                className={subformat === sf.value ? styles.subformatBtnActive : styles.subformatBtn}
                onClick={() => handleSubformatChange(sf.value)}
              >
                <span className={styles.subformatName}>{sf.label}</span>
                <span className={styles.subformatDesc}>{sf.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Raza */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Raza</label>
          <div className={styles.raceGrid}>
            {races.map(r => (
              <button
                key={r}
                className={race === r ? styles.raceBtnActive : styles.raceBtn}
                onClick={() => setRace(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.modalError}>{error}</p>}

        <button className={styles.confirmButton} onClick={handleCreate}>
          Crear Mazo
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [myFormatFilter, setMyFormatFilter] = useState<FormatFilter>('all');
  const [mySubformatFilter, setMySubformatFilter] = useState<SubformatFilter>('all');
  const [myRaceFilter, setMyRaceFilter] = useState('');
  const [exploreFormatFilter, setExploreFormatFilter] = useState<FormatFilter>('all');
  const [exploreSubformatFilter, setExploreSubformatFilter] = useState<SubformatFilter>('all');
  const [exploreRaceFilter, setExploreRaceFilter] = useState('');

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

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    isCurrentUserBanlistAdmin(user.id)
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, [user]);

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

  const filteredMyDecks = useMemo(
    () =>
      decks.filter((deck) =>
        matchesDeckFilters(deck, myFormatFilter, mySubformatFilter, myRaceFilter),
      ),
    [decks, myFormatFilter, mySubformatFilter, myRaceFilter],
  );

  const filteredExploreDecks = useMemo(
    () =>
      exploreDecks.filter((deck) =>
        matchesDeckFilters(deck, exploreFormatFilter, exploreSubformatFilter, exploreRaceFilter),
      ),
    [exploreDecks, exploreFormatFilter, exploreSubformatFilter, exploreRaceFilter],
  );

  const visibleMySubformats = useMemo(() => {
    if (myFormatFilter === 'pb') {
      return ALL_SUBFORMATS.filter((s) => s.value === 'pb-edicion' || s.value === 'pb-libre');
    }
    if (myFormatFilter === 'fx') {
      return ALL_SUBFORMATS.filter((s) => s.value === 'fx-vcr' || s.value === 'fx-libre' || s.value === 'fx-ragnarok');
    }
    return ALL_SUBFORMATS;
  }, [myFormatFilter]);

  const visibleExploreSubformats = useMemo(() => {
    if (exploreFormatFilter === 'pb') {
      return ALL_SUBFORMATS.filter((s) => s.value === 'pb-edicion' || s.value === 'pb-libre');
    }
    if (exploreFormatFilter === 'fx') {
      return ALL_SUBFORMATS.filter((s) => s.value === 'fx-vcr' || s.value === 'fx-libre' || s.value === 'fx-ragnarok');
    }
    return ALL_SUBFORMATS;
  }, [exploreFormatFilter]);

  const visibleMyRaces = useMemo(() => getVisibleRaces(myFormatFilter), [myFormatFilter]);
  const visibleExploreRaces = useMemo(
    () => getVisibleRaces(exploreFormatFilter),
    [exploreFormatFilter],
  );

  useEffect(() => {
    if (myFormatFilter === 'pb' && mySubformatFilter !== 'all' && !mySubformatFilter.startsWith('pb-')) {
      setMySubformatFilter('all');
    }
    if (myFormatFilter === 'fx' && mySubformatFilter !== 'all' && !mySubformatFilter.startsWith('fx-')) {
      setMySubformatFilter('all');
    }
  }, [myFormatFilter, mySubformatFilter]);

  useEffect(() => {
    if (myRaceFilter && !visibleMyRaces.includes(myRaceFilter)) {
      setMyRaceFilter('');
    }
  }, [myRaceFilter, visibleMyRaces]);

  useEffect(() => {
    if (
      exploreFormatFilter === 'pb' &&
      exploreSubformatFilter !== 'all' &&
      !exploreSubformatFilter.startsWith('pb-')
    ) {
      setExploreSubformatFilter('all');
    }
    if (
      exploreFormatFilter === 'fx' &&
      exploreSubformatFilter !== 'all' &&
      !exploreSubformatFilter.startsWith('fx-')
    ) {
      setExploreSubformatFilter('all');
    }
  }, [exploreFormatFilter, exploreSubformatFilter]);

  useEffect(() => {
    if (exploreRaceFilter && !visibleExploreRaces.includes(exploreRaceFilter)) {
      setExploreRaceFilter('');
    }
  }, [exploreRaceFilter, visibleExploreRaces]);

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
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Cargando mazos...</p>
            </div>
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
              <div className={styles.filtersBar}>
                <div className={styles.formatFilterGroup}>
                  <button
                    className={`${myFormatFilter === 'all' ? styles.filterChipActive : styles.filterChip} ${styles.filterChipAll}`}
                    onClick={() => setMyFormatFilter('all')}
                  >
                    Todos
                  </button>
                  <button
                    className={`${myFormatFilter === 'pb' ? styles.filterChipActive : styles.filterChip} ${styles.filterChipPb}`}
                    onClick={() => setMyFormatFilter('pb')}
                  >
                    Primer Bloque
                  </button>
                  <button
                    className={`${myFormatFilter === 'fx' ? styles.filterChipActive : styles.filterChip} ${styles.filterChipFx}`}
                    onClick={() => setMyFormatFilter('fx')}
                  >
                    Furia Extendido
                  </button>
                </div>
                <div className={styles.filtersInputsRow}>
                  <select
                    className={styles.filterSelect}
                    value={mySubformatFilter}
                    onChange={(e) => setMySubformatFilter(e.target.value as SubformatFilter)}
                  >
                    <option value="all">Todos los subformatos</option>
                    {visibleMySubformats.map((sf) => (
                      <option key={sf.value} value={sf.value}>
                        {sf.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={styles.filterSelect}
                    value={myRaceFilter}
                    onChange={(e) => setMyRaceFilter(e.target.value)}
                  >
                    <option value="">Todas las razas</option>
                    {visibleMyRaces.map((race) => (
                      <option key={race} value={race}>
                        {race}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredMyDecks.length === 0 ? (
                <div className={styles.emptyStateInline}>
                  <p className={styles.emptyText}>No se encontraron mazos con esos filtros.</p>
                </div>
              ) : (
                <div className={styles.deckGrid}>
                  {filteredMyDecks.map((deck) => {
                const cardCount = Object.values(deck.cards).reduce((a, b) => a + b, 0);
                const formatLabel = deck.format === 'fx' ? 'Furia Extendido' : 'Primer Bloque';
                const subformatLabel = getSubformatLabel(deck.subformat);
                const dateLines = getDeckDateLines(deck.created_at, deck.updated_at);
                const formatTagClass = deck.format === 'fx' ? styles.deckCardTagFormatFx : styles.deckCardTagFormatPb;
                return (
                  <div key={deck.id} className={styles.deckCard} onClick={() => handleView(deck)} style={{ cursor: 'pointer' }}>
                    {deck.headerImageUrl && (
                      <div className={styles.deckCardCover}>
                        <div
                          className={styles.deckCardCoverImg}
                          style={{
                            backgroundImage: `url(${deck.headerImageUrl})`,
                            ...getCoverImageStyle(deck.headerZoom, deck.headerPosX, deck.headerPosY),
                          }}
                          aria-label="portada"
                        />
                      </div>
                    )}
                    <div className={styles.deckCardHeader}>
                      <h3 className={styles.deckCardName}>{deck.name}</h3>
                      <span className={`${styles.deckCardCount} ${cardCount === 50 ? styles.deckCardCountFull : ''}`}>
                        {cardCount}/50
                      </span>
                    </div>
                    <div className={styles.deckCardMeta}>
                      <span
                        className={`${styles.deckCardTag} ${deck.is_public ? styles.deckCardTagPublic : styles.deckCardTagPrivate}`}
                      >
                        {deck.is_public ? 'Público' : 'Privado'}
                      </span>
                      {deck.is_draft && (
                        <span className={`${styles.deckCardTag} ${styles.deckCardTagDraft}`}>
                          Borrador
                        </span>
                      )}
                      <span className={`${styles.deckCardTag} ${formatTagClass}`}>{formatLabel}</span>
                      <span className={`${styles.deckCardTag} ${formatTagClass}`}>{subformatLabel}</span>
                      {deck.race && <span className={`${styles.deckCardTag} ${styles.deckCardTagRace}`}>{deck.race}</span>}
                    </div>
                    <div className={styles.deckCardActions}>
                      <button
                        className={styles.deckEditBtn}
                        onClick={(e) => { e.stopPropagation(); handleEdit(deck); }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className={styles.deckDeleteBtn}
                        onClick={(e) => { e.stopPropagation(); handleDelete(deck.id); }}
                        disabled={deletingId === deck.id}
                      >
                        {deletingId === deck.id ? '...' : '🗑'}
                      </button>
                    </div>
                    <div className={styles.deckDateBlock}>
                      {dateLines.map((line) => (
                        <span key={line} className={styles.deckDateLabel}>{line}</span>
                      ))}
                    </div>
                  </div>
                );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Tab: Explorar */}
      {tab === 'explore' && (
        <>
          {exploreLoading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Cargando mazos...</p>
            </div>
          ) : exploreDecks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <p className={styles.emptyText}>No hay mazos públicos todavía.</p>
            </div>
          ) : (
            <>
              <div className={styles.filtersBar}>
                <div className={styles.formatFilterGroup}>
                  <button
                    className={`${exploreFormatFilter === 'all' ? styles.filterChipActive : styles.filterChip} ${styles.filterChipAll}`}
                    onClick={() => setExploreFormatFilter('all')}
                  >
                    Todos
                  </button>
                  <button
                    className={`${exploreFormatFilter === 'pb' ? styles.filterChipActive : styles.filterChip} ${styles.filterChipPb}`}
                    onClick={() => setExploreFormatFilter('pb')}
                  >
                    Primer Bloque
                  </button>
                  <button
                    className={`${exploreFormatFilter === 'fx' ? styles.filterChipActive : styles.filterChip} ${styles.filterChipFx}`}
                    onClick={() => setExploreFormatFilter('fx')}
                  >
                    Furia Extendido
                  </button>
                </div>
                <div className={styles.filtersInputsRow}>
                  <select
                    className={styles.filterSelect}
                    value={exploreSubformatFilter}
                    onChange={(e) => setExploreSubformatFilter(e.target.value as SubformatFilter)}
                  >
                    <option value="all">Todos los subformatos</option>
                    {visibleExploreSubformats.map((sf) => (
                      <option key={sf.value} value={sf.value}>
                        {sf.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={styles.filterSelect}
                    value={exploreRaceFilter}
                    onChange={(e) => setExploreRaceFilter(e.target.value)}
                  >
                    <option value="">Todas las razas</option>
                    {visibleExploreRaces.map((race) => (
                      <option key={race} value={race}>
                        {race}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredExploreDecks.length === 0 ? (
                <div className={styles.emptyStateInline}>
                  <p className={styles.emptyText}>No se encontraron mazos con esos filtros.</p>
                </div>
              ) : (
                <div className={styles.deckGrid}>
                  {filteredExploreDecks.map((deck) => {
                const formatLabel = deck.format === 'fx' ? 'Furia Extendido' : 'Primer Bloque';
                const subformatLabel = getSubformatLabel(deck.subformat);
                const dateLines = getDeckDateLines(deck.created_at, deck.updated_at);
                const formatTagClass = deck.format === 'fx' ? styles.deckCardTagFormatFx : styles.deckCardTagFormatPb;
                const editionSlug = deck.subformat === 'pb-edicion'
                  ? (RACE_TO_EDITION[deck.race] ?? null)
                  : null;
                const editionLabel = editionSlug ? (EDITION_LABELS[editionSlug] ?? null) : null;
                return (
                  <div key={deck.id} className={styles.deckCard}>
                    {deck.headerImageUrl && (
                      <div className={styles.deckCardCover}>
                        <div
                          className={styles.deckCardCoverImg}
                          style={{
                            backgroundImage: `url(${deck.headerImageUrl})`,
                            ...getCoverImageStyle(deck.headerZoom, deck.headerPosX, deck.headerPosY),
                          }}
                          aria-label="portada"
                        />
                      </div>
                    )}
                    <div className={styles.deckCardHeader}>
                      <h3 className={styles.deckCardName}>{deck.name}</h3>
                      <span className={styles.exploreAuthor}>@{deck.authorName}</span>
                    </div>
                    <div className={styles.deckCardMeta}>
                      <span className={`${styles.deckCardTag} ${formatTagClass}`}>{formatLabel}</span>
                      <span className={`${styles.deckCardTag} ${formatTagClass}`}>{subformatLabel}</span>
                      {deck.is_draft && (
                        <span className={`${styles.deckCardTag} ${styles.deckCardTagDraft}`}>
                          Borrador
                        </span>
                      )}
                      {deck.race && <span className={`${styles.deckCardTag} ${styles.deckCardTagRace}`}>{deck.race}</span>}
                      {editionLabel && (
                        <span className={`${styles.deckCardTag} ${styles.deckCardTagEdition}`}>
                          {editionLabel}
                        </span>
                      )}
                    </div>
                    <div className={styles.deckCardActions}>
                      {deck.is_public ? (
                        <button
                          className={styles.deckViewBtn}
                          onClick={() => navigate(`/deck-builder/viewer?deckId=${deck.id}`)}
                        >
                          👁 Ver Mazo
                        </button>
                      ) : (
                        <span className={styles.privateDeckLabel}>Mazo Privado</span>
                      )}
                    </div>
                    <div className={styles.deckDateBlock}>
                      {dateLines.map((line) => (
                        <span key={line} className={styles.deckDateLabel}>{line}</span>
                      ))}
                    </div>
                  </div>
                );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <NewDeckModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
