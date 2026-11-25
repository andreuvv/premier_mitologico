import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fixtureAPI, APIPlayer } from '../services/fixtureAPI';
import { tournamentAPI } from '../services/tournamentAPI';
import { loadProfileByPremierPlayerId } from '../hooks/useUserProfile';
import { FaUser, FaHistory } from 'react-icons/fa';
import styles from './PlayersPage.module.css';
import PlayerHeader from './players/PlayerHeader';
import PlayersSidebar from './players/PlayersSidebar';
import PlayerTournamentCard from './players/PlayerTournamentCard';
import RaceStatsAccordion from './players/RaceStatsAccordion';
import { computePlayerSummary, toPlayerTournamentData, type PlayerTournamentData } from './players/playerStats';

const PlayersPage = () => {
  const { playerName } = useParams<{ playerName?: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<APIPlayer | null>(null);
  const [playerTournamentData, setPlayerTournamentData] = useState<PlayerTournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());
  const [graphsExpanded, setGraphsExpanded] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const onChange = () => setIsNarrow(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const data = await fixtureAPI.getPremierPlayers();
        setPlayers(data.sort((a, b) => a.name.localeCompare(b.name)));
        setError(null);
      } catch (err) {
        setError('Error al cargar los jugadores. Por favor, intenta de nuevo.');
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  useEffect(() => {
    const loadPlayerTournamentData = async (playerId: number) => {
      try {
        setDataLoading(true);
        const data = await tournamentAPI.getPlayerHistory(playerId);
        setPlayerTournamentData(toPlayerTournamentData(data));
        setError(null);
      } catch (err) {
        setError('Error al cargar la información del jugador.');
        console.error('Error loading player tournament data:', err);
        setPlayerTournamentData([]);
      } finally {
        setDataLoading(false);
      }
    };

    if (playerName && players.length > 0) {
      const player = players.find(p => p.name === decodeURIComponent(playerName));
      if (player) {
        setSelectedPlayer(player);
        setSidebarOpen(false);
        loadPlayerTournamentData(player.id);
      }
    } else if (!playerName) {
      // Clear selection when no playerName in URL
      setSelectedPlayer(null);
      setPlayerTournamentData([]);
    }
  }, [playerName, players]);

  useEffect(() => {
    if (!selectedPlayer) {
      setProfileUsername(null);
      setProfileAvatarUrl(null);
      return;
    }

    let cancelled = false;
    loadProfileByPremierPlayerId(selectedPlayer.id).then((profile) => {
      if (cancelled) return;
      setProfileUsername(profile?.username ?? null);
      setProfileAvatarUrl(profile?.avatar_url ?? null);
    });

    return () => { cancelled = true; };
  }, [selectedPlayer]);

  const playerSummary = useMemo(() => computePlayerSummary(playerTournamentData), [playerTournamentData]);

  const toggleTournamentExpand = (tournamentId: number) => {
    const newExpanded = new Set(expandedTournaments);
    if (newExpanded.has(tournamentId)) {
      newExpanded.delete(tournamentId);
    } else {
      newExpanded.add(tournamentId);
    }
    setExpandedTournaments(newExpanded);
  };

  const handlePlayerClick = (player: APIPlayer) => {
    // The effect on playerName loads the player's data.
    navigate(`/players/${encodeURIComponent(player.name)}`);
    setSidebarOpen(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Comunidad</p>
        <h1>Jugadores</h1>
        <p className={styles.lede}>
          Perfiles, récords y el historial de torneos de cada jugador.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={sidebarOpen}
            aria-controls="players-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span className={styles.menuGlyph} aria-hidden="true" />
            Menú
          </button>
          <h2 className={styles.mobileTitle}>{selectedPlayer?.name ?? 'Jugadores'}</h2>
        </div>

        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}

        <PlayersSidebar
          players={players}
          selectedPlayerId={selectedPlayer?.id ?? null}
          loading={loading}
          error={error}
          open={sidebarOpen}
          isNarrow={isNarrow}
          onSelect={handlePlayerClick}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={styles.content}>
          <div className={styles.articleBar}>
            <div>
              <p className={styles.articleKicker}>{selectedPlayer ? 'Jugador' : 'Perfil'}</p>
              <h2 className={styles.articleTitle}>{selectedPlayer?.name ?? 'Selecciona un jugador'}</h2>
            </div>
          </div>
        {selectedPlayer ? (
          <div className={styles.playerDetail}>
            <PlayerHeader
              name={selectedPlayer.name}
              avatarUrl={profileAvatarUrl}
              profileUsername={profileUsername}
              summary={playerSummary}
              hasTournaments={playerTournamentData.length > 0}
            />

            {playerTournamentData.length > 0 && (
              <RaceStatsAccordion
                data={playerTournamentData}
                expanded={graphsExpanded}
                onToggle={() => setGraphsExpanded(!graphsExpanded)}
              />
            )}

            {dataLoading ? (
              <div className={styles.loadingSpinner}>Cargando datos del jugador...</div>
            ) : playerTournamentData.length === 0 ? (
              <p className={styles.noData}>Este jugador no ha participado en ningún torneo.</p>
            ) : (
              <>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--beige)' }}>
                  <FaHistory style={{ color: 'var(--sage-green)' }} />
                  Historial de Torneos
                </h2>
                <div className={styles.tournamentsList}>
                  {playerTournamentData.map(tournament => (
                    <PlayerTournamentCard
                      key={tournament.tournamentId}
                      tournament={tournament}
                      expanded={expandedTournaments.has(tournament.tournamentId)}
                      onToggle={() => toggleTournamentExpand(tournament.tournamentId)}
                    />
                  ))}
                </div>
              </>
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
    </div>
  );
};

export default PlayersPage;
