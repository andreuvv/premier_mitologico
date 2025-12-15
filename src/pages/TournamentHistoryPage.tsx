import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI, Tournament, TournamentStanding, TournamentRound } from '../services/tournamentAPI';
import styles from './TournamentHistoryPage.module.css';

const TournamentHistoryPage = () => {
  const { tournamentId, view } = useParams<{ tournamentId: string; view?: string }>();
  const navigate = useNavigate();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [expandedTournament, setExpandedTournament] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Only for mobile

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (tournamentId && view) {
      loadTournamentData(Number(tournamentId), view);
    }
  }, [tournamentId, view]);

  const loadTournaments = async () => {
    try {
      const data = await tournamentAPI.getTournaments();
      setTournaments(data);
      
      if (tournamentId) {
        const tournament = data.find(t => t.id === Number(tournamentId));
        if (tournament) {
          setSelectedTournament(tournament);
          setExpandedYear(tournament.year);
          setExpandedTournament(tournament.id);
        }
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentData = async (id: number, viewType: string) => {
    try {
      if (viewType === 'standings') {
        const data = await tournamentAPI.getTournamentStandings(id);
        setStandings(data);
      } else if (viewType === 'rounds') {
        const data = await tournamentAPI.getTournamentRounds(id);
        setRounds(data.rounds);
        setTournamentName(data.tournament_name);
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    }
  };

  const groupByYear = () => {
    const grouped: { [year: number]: Tournament[] } = {};
    tournaments.forEach(tournament => {
      if (!grouped[tournament.year]) {
        grouped[tournament.year] = [];
      }
      grouped[tournament.year].push(tournament);
    });
    return grouped;
  };

  const handleTournamentClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    if (expandedTournament === tournament.id) {
      setExpandedTournament(null);
    } else {
      setExpandedTournament(tournament.id);
    }
  };

  const handleViewClick = (tournament: Tournament, viewType: 'standings' | 'rounds') => {
    navigate(`/tournament-history/${tournament.id}/${viewType}`);
  };

  const calculateWinRate = (standing: TournamentStanding) => {
    if (standing.total_matches === 0) return '0.0';
    return ((standing.total_points_scored / standing.total_matches) * 100).toFixed(1);
  };

  const calculateRoundWinRate = (standing: TournamentStanding) => {
    const totalRounds = standing.matches_played;
    if (totalRounds === 0) return '0.0';
    const roundPoints = standing.wins + standing.ties * 0.5;
    return ((roundPoints / totalRounds) * 100).toFixed(1);
  };

  const groupedTournaments = groupByYear();
  const years = Object.keys(groupedTournaments).map(Number).sort((a, b) => b - a);

  return (
    <div className={styles.container}>
      {/* Page Header with Hamburger Menu */}
      <div className={styles.pageHeader}>
        <button 
          className={styles.hamburgerButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className={styles.mobileTitle}>Historial de Torneos</h1>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Side Menu */}
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Historial de Torneos</h2>
          <button 
            className={styles.closeSidebar}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div className={styles.loadingText}>Cargando...</div>
        ) : tournaments.length === 0 ? (
          <div className={styles.emptyText}>No hay torneos archivados</div>
        ) : (
          <div className={styles.tournamentList}>
            {years.map(year => (
              <div key={year} className={styles.yearGroup}>
                <button
                  className={styles.yearButton}
                  onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                >
                  <span>{year}</span>
                  <span className={styles.arrow}>{expandedYear === year ? '▼' : '▶'}</span>
                </button>
                {expandedYear === year && (
                  <div className={styles.yearTournaments}>
                    {groupedTournaments[year].map(tournament => (
                      <div key={tournament.id} className={styles.tournamentItem}>
                        <button
                          className={`${styles.tournamentButton} ${selectedTournament?.id === tournament.id ? styles.active : ''}`}
                          onClick={() => handleTournamentClick(tournament)}
                        >
                          {tournament.month}
                        </button>
                        {expandedTournament === tournament.id && (
                          <div className={styles.viewOptions}>
                            <button
                              className={`${styles.viewButton} ${view === 'standings' ? styles.activeView : ''}`}
                              onClick={() => handleViewClick(tournament, 'standings')}
                            >
                              Tabla Final
                            </button>
                            <button
                              className={`${styles.viewButton} ${view === 'rounds' ? styles.activeView : ''}`}
                              onClick={() => handleViewClick(tournament, 'rounds')}
                            >
                              Rondas
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {!tournamentId || !view ? (
          <div className={styles.placeholder}>
            <h2>Selecciona un torneo y vista para ver los resultados</h2>
            <p>Usa el menú lateral para navegar por el historial de torneos</p>
          </div>
        ) : view === 'standings' ? (
          <div className={styles.standingsView}>
            <h1 className={styles.pageTitle}>{selectedTournament?.name} - Tabla Final</h1>
            <div className={styles.tableContainer}>
              <table className={styles.standingsTable}>
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Jugador</th>
                    <th>RJ</th>
                    <th className={styles.winsColumn}>G</th>
                    <th className={styles.tiesColumn}>E</th>
                    <th className={styles.lossesColumn}>P</th>
                    <th>TPG</th>
                    <th>MWR%</th>
                    <th>RWR%</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing) => (
                    <tr key={standing.id}>
                      <td className={styles.positionCell}>{standing.final_position}</td>
                      <td className={styles.nameCell}>{standing.player_name}</td>
                      <td className={styles.coalGreyColumn}>{standing.matches_played}</td>
                      <td className={styles.winsColumn}>{standing.wins}</td>
                      <td className={styles.tiesColumn}>{standing.ties}</td>
                      <td className={styles.lossesColumn}>{standing.losses}</td>
                      <td className={styles.coalGreyColumn}>{standing.total_matches}</td>
                      <td className={styles.coalGreyColumn}>{calculateWinRate(standing)}%</td>
                      <td className={styles.coalGreyColumn}>{calculateRoundWinRate(standing)}%</td>
                      <td className={styles.pointsCell}>{standing.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className={styles.legend}>
              <h3>Leyenda</h3>
              <ul>
                <li><strong>Pos:</strong> Posición Final</li>
                <li><strong>RJ:</strong> Rondas Jugadas</li>
                <li><strong>G:</strong> Rondas Ganadas</li>
                <li><strong>E:</strong> Rondas Empatadas</li>
                <li><strong>P:</strong> Rondas Perdidas</li>
                <li><strong>TPG:</strong> Total Partidas Ganadas (partidas individuales ganadas)</li>
                <li><strong>MWR%:</strong> Matches Win Rate ( (Partidas ganadas / Partidas jugadas) * 100 )</li>
                <li><strong>RWR%:</strong> Rounds Win Rate ( ((Rondas ganadas + Rondas empatadas * 0.5) / Rondas Jugadas) * 100 )</li>
                <li><strong>Pts:</strong> Puntos (3 por victoria, 1 por empate)</li>
              </ul>
            </div>

            {/* Tie Breakers */}
            <div className={styles.tieBreakers}>
              <h3>Criterios de Desempate</h3>
              <ol>
                <li>⭐ <strong>Puntaje total</strong> (mayor puntaje)</li>
                <li>💪 <strong>Mayor cantidad de victorias</strong></li>
                <li>🎯 <strong>Victoria directa</strong> (ganó al otro jugador empatado durante las rondas)</li>
                <li>⚔️ <strong>Duelo de desempate</strong> (si ningún criterio anterior resuelve)</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className={styles.roundsView}>
            <h1 className={styles.pageTitle}>{tournamentName} - Rondas</h1>
            <div className={styles.roundsContainer}>
              {rounds.map((round) => (
                <details key={round.number} className={styles.roundAccordion}>
                  <summary className={styles.roundSummary}>
                    <span className={styles.roundTitle}>
                      Ronda {round.number} - {round.format === 'PB' ? 'Primer Bloque' : 'Bloque Furia'}
                    </span>
                  </summary>
                  <div className={styles.matchesList}>
                    {round.matches.map((match) => (
                      <div key={match.id} className={styles.matchCard}>
                        <div className={styles.matchPlayers}>
                          <span className={styles.playerName}>{match.player1_name}</span>
                          <span className={styles.vs}>VS</span>
                          <span className={styles.playerName}>{match.player2_name}</span>
                        </div>
                        {match.completed && match.score1 !== null && match.score2 !== null && (
                          <div className={styles.matchScore}>
                            <span className={`${styles.score} ${match.score1 > match.score2 ? styles.winner : ''}`}>
                              {match.score1}
                            </span>
                            <span className={styles.scoreSeparator}>-</span>
                            <span className={`${styles.score} ${match.score2 > match.score1 ? styles.winner : ''}`}>
                              {match.score2}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentHistoryPage;
