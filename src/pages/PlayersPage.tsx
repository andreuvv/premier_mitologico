import { useState, useEffect, useMemo } from 'react';
import { fixtureAPI, APIPlayer } from '../services/fixtureAPI';
import { API_BASE_URL } from '../config/api';
import { FaUser, FaBars, FaTimes, FaChevronDown, FaChartPie, FaTrophy } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
  // Actual match data by format from backend
  pbWins?: number;
  pbTies?: number;
  pbMatches?: number;
  bfWins?: number;
  bfTies?: number;
  bfMatches?: number;
}

interface PlayerSummary {
  tournamentsPlayed: number;
  totalWins: number;
  totalTies: number;
  totalLosses: number;
  mostPlayedRacePB?: string;
  mostPlayedRacePBPercentage: number;
  mostPlayedRaceBF?: string;
  mostPlayedRaceBFPercentage: number;
  winRatePB: number;
  winRateBF: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
}

const PlayersPage = () => {
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [playerTournamentData, setPlayerTournamentData] = useState<PlayerTournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());
  const [graphsExpanded, setGraphsExpanded] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const playerSummary = useMemo(() => {
    const summary: PlayerSummary = {
      tournamentsPlayed: playerTournamentData.length,
      totalWins: 0,
      totalTies: 0,
      totalLosses: 0,
      mostPlayedRacePB: undefined,
      mostPlayedRacePBPercentage: 0,
      mostPlayedRaceBF: undefined,
      mostPlayedRaceBFPercentage: 0,
      winRatePB: 0,
      winRateBF: 0,
      firstPlaceCount: 0,
      secondPlaceCount: 0,
      thirdPlaceCount: 0,
    };

    if (playerTournamentData.length === 0) return summary;

    // Calculate overall record and win rates using actual match data by format
    // Win rate = (wins + 0.5*ties) / total_matches
    let totalPBWins = 0;
    let totalPBTies = 0;
    let totalPBMatches = 0;
    let totalBFWins = 0;
    let totalBFTies = 0;
    let totalBFMatches = 0;

    playerTournamentData.forEach((tournament) => {
      if (tournament.standing) {
        summary.totalWins += tournament.standing.wins;
        summary.totalTies += tournament.standing.ties;
        summary.totalLosses += tournament.standing.losses;
        
        // Count trophy placements
        if (tournament.standing.final_position === 1) {
          summary.firstPlaceCount += 1;
        } else if (tournament.standing.final_position === 2) {
          summary.secondPlaceCount += 1;
        } else if (tournament.standing.final_position === 3) {
          summary.thirdPlaceCount += 1;
        }
      }

      // Accumulate actual match data by format
      if (tournament.pbMatches && tournament.pbMatches > 0) {
        totalPBWins += tournament.pbWins || 0;
        totalPBTies += tournament.pbTies || 0;
        totalPBMatches += tournament.pbMatches;
      }
      if (tournament.bfMatches && tournament.bfMatches > 0) {
        totalBFWins += tournament.bfWins || 0;
        totalBFTies += tournament.bfTies || 0;
        totalBFMatches += tournament.bfMatches;
      }
    });

    // Calculate win rates: (wins + 0.5*ties) / total_matches * 100
    // Cap at 100% to handle any edge cases
    summary.winRatePB = totalPBMatches > 0 ? Math.min(100, Math.round(((totalPBWins + 0.5 * totalPBTies) / totalPBMatches) * 100)) : 0;
    summary.winRateBF = totalBFMatches > 0 ? Math.min(100, Math.round(((totalBFWins + 0.5 * totalBFTies) / totalBFMatches) * 100)) : 0;

    // Find most played races
    const racePBCount: Record<string, number> = {};
    const raceBFCount: Record<string, number> = {};

    playerTournamentData.forEach(tournament => {
      if (tournament.races?.race_pb) {
        racePBCount[tournament.races.race_pb] = (racePBCount[tournament.races.race_pb] || 0) + 1;
      }
      if (tournament.races?.race_bf) {
        raceBFCount[tournament.races.race_bf] = (raceBFCount[tournament.races.race_bf] || 0) + 1;
      }
    });

    // Get most played race for each format
    const totalPBRaces = Object.values(racePBCount).reduce((sum, count) => sum + count, 0);
    const totalBFRaces = Object.values(raceBFCount).reduce((sum, count) => sum + count, 0);
    
    if (Object.keys(racePBCount).length > 0) {
      const [race, count] = Object.entries(racePBCount).sort((a, b) => b[1] - a[1])[0];
      summary.mostPlayedRacePB = race;
      summary.mostPlayedRacePBPercentage = totalPBRaces > 0 ? Math.round((count / totalPBRaces) * 100) : 0;
    }
    if (Object.keys(raceBFCount).length > 0) {
      const [race, count] = Object.entries(raceBFCount).sort((a, b) => b[1] - a[1])[0];
      summary.mostPlayedRaceBF = race;
      summary.mostPlayedRaceBFPercentage = totalBFRaces > 0 ? Math.round((count / totalBFRaces) * 100) : 0;
    }

    return summary;
  }, [playerTournamentData]);

  const raceUsagePB = useMemo(() => {
    const count: { [race: string]: number } = {};
    playerTournamentData.forEach(tournament => {
      if (tournament.races?.race_pb) {
        count[tournament.races.race_pb] = (count[tournament.races.race_pb] || 0) + 1;
      }
    });
    return count;
  }, [playerTournamentData]);

  const raceUsageBF = useMemo(() => {
    const count: { [race: string]: number } = {};
    playerTournamentData.forEach(tournament => {
      if (tournament.races?.race_bf) {
        count[tournament.races.race_bf] = (count[tournament.races.race_bf] || 0) + 1;
      }
    });
    return count;
  }, [playerTournamentData]);

  const raceWinratesPB = useMemo(() => {
    const winrates: { [race: string]: number } = {};
    const raceStats: { [race: string]: { wins: number; ties: number; total: number } } = {};

    playerTournamentData.forEach(tournament => {
      if (tournament.races?.race_pb && tournament.pbMatches && tournament.pbMatches > 0) {
        const race = tournament.races.race_pb;
        if (!raceStats[race]) {
          raceStats[race] = { wins: 0, ties: 0, total: 0 };
        }
        raceStats[race].wins += tournament.pbWins || 0;
        raceStats[race].ties += tournament.pbTies || 0;
        raceStats[race].total += tournament.pbMatches;
      }
    });

    Object.entries(raceStats).forEach(([race, stats]) => {
      if (stats.total > 0) {
        winrates[race] = Math.round(((stats.wins + 0.5 * stats.ties) / stats.total) * 100);
      }
    });

    return winrates;
  }, [playerTournamentData]);

  const raceWinratesBF = useMemo(() => {
    const winrates: { [race: string]: number } = {};
    const raceStats: { [race: string]: { wins: number; ties: number; total: number } } = {};

    playerTournamentData.forEach(tournament => {
      if (tournament.races?.race_bf && tournament.bfMatches && tournament.bfMatches > 0) {
        const race = tournament.races.race_bf;
        if (!raceStats[race]) {
          raceStats[race] = { wins: 0, ties: 0, total: 0 };
        }
        raceStats[race].wins += tournament.bfWins || 0;
        raceStats[race].ties += tournament.bfTies || 0;
        raceStats[race].total += tournament.bfMatches;
      }
    });

    Object.entries(raceStats).forEach(([race, stats]) => {
      if (stats.total > 0) {
        winrates[race] = Math.round(((stats.wins + 0.5 * stats.ties) / stats.total) * 100);
      }
    });

    return winrates;
  }, [playerTournamentData]);

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

  const toggleTournamentExpand = (tournamentId: number) => {
    const newExpanded = new Set(expandedTournaments);
    if (newExpanded.has(tournamentId)) {
      newExpanded.delete(tournamentId);
    } else {
      newExpanded.add(tournamentId);
    }
    setExpandedTournaments(newExpanded);
  };

  const getColorForRace = (race: string, format: 'pb' | 'bf') => {
    const colors = [
      '#6B46C1', '#38A169', '#D69E2E', '#E53E3E', '#3182CE', '#805AD5', '#DD6B20', '#2C5282', '#B83280', '#38B2AC', '#D4AF37', '#C53030', '#2D3748'
    ];
    const races = format === 'pb' 
      ? ['Caballero', 'Faerie', 'Dragón', 'Olímpico', 'Titán', 'Héroe', 'Defensor', 'Desafiante', 'Sombra', 'Sacerdote', 'Faraón', 'Eterno', 'Tótem']
      : ['Caballero', 'Guerrero', 'Eterno', 'Sombra', 'Dragón', 'Bestia', 'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro', 'Tótem'];
    
    const index = races.indexOf(race);
    return index >= 0 ? colors[index % colors.length] : '#6B46C1';
  };

  const prepareChartData = (raceData: { [race: string]: number }, winrateData: { [race: string]: number }, format: 'pb' | 'bf') => {
    const allRaces = format === 'pb' 
      ? ['Caballero', 'Faerie', 'Dragón', 'Olímpico', 'Titán', 'Héroe', 'Defensor', 'Desafiante', 'Sombra', 'Sacerdote', 'Faraón', 'Eterno', 'Tótem']
      : ['Caballero', 'Guerrero', 'Eterno', 'Sombra', 'Dragón', 'Bestia', 'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro', 'Tótem'];
    
    return allRaces.map(race => ({
      name: race,
      value: raceData[race] || 0,
      winrate: winrateData[race] || 0,
      displayName: `${race}: ${raceData[race] || 0}`
    }));
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
        // Include actual match data by format
        pbWins: item.pb_wins,
        pbTies: item.pb_ties,
        pbMatches: item.pb_matches,
        bfWins: item.bf_wins,
        bfTies: item.bf_ties,
        bfMatches: item.bf_matches,
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
            <div className={styles.playerHeader}>
              <div className={styles.playerInfoColumn}>
                <div className={styles.playerProfilePicture}></div>
                <h1 className={styles.playerName}>{selectedPlayer.name}</h1>
                {playerTournamentData.length > 0 && (
                  <div className={styles.trophySection}>
                    <div>
                      <h3 className={styles.trophySectionTitle}>Récord de Trofeos</h3>
                      <div className={styles.trophyContainer}>
                        <div className={styles.trophy}>
                          <FaTrophy className={`${styles.trophyIcon} ${styles.goldTrophy}`} />
                          <span className={styles.trophyCount}>{playerSummary.firstPlaceCount}</span>
                        </div>
                        <div className={styles.trophy}>
                          <FaTrophy className={`${styles.trophyIcon} ${styles.silverTrophy}`} />
                          <span className={styles.trophyCount}>{playerSummary.secondPlaceCount}</span>
                        </div>
                        <div className={styles.trophy}>
                          <FaTrophy className={`${styles.trophyIcon} ${styles.bronzeTrophy}`} />
                          <span className={styles.trophyCount}>{playerSummary.thirdPlaceCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {playerTournamentData.length > 0 && (
                <div className={styles.playerSummary}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Récord Global:</span>
                    <span className={styles.summaryValue}>
                      {playerSummary.totalWins}G - {playerSummary.totalTies}E - {playerSummary.totalLosses}P
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Torneos Participados:</span>
                    <span className={styles.summaryValue}>{playerSummary.tournamentsPlayed}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Raza más jugada PB:</span>
                    <span className={styles.summaryValue}>
                      {playerSummary.mostPlayedRacePB ? `${playerSummary.mostPlayedRacePB} (${playerSummary.mostPlayedRacePBPercentage}%)` : '-'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>WinRate Global en PB:</span>
                    <span className={styles.summaryValue}>{playerSummary.winRatePB}%</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Raza más jugada BF:</span>
                    <span className={styles.summaryValue}>
                      {playerSummary.mostPlayedRaceBF ? `${playerSummary.mostPlayedRaceBF} (${playerSummary.mostPlayedRaceBFPercentage}%)` : '-'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>WinRate Global en BF:</span>
                    <span className={styles.summaryValue}>{playerSummary.winRateBF}%</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Race Usage Graphs Accordion */}
            {playerTournamentData.length > 0 && (
              <div className={styles.graphsAccordion}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => setGraphsExpanded(!graphsExpanded)}
                >
                  <div className={styles.headerContent}>
                    <h3><FaChartPie className={styles.chartIcon} /> Estadísticas de Razas</h3>
                  </div>
                  <FaChevronDown 
                    className={`${styles.chevron} ${graphsExpanded ? styles.expanded : ''}`}
                  />
                </button>
                
                {graphsExpanded && (
                  <div className={styles.graphsContent}>
                    <div className={styles.chartSection}>
                      <h4>Uso de Razas en Primer Bloque</h4>
                      <p className={styles.chartSubtitle}>(WinRate% con esa Raza)</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepareChartData(raceUsagePB, raceWinratesPB, 'pb')}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => {
                              const e = entry as unknown as { value: number; winrate: number };
                              return e.value > 0 ? `${e.value} (${e.winrate}%)` : '';
                            }}
                            labelLine={false}
                          >
                            {prepareChartData(raceUsagePB, raceWinratesPB, 'pb').map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, 'pb')} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend 
                            formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
                            wrapperStyle={{ color: 'var(--coal-grey)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={styles.chartSection}>
                      <h4>Uso de Razas en Bloque Furia</h4>
                      <p className={styles.chartSubtitle}>(WinRate% con esa Raza)</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepareChartData(raceUsageBF, raceWinratesBF, 'bf')}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => {
                              const e = entry as unknown as { value: number; winrate: number };
                              return e.value > 0 ? `${e.value} (${e.winrate}%)` : '';
                            }}
                            labelLine={false}
                          >
                            {prepareChartData(raceUsageBF, raceWinratesBF, 'bf').map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, 'bf')} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend 
                            formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
                            wrapperStyle={{ color: 'var(--coal-grey)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {dataLoading ? (
              <div className={styles.loadingSpinner}>Cargando datos del jugador...</div>
            ) : playerTournamentData.length === 0 ? (
              <p className={styles.noData}>Este jugador no ha participado en ningún torneo.</p>
            ) : (
              <div className={styles.tournamentsList}>
                {playerTournamentData.map(tournament => (
                  <div key={tournament.tournamentId} className={styles.tournamentCard}>
                    <button
                      className={styles.accordionHeader}
                      onClick={() => toggleTournamentExpand(tournament.tournamentId)}
                    >
                      <div className={styles.headerContent}>
                        <h3>{tournament.tournamentName}</h3>
                        <span className={styles.tournamentDate}>
                          {tournament.month} {tournament.year}
                        </span>
                      </div>
                      <FaChevronDown 
                        className={`${styles.chevron} ${expandedTournaments.has(tournament.tournamentId) ? styles.expanded : ''}`}
                      />
                    </button>
                    
                    {expandedTournaments.has(tournament.tournamentId) && (
                      <div className={styles.tournamentInfo}>
                        {tournament.standing && (
                          <div className={styles.standingInfo}>
                            <div className={styles.infoRow}>
                              <span className={styles.label}>Posición:</span>
                              <span className={styles.value}>{tournament.standing.final_position}°</span>
                            </div>
                            <div className={styles.infoRow}>
                              <span className={styles.label}>Récord (Rondas):</span>
                              <span className={styles.value}>
                                {tournament.standing.wins}G - {tournament.standing.ties}E - {tournament.standing.losses}P
                              </span>
                            </div>
                            <div className={styles.infoRow}>
                              <span className={styles.label}>Puntos:</span>
                              <span className={styles.value}>{tournament.standing.points}</span>
                            </div>
                            <div className={styles.infoRow}>
                              <span className={styles.label}>Partidas Individuales Ganadas:</span>
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
                    )}
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
