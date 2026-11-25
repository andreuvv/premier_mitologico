import type { APIPlayer } from '../../services/fixtureAPI';
import styles from '../PlayersPage.module.css';

interface PlayersSidebarProps {
  players: APIPlayer[];
  selectedPlayerId: number | null;
  loading: boolean;
  error: string | null;
  open: boolean;
  isNarrow: boolean;
  onSelect: (player: APIPlayer) => void;
  onClose: () => void;
}

export default function PlayersSidebar({ players, selectedPlayerId, loading, error, open, isNarrow, onSelect, onClose }: PlayersSidebarProps) {
  return (
    <aside
      id="players-sidebar"
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
      aria-hidden={isNarrow && !open}
      inert={isNarrow && !open ? true : undefined}
    >
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Jugadores</span>
        <button
          type="button"
          className={styles.closeSidebar}
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingSpinner}>Cargando...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : players.length === 0 ? (
        <p className={styles.noData}>No hay jugadores disponibles</p>
      ) : (
        <ul className={styles.playersList}>
          {players.map(player => (
            <li key={player.id}>
              <button
                type="button"
                className={`${styles.playerButton} ${
                  selectedPlayerId === player.id ? styles.active : ''
                }`}
                onClick={() => onSelect(player)}
              >
                {player.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
