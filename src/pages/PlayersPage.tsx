import { useState, useEffect } from 'react';
import { fixtureAPI, APIPlayer } from '../services/fixtureAPI';
import { API_BASE_URL } from '../config/api';
import { FaUser, FaBars, FaTimes } from 'react-icons/fa';
import styles from './PlayersPage.module.css';

interface PlayerDetail extends APIPlayer {
  tournaments?: PlayerTournamentData[];
}

interface PlayerTournamentData {
  tournamentId: number;
  tournamentName: string;
  month: string;
  year: number;
  standing?: {
    final_position: number;
    matches_played: number;
    wins: number;
    ties: number;
    losses: number;
    points: number;
    total_points_scored: number;
  };
  races?: {
    race_pb?: string;
    race_bf?: string;
  };
}

const PlayersPage = () => {
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [playerTournamentData, setPlayerTournamentData] = useState<PlayerTournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await fixtureAPI.getPlayers();
      setPlayers(data.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch (err) {
      setError('Error al cargar los jugadores. Por favor, intenta de nuevo.');
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = async (player: APIPlayer) => {
    setSelectedPlayer(player);
    setSidebarOpen(false);
    await loadPlayerTournamentData(player.id);
  };

  const loadPlayerTournamentData = async (playerId: number) => {
    try {
      setDataLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/players/${playerId}/tournaments`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch tournament data');
      }

      const data = await response.json();
      
      // Transform API response to PlayerTournamentData format
      const tournamentData: PlayerTournamentData[] = data.map((item: any) => ({
        tournamentId: item.tournament_id,
        tournamentName: item.tournament_name,
        month: item.month,
        year: item.year,
        standing: {
          final_position: item.final_position,
          matches_played: item.matches_played,
          wins: item.wins,
          ties: item.ties,
          losses: item.losses,
          points: item.points,
          total_points_scored: item.total_points_scored,
        },
        races: {
          race_pb: item.race_pb,
          race_bf: item.race_bf,
        },
      }));

      setPlayerTournamentData(tournamentData);
      setError(null);
    } catch (err) {
      setError('Error al cargar la información del jugador.');
      console.error('Error loading player tournament data:', err);
      setPlayerTournamentData([]);
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Mobile Hamburger */}
      <div className={styles.mobileHeader}>
        <button 
          className={styles.hamburger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        <h1 className={styles.mobileTitle}>Jugadores</h1>
      </div>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarContent}>
          <h2 className={styles.sidebarTitle}>
            <FaUser className={styles.icon} />
            Jugadores
          </h2>
          
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
                    className={`${styles.playerButton} ${
                      selectedPlayer?.id === player.id ? styles.active : ''
                    }`}
                    onClick={() => handlePlayerClick(player)}
                  >
                    {player.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {selectedPlayer ? (
          <div className={styles.playerDetail}>
            <h1 className={styles.playerName}>{selectedPlayer.name}</h1>
            
            {dataLoading ? (
              <div className={styles.loadingSpinner}>Cargando datos del jugador...</div>
            ) : playerTournamentData.length === 0 ? (
              <p className={styles.noData}>Este jugador no ha participado en ningún torneo.</p>
            ) : (
              <div className={styles.tournamentsList}>
                {playerTournamentData.map(tournament => (
                  <div key={tournament.tournamentId} className={styles.tournamentCard}>
                    <div className={styles.tournamentHeader}>
                      <h3>{tournament.tournamentName}</h3>
                      <span className={styles.tournamentDate}>
                        {tournament.month} {tournament.year}
                      </span>
                    </div>
                    
                    <div className={styles.tournamentInfo}>
                      {tournament.standing && (
                        <div className={styles.standingInfo}>
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Posición:</span>
                            <span className={styles.value}>{tournament.standing.final_position}°</span>
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Récord:</span>
                            <span className={styles.value}>
                              {tournament.standing.wins}G - {tournament.standing.ties}E - {tournament.standing.losses}P
                            </span>
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Puntos:</span>
                            <span className={styles.value}>{tournament.standing.points}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Partidas Ganadas:</span>
                            <span className={styles.value}>{tournament.standing.total_points_scored}</span>
                          </div>
                        </div>
                      )}
                      
                      {tournament.races && (
                        <div className={styles.racesInfo}>
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Raza PB:</span>
                            <span className={styles.value}>
                              {tournament.races.race_pb || 'No registrada'}
                            </span>
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.label}>Raza BF:</span>
                            <span className={styles.value}>
                              {tournament.races.race_bf || 'No registrada'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FaUser className={styles.emptyIcon} />
            <p>Selecciona un jugador para ver su historial de torneos</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlayersPage;
