import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserDecks, UserDeck } from '../hooks/useUserDecks';
import styles from './DeckBuilderHomePage.module.css';

const PB_RACES = [
  'Caballero', 'Defensor', 'Desafiante', 'Dragon', 'Eterno',
  'Faerie', 'Faraon', 'Heroe', 'Olimpico', 'Sacerdote', 'Sombra', 'Titan',
];
const FX_RACES = [
  'Ancestral', 'Barbaro', 'Bestia', 'Caballero', 'Dragon',
  'Eterno', 'Guerrero', 'Heroe', 'Sacerdote', 'Sombra',
];

type Tab = 'myDecks' | 'explore';
type Format = 'pb' | 'fx';
type Subformat = 'pb-edicion' | 'pb-libre' | 'fx-vcr' | 'fx-libre';

const PB_SUBFORMATS: { value: Subformat; label: string; desc: string }[] = [
  { value: 'pb-edicion', label: 'Racial Edición', desc: 'Solo cartas de una misma edición' },
  { value: 'pb-libre',   label: 'Racial Libre',   desc: 'Cartas de todas las ediciones PB' },
];
const FX_SUBFORMATS: { value: Subformat; label: string; desc: string }[] = [
  { value: 'fx-vcr',   label: 'VCR',         desc: 'Solo cartas Vasallo, Cortesano o Real' },
  { value: 'fx-libre', label: 'Racial Libre', desc: 'Cartas de todas las ediciones FX' },
];

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

  const races = format === 'pb' ? PB_RACES : FX_RACES;
  const subformats = format === 'pb' ? PB_SUBFORMATS : FX_SUBFORMATS;

  const handleFormatChange = (f: Format) => {
    setFormat(f);
    setSubformat(f === 'pb' ? 'pb-edicion' : 'fx-vcr');
    setRace('');
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
                onClick={() => setSubformat(sf.value)}
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
  const { loadDecks, deleteDeck } = useUserDecks();
  const [tab, setTab] = useState<Tab>('myDecks');
  const [showModal, setShowModal] = useState(false);
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Deck Builder</h1>
          <p className={styles.pageSubtitle}>Construye y gestiona tus mazos</p>
        </div>
        {user && (
          <button className={styles.createButton} onClick={() => setShowModal(true)}>
            + Nuevo Mazo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={tab === 'myDecks' ? styles.tabActive : styles.tab}
          onClick={() => setTab('myDecks')}
        >
          Mis Mazos
        </button>
        <button
          className={tab === 'explore' ? styles.tabActive : styles.tab}
          onClick={() => setTab('explore')}
        >
          Explorar
        </button>
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
            <div className={styles.deckGrid}>
              {decks.map((deck) => {
                const cardCount = Object.values(deck.cards).reduce((a, b) => a + b, 0);
                const formatLabel = deck.format === 'fx' ? 'Furia Extendido' : 'Primer Bloque';
                const subformatLabel =
                  deck.subformat === 'pb-edicion' ? 'Racial Edición' :
                  deck.subformat === 'pb-libre'   ? 'Racial Libre' :
                  deck.subformat === 'fx-vcr'     ? 'VCR' : 'Racial Libre';
                return (
                  <div key={deck.id} className={styles.deckCard} onClick={() => handleView(deck)} style={{ cursor: 'pointer' }}>
                    <div className={styles.deckCardHeader}>
                      <h3 className={styles.deckCardName}>{deck.name}</h3>
                      <span className={`${styles.deckCardCount} ${cardCount === 50 ? styles.deckCardCountFull : ''}`}>
                        {cardCount}/50
                      </span>
                    </div>
                    <div className={styles.deckCardMeta}>
                      <span className={styles.deckCardTag}>{formatLabel}</span>
                      <span className={styles.deckCardTag}>{subformatLabel}</span>
                      {deck.race && <span className={styles.deckCardTag}>{deck.race}</span>}
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
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Explorar */}
      {tab === 'explore' && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p className={styles.emptyText}>Próximamente podrás explorar mazos de otros jugadores.</p>
        </div>
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
