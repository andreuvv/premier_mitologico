import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tournamentAPI, Tournament, TournamentStanding, TournamentRound, TournamentRacesResponse, GlobalStanding } from '../services/tournamentAPI';
import onlineTournamentService, { OnlineTournament } from '../services/onlineTournamentService';
import OnlineTournamentPage from './OnlineTournamentPage';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import styles from './TournamentHistoryPage.module.css';

const TournamentHistoryPage = () => {
  const { tournamentId, view } = useParams<{ tournamentId: string; view?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewingOnlineTournament = location.pathname.includes('/tournament-history/online/');
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [races, setRaces] = useState<TournamentRacesResponse | null>(null);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [expandedTournament, setExpandedTournament] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Only for mobile
  const [torneosPremierExpanded, setTorneosPremierExpanded] = useState(false);
  const [eventosEspecialesExpanded, setEventosEspecialesExpanded] = useState(false);
  const [globalStandings, setGlobalStandings] = useState<GlobalStanding[]>([]);
  const [globalRaces, setGlobalRaces] = useState<TournamentRacesResponse | null>(null);
  const [onlineTournaments, setOnlineTournaments] = useState<OnlineTournament[]>([]);
  const [expandedOnlineMonth, setExpandedOnlineMonth] = useState<string | null>(null);
  const [selectedOnlineTournament, setSelectedOnlineTournament] = useState<number | null>(null);

  useEffect(() => {
    loadTournaments();
    loadGlobalData();
    loadOnlineTournaments();
    
    // Auto-navigate to Ranking Global if no tournamentId/view is provided and not viewing online tournament
    if (!tournamentId || (!view && !isViewingOnlineTournament)) {
      navigate('/tournament-history/0/global-standings');
    }
  }, []);

  const loadGlobalData = async () => {
    try {
      const standings = await tournamentAPI.getGlobalStandings();
      const races = await tournamentAPI.getGlobalRaces();
      setGlobalStandings(standings);
      setGlobalRaces(races);
    } catch (error) {
      console.error('Error loading global data:', error);
    }
  };

  const loadOnlineTournaments = async () => {
    try {
      const data = await onlineTournamentService.getActiveTournaments();
      setOnlineTournaments(data);
    } catch (error) {
      console.error('Error loading online tournaments:', error);
    }
  };

  useEffect(() => {
    if (tournamentId && view) {
      // Clear accordion states when viewing global views (tournamentId = '0')
      if (tournamentId === '0') {
        setExpandedTournament(null);
        setExpandedYear(null);
        // globalStandings and globalRaces are already loaded on mount, no need to reload
      } else if (!isViewingOnlineTournament) {
        // Load data for specific traditional tournaments
        loadTournamentData(Number(tournamentId), view);
        // Expand tournament's view options when navigating to it
        setExpandedTournament(Number(tournamentId));
      }
    } else if (isViewingOnlineTournament) {
      // Clear traditional tournament accordion states when viewing online tournaments
      setExpandedTournament(null);
      setExpandedYear(null);
    }
  }, [tournamentId, view, isViewingOnlineTournament]);

  // Sync selectedOnlineTournament state with URL when viewing online tournaments
  useEffect(() => {
    if (isViewingOnlineTournament && tournamentId) {
      setSelectedOnlineTournament(Number(tournamentId));
    } else if (!isViewingOnlineTournament) {
      // Clear online tournament state when not viewing online tournaments
      setExpandedOnlineMonth(null);
      setSelectedOnlineTournament(null);
    }
  }, [tournamentId, isViewingOnlineTournament]);

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
      } else if (viewType === 'resumen') {
        const data = await tournamentAPI.getTournamentRaces(id);
        setRaces(data);
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

  const groupOnlineByMonth = () => {
    const grouped: { [month: string]: OnlineTournament[] } = {};
    onlineTournaments.forEach(tournament => {
      if (!grouped[tournament.month]) {
        grouped[tournament.month] = [];
      }
      grouped[tournament.month].push(tournament);
    });
    return grouped;
  };

  const handleTournamentClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    // Automatically navigate to resumen (default view) when clicking a tournament
    navigate(`/tournament-history/${tournament.id}/resumen`);
  };

  const handleViewClick = (tournament: Tournament, viewType: 'resumen' | 'standings' | 'rounds') => {
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

  const getPositionIcon = (position: number) => {
    if (position === 1) return <FaTrophy className={styles.goldIcon} />;
    if (position === 2) return <FaMedal className={styles.silverIcon} />;
    if (position === 3) return <FaMedal className={styles.bronzeIcon} />;
    return null;
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

  const prepareChartData = (raceData: { [race: string]: number }, format: 'pb' | 'bf') => {
    const allRaces = format === 'pb' 
      ? ['Caballero', 'Faerie', 'Dragón', 'Olímpico', 'Titán', 'Héroe', 'Defensor', 'Desafiante', 'Sombra', 'Sacerdote', 'Faraón', 'Eterno', 'Tótem']
      : ['Caballero', 'Guerrero', 'Eterno', 'Sombra', 'Dragón', 'Bestia', 'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro', 'Tótem'];
    
    return allRaces.map(race => ({
      name: race,
      value: raceData[race] || 0,
      displayName: `${race}: ${raceData[race] || 0}`
    }));
  };

  const prepareWinrateData = (winrateData: { [race: string]: number }) => {
    return Object.entries(winrateData)
      .map(([race, winrate]) => ({
        race,
        winrate: Math.round(winrate * 100) / 100 // round to 2 decimals
      }))
      .sort((a, b) => b.winrate - a.winrate); // sort by winrate descending
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
          <>
            <div className={styles.globalSection}>
              <h3 className={styles.globalTitle}>Estadísticas Globales</h3>
              <button
                className={`${styles.globalButton} ${view === 'global-standings' ? styles.activeView : ''}`}
                onClick={() => navigate('/tournament-history/0/global-standings')}
              >
                Ranking Global
              </button>
              <button
                className={`${styles.globalButton} ${view === 'global-races' ? styles.activeView : ''}`}
                onClick={() => navigate('/tournament-history/0/global-races')}
              >
                Razas Global
              </button>
            </div>
            <div className={styles.divider} />
            
            {/* Torneos Premier Accordion */}
            <div className={styles.accordionSection}>
              <button
                className={styles.accordionButton}
                onClick={() => setTorneosPremierExpanded(!torneosPremierExpanded)}
              >
                <span>Torneos Premier</span>
                <span className={styles.arrow}>{torneosPremierExpanded ? '▼' : '▶'}</span>
              </button>
              {torneosPremierExpanded && (
                <div className={styles.tournamentList}>
                  {years.map(year => (
                    <div key={year} className={styles.yearGroup}>
                      <button
                        className={`${styles.yearButton} ${expandedYear === year ? styles.active : ''}`}
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
                                    className={`${styles.viewButton} ${view === 'resumen' ? styles.activeView : ''}`}
                                    onClick={() => handleViewClick(tournament, 'resumen')}
                                  >
                                    Resumen
                                  </button>
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
            </div>

            {/* Eventos Especiales Accordion */}
            <div className={styles.accordionSection}>
              <button
                className={styles.accordionButton}
                onClick={() => setEventosEspecialesExpanded(!eventosEspecialesExpanded)}
              >
                <span>Eventos Especiales</span>
                <span className={styles.arrow}>{eventosEspecialesExpanded ? '▼' : '▶'}</span>
              </button>
              {eventosEspecialesExpanded && (
                onlineTournaments.length === 0 ? (
                  <div className={styles.emptySection}>
                    <p>No hay eventos especiales registrados</p>
                  </div>
                ) : (
                  <div className={styles.tournamentList}>
                    {Object.entries(groupOnlineByMonth()).map(([month, tournaments]) => (
                      <div key={month} className={styles.yearGroup}>
                        <button
                          className={`${styles.yearButton} ${expandedOnlineMonth === month ? styles.active : ''}`}
                          onClick={() => setExpandedOnlineMonth(expandedOnlineMonth === month ? null : month)}
                        >
                          <span>{month}</span>
                          <span className={styles.arrow}>{expandedOnlineMonth === month ? '▼' : '▶'}</span>
                        </button>
                        {expandedOnlineMonth === month && (
                          <div className={styles.yearTournaments}>
                            {tournaments.map(tournament => (
                              <button
                                key={tournament.id}
                                className={`${styles.tournamentButton} ${selectedOnlineTournament === tournament.id ? styles.active : ''}`}
                                onClick={() => {
                                  setSelectedOnlineTournament(tournament.id);
                                  navigate(`/tournament-history/online/${tournament.id}`);
                                }}
                              >
                                {tournament.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            </>
        )}
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {isViewingOnlineTournament && tournamentId ? (
          <OnlineTournamentPage key={tournamentId} />
        ) : !tournamentId || !view ? (
          <div className={styles.placeholder}>
            <h2>Selecciona un torneo y vista para ver los resultados</h2>
            <p>Usa el menú lateral para navegar por el historial de torneos</p>
          </div>
        ) : view === 'global-standings' ? (
          <div className={styles.globalStandingsView}>
            <h1 className={styles.pageTitle}>Ranking Global</h1>
            <div className={styles.tableContainer}>
              <table className={styles.globalStandingsTable}>
                <thead>
                  <tr>
                    <th className={styles.positionColumn}>#</th>
                    <th className={styles.nameColumn}>Jugador</th>
                    <th>🥇 1eros Lugares conseguidos</th>
                    <th>🥈 2dos Lugares conseguidos</th>
                    <th>🥉 3eros Lugares conseguidos</th>
                    <th>Raza más usada PB (Winrate%)</th>
                    <th>Raza más usada BF (Winrate%)</th>
                  </tr>
                </thead>
                <tbody>
                  {globalStandings.map((standing, index) => {
                    let medalClass = '';
                    let positionBadge = '';
                    // Only the top 3 in the overall ranking get colors
                    if (index === 0) {
                      medalClass = styles.goldMedalRow;
                      positionBadge = '🏆';
                    } else if (index === 1) {
                      medalClass = styles.silverMedalRow;
                      positionBadge = '🥈';
                    } else if (index === 2) {
                      medalClass = styles.bronzeMedalRow;
                      positionBadge = '🥉';
                    }
                    
                    return (
                      <tr key={standing.player_id} className={medalClass}>
                        <td className={styles.positionColumn}>{index + 1}</td>
                        <td className={styles.nameColumn}>
                          <button 
                            className={styles.playerLink}
                            onClick={() => navigate(`/players/${encodeURIComponent(standing.player_name)}`)}
                          >
                            {positionBadge ? `${positionBadge} ` : ''}{standing.player_name}
                          </button>
                        </td>
                        <td className={styles.centerColumn}>{standing.first_place_count}</td>
                        <td className={styles.centerColumn}>{standing.second_place_count}</td>
                        <td className={styles.centerColumn}>{standing.third_place_count}</td>
                        <td>{standing.most_played_race_pb ? `${standing.most_played_race_pb} (${standing.winrate_pb.toFixed(1)}%)` : '-'}</td>
                        <td>{standing.most_played_race_bf ? `${standing.most_played_race_bf} (${standing.winrate_bf.toFixed(1)}%)` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'global-races' ? (
          <div className={styles.resumenView}>
            <h1 className={styles.pageTitle}>Razas Global - Todos los Torneos</h1>
            <div className={styles.chartsContainer}>
              <div className={styles.chartSection}>
                <h2>Uso de Razas en Primer Bloque</h2>
                {globalRaces ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={prepareChartData(globalRaces.pb_races, 'pb')}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => entry.value > 0 ? `${entry.value}` : ''}
                        labelLine={false}
                      >
                        {prepareChartData(globalRaces.pb_races, 'pb').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, 'pb')} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
                        wrapperStyle={{ color: 'var(--beige)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de razas para Primer Bloque</p>
                )}
              </div>
              <div className={styles.chartSection}>
                <h2>Uso de Razas en Bloque Furia</h2>
                {globalRaces ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={prepareChartData(globalRaces.bf_races, 'bf')}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => entry.value > 0 ? `${entry.value}` : ''}
                        labelLine={false}
                      >
                        {prepareChartData(globalRaces.bf_races, 'bf').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, 'bf')} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
                        wrapperStyle={{ color: 'var(--beige)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de razas para Bloque Furia</p>
                )}
              </div>
              <div className={styles.chartSection}>
                <h2>Winrate por Raza - Primer Bloque</h2>
                {globalRaces ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareWinrateData(globalRaces.pb_race_winrates)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="race" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Winrate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Winrate']} contentStyle={{ color: 'var(--coal-grey)' }} />
                      <Bar dataKey="winrate" fill="#38A169" label={{ fill: 'white', fontSize: 12, position: 'inside' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de winrates para Primer Bloque</p>
                )}
              </div>
              <div className={styles.chartSection}>
                <h2>Winrate por Raza - Bloque Furia</h2>
                {globalRaces ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareWinrateData(globalRaces.bf_race_winrates)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="race" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Winrate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Winrate']} contentStyle={{ color: 'var(--coal-grey)' }} />
                      <Bar dataKey="winrate" fill="#E53E3E" label={{ fill: 'white', fontSize: 12, position: 'inside' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de winrates para Bloque Furia</p>
                )}
              </div>
            </div>
          </div>
        ) : view === 'resumen' ? (
          <div className={styles.resumenView}>
            <h1 className={styles.pageTitle}>{selectedTournament?.name} - Resumen</h1>
            <div className={styles.chartsContainer}>
              <div className={styles.chartSection}>
                <h2>Uso de Razas en Primer Bloque</h2>
                {races ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={prepareChartData(races.pb_races, 'pb')}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => entry.value > 0 ? `${entry.value}` : ''}
                        labelLine={false}
                      >
                        {prepareChartData(races.pb_races, 'pb').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, 'pb')} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
                        wrapperStyle={{ color: 'var(--beige)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de razas para Primer Bloque</p>
                )}
              </div>
              <div className={styles.chartSection}>
                <h2>Uso de Razas en Bloque Furia</h2>
                {races ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={prepareChartData(races.bf_races, 'bf')}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => entry.value > 0 ? `${entry.value}` : ''}
                        labelLine={false}
                      >
                        {prepareChartData(races.bf_races, 'bf').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, 'bf')} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
                        wrapperStyle={{ color: 'var(--beige)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de razas para Bloque Furia</p>
                )}
              </div>
              <div className={styles.chartSection}>
                <h2>Winrate por Raza - Primer Bloque</h2>
                {races ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareWinrateData(races.pb_race_winrates)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="race" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Winrate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Winrate']} contentStyle={{ color: 'var(--coal-grey)' }} />
                      <Bar dataKey="winrate" fill="#38A169" label={{ fill: 'white', fontSize: 12, position: 'inside' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de winrates para Primer Bloque</p>
                )}
              </div>
              <div className={styles.chartSection}>
                <h2>Winrate por Raza - Bloque Furia</h2>
                {races ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareWinrateData(races.bf_race_winrates)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="race" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Winrate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Winrate']} contentStyle={{ color: 'var(--coal-grey)' }} />
                      <Bar dataKey="winrate" fill="#E53E3E" label={{ fill: 'white', fontSize: 12, position: 'inside' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de winrates para Bloque Furia</p>
                )}
              </div>
            </div>
          </div>
        ) : view === 'standings' ? (
          <div className={styles.standingsView}>
            <h1 className={styles.pageTitle}>{selectedTournament?.name} - Tabla Final</h1>
            <div className={styles.tableContainer}>
              <table className={styles.standingsTable}>
                <thead>
                  <tr>
                    <th className={styles.posColumn}>Pos.</th>
                    <th className={styles.nameColumn}>Jugador</th>
                    <th>Raza PB</th>
                    <th>Raza BF</th>
                    <th>RJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>TPG</th>
                    <th>MWR%</th>
                    <th>RWR%</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing) => {
                    const position = standing.final_position;
                    return (
                      <tr key={standing.id} className={position <= 3 ? styles.topThree : ''}>
                        <td className={styles.posColumn}>
                          <div className={styles.posCell}>
                            {getPositionIcon(position)}
                            <span>{position}</span>
                          </div>
                        </td>
                        <td className={styles.nameColumn}>
                          <button 
                            className={styles.playerLink}
                            onClick={() => navigate(`/players/${encodeURIComponent(standing.player_name)}`)}
                          >
                            {standing.player_name}
                          </button>
                        </td>
                        <td>{standing.race_pb || '-'}</td>
                        <td>{standing.race_bf || '-'}</td>
                        <td>{standing.matches_played}</td>
                        <td className={styles.winsColumn}>{standing.wins}</td>
                        <td className={styles.tiesColumn}>{standing.ties}</td>
                        <td className={styles.lossesColumn}>{standing.losses}</td>
                        <td className={styles.totalVictoriesColumn}>{standing.total_points_scored}</td>
                        <td className={styles.winRateColumn}>{calculateWinRate(standing)}%</td>
                        <td className={styles.winRateColumn}>{calculateRoundWinRate(standing)}%</td>
                        <td className={styles.pointsColumn}>{standing.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className={styles.legend}>
              <h3>Leyenda</h3>
              <ul>
                <li><strong>Pos:</strong> Posición Final</li>
                <li><strong>Raza PB:</strong> Raza elegida en Primer Bloque</li>
                <li><strong>Raza BF:</strong> Raza elegida en Bloque Furia</li>
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
