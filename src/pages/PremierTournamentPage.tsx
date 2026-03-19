import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fixtureAPI, APIFixtureResponse, APIStanding } from '../services/fixtureAPI';
import { getTournamentMonthYear, tournamentConfig } from '../config/tournamentConfig';
import { FaHandRock, FaFire, FaTrophy, FaMedal, FaThLarge, FaListOl } from 'react-icons/fa';
import styles from './PremierTournamentPage.module.css';

type Tab = 'fixture' | 'standings' | 'matriz';

const getSubformatDisplayName = (subformat: string | undefined | null): string => {
  if (!subformat) return '';
  const subformatMap: Record<string, string> = {
    'BFRL': 'Racial Libre',
    'BFVCR': 'VCR',
    'PBRL': 'Racial Libre',
    'PBRE': 'Racial Edición'
  };
  return subformatMap[subformat] || subformat;
};

const PremierTournamentPage = () => {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (tabParam === 'standings') return 'standings';
    if (tabParam === 'matriz') return 'matriz';
    if (tabParam === 'fixture') return 'fixture';
    return 'standings';
  });

  // Fixture state
  const [selectedRound, setSelectedRound] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fixtureData, setFixtureData] = useState<APIFixtureResponse | null>(null);
  const [fixtureLoading, setFixtureLoading] = useState(true);
  const [fixtureError, setFixtureError] = useState<string | null>(null);

  // Standings state
  const [standings, setStandings] = useState<APIStanding[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load fixture data
  useEffect(() => {
    const fetchFixture = async () => {
      try {
        setFixtureLoading(true);
        const data = await fixtureAPI.getFixture();
        setFixtureData(data);
        setFixtureError(null);
      } catch (err) {
        setFixtureError('Error al cargar el emparejamiento. Por favor, intenta de nuevo.');
        console.error('Error fetching fixture:', err);
      } finally {
        setFixtureLoading(false);
      }
    };

    fetchFixture();
  }, []);

  // Update URL when active tab changes
  useEffect(() => {
    if (activeTab === 'standings') {
      navigate('/torneo-premier/standings', { replace: false });
    } else if (activeTab === 'matriz') {
      navigate('/torneo-premier/matriz', { replace: false });
    } else {
      navigate('/torneo-premier/fixture', { replace: false });
    }
  }, [activeTab, navigate]);

  // Load standings data
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setStandingsLoading(true);
        const data = await fixtureAPI.getStandings();
        const sortedStandings = sortStandings(data);
        setStandings(sortedStandings);
        setLastUpdated(new Date());
        setStandingsError(null);
      } catch (err) {
        setStandingsError('Error al cargar la tabla de posiciones. Por favor, intenta de nuevo.');
        console.error('Error fetching standings:', err);
      } finally {
        setStandingsLoading(false);
      }
    };

    fetchStandings();

    // Set up auto-refresh every 15 minutes (900000 ms)
    const intervalId = setInterval(() => {
      fetchStandings();
    }, 900000);

    return () => clearInterval(intervalId);
  }, []);

  const sortStandings = (data: APIStanding[]): APIStanding[] => {
    return [...data].sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      if (a.total_points_scored !== b.total_points_scored) {
        return b.total_points_scored - a.total_points_scored;
      }
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }
      return 0;
    });
  };

  const currentRound = fixtureData?.rounds.find(r => r.number === selectedRound);

  const handleMenuClick = (roundNum: number) => {
    setSelectedRound(roundNum);
    setIsMobileMenuOpen(false);
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <FaTrophy className={styles.goldIcon} />;
    if (position === 2) return <FaMedal className={styles.silverIcon} />;
    if (position === 3) return <FaMedal className={styles.bronzeIcon} />;
    return null;
  };

  return (
    <div className={styles.container}>
      {/* Title and Subtitle */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>
          {tournamentConfig.name} {getTournamentMonthYear()}
        </h1>
        <p className={styles.subtitle}>
          {tournamentConfig.formats.map((format, index) => (
            <span key={index}>
              <Link to={format.link} style={{ color: 'var(--ocher)', textDecoration: 'none', fontWeight: 'bold' }} className={styles.formatLink}>
                {format.name}
              </Link>
              {index < tournamentConfig.formats.length - 1 && ' • '}
            </span>
          ))}
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'fixture' ? styles.active : ''}`}
          onClick={() => setActiveTab('fixture')}
        >
          <FaHandRock className={styles.tabIcon} />
          Emparejamiento
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'matriz' ? styles.active : ''}`}
          onClick={() => setActiveTab('matriz')}
        >
          <FaThLarge className={styles.tabIcon} />
          Matriz de Resultados
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'standings' ? styles.active : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          <FaListOl className={styles.tabIcon} />
          Tabla de Posiciones
        </button>
      </div>

      {/* Fixture Tab */}
      {activeTab === 'fixture' && (
        <div className={styles.tabContent}>
          {fixtureLoading ? (
            <div className={styles.loading}>Cargando emparejamiento...</div>
          ) : fixtureError ? (
            <div className={styles.error}>{fixtureError}</div>
          ) : !fixtureData || fixtureData.rounds.length === 0 ? (
            <div className={styles.empty}>No hay emparejamiento disponible aún.</div>
          ) : (
            <div className={styles.layout}>
              <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
                <nav className={styles.nav}>
                  {fixtureData.rounds.map(round => {
                    const RoundIcon = round.format === 'PB' ? FaListOl : FaFire;
                    return (
                      <button
                        key={round.number}
                        className={`${styles.menuItem} ${selectedRound === round.number ? styles.active : ''}`}
                        onClick={() => handleMenuClick(round.number)}
                        title={`Ronda ${round.number} - ${round.format}${round.subformat ? ` (${getSubformatDisplayName(round.subformat)})` : ''}`}
                      >
                        <RoundIcon className={styles.menuIcon} />
                        <span>Ronda {round.number}</span>
                        {round.subformat && <span className={styles.subformatBadge}>{getSubformatDisplayName(round.subformat)}</span>}
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {isMobileMenuOpen && <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />}

              <div className={styles.content}>
                <div className={styles.header}>
                  <button className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    ☰
                  </button>
                  <div>
                    <h1>
                      {currentRound && (currentRound.format === 'PB' ? <FaListOl className={styles.icon} /> : <FaFire className={styles.icon} />)}
                      Ronda {selectedRound} - {currentRound?.format === 'PB' ? 'Primer Bloque' : 'Bloque Furia'}
                    </h1>
                    {currentRound?.subformat && (
                      <p className={styles.subformatText}>{getSubformatDisplayName(currentRound.subformat)}</p>
                    )}
                  </div>
                </div>

                {currentRound ? (
                  <div className={styles.matchesContainer}>
                    <table className={styles.matchTable}>
                      <thead>
                        <tr>
                          <th>Duelista</th>
                          <th>Resultado</th>
                          <th></th>
                          <th>Resultado</th>
                          <th>Duelista</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRound.matches.map((match) => (
                          <tr key={match.id}>
                            <td className={styles.playerName}>{match.player1_name}</td>
                            <td className={styles.score}>{match.score1 ?? '-'}</td>
                            <td className={styles.vs}>vs</td>
                            <td className={styles.score}>{match.score2 ?? '-'}</td>
                            <td className={styles.playerName}>{match.player2_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No hay datos disponibles para esta ronda.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standings Tab */}
      {activeTab === 'standings' && (
        <div className={styles.tabContent}>
          {standingsLoading ? (
            <div className={styles.loading}>Cargando tabla de posiciones...</div>
          ) : standingsError ? (
            <div className={styles.error}>{standingsError}</div>
          ) : standings.length === 0 ? (
            <div className={styles.empty}>No hay datos de posiciones disponibles aún.</div>
          ) : (
            <div className={styles.standingsWrapper}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className={styles.title}>Tabla de Posiciones</h1>
                {lastUpdated && (
                  <div style={{ fontSize: '0.9rem', color: '#888', textAlign: 'right' }}>
                    <div>Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Se actualiza cada 15 minutos</div>
                  </div>
                )}
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.standingsTable}>
                  <thead>
                    <tr>
                      <th className={styles.posColumn}>Pos.</th>
                      <th className={styles.nameColumn}>Jugador</th>
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
                    {standings.map((player, index) => {
                      const position = index + 1;
                      const matchWinRate = player.total_matches > 0 
                        ? ((player.total_points_scored / player.total_matches) * 100).toFixed(1)
                        : '0.0';
                      
                      const totalRounds = player.wins + player.ties + player.losses;
                      const roundWinRate = totalRounds > 0
                        ? (((player.wins + player.ties * 0.5) / totalRounds) * 100).toFixed(1)
                        : '0.0';
                      
                      return (
                        <tr key={player.id} className={position <= 3 ? styles.topThree : ''}>
                          <td className={styles.posColumn}>
                            <div className={styles.posCell}>
                              {getPositionIcon(position)}
                              <span>{position}</span>
                            </div>
                          </td>
                          <td className={styles.nameColumn}>
                            <button 
                              className={styles.playerLink}
                              onClick={() => navigate(`/players/${encodeURIComponent(player.name)}`)}
                            >
                              {player.name}
                            </button>
                          </td>
                          <td>{player.matches_played}</td>
                          <td className={styles.winsColumn}>{player.wins}</td>
                          <td className={styles.tiesColumn}>{player.ties}</td>
                          <td className={styles.lossesColumn}>{player.losses}</td>
                          <td className={styles.totalVictoriesColumn}>{player.total_points_scored}</td>
                          <td className={styles.winRateColumn}>{matchWinRate}%</td>
                          <td className={styles.winRateColumn}>{roundWinRate}%</td>
                          <td className={styles.pointsColumn}>{player.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.legend}>
                <h3>Leyenda</h3>
                <ul>
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

              <div className={styles.tiebreaker}>
                <h3>Criterios de Desempate</h3>
                <ol>
                  <li>⭐ <strong>Puntaje total</strong> (mayor puntaje)</li>
                  <li>💪 <strong>Mayor cantidad de victorias</strong></li>
                  <li>🎯 <strong>Victoria directa</strong> (ganó al otro jugador empatado durante las rondas)</li>
                  <li>⚔️ <strong>Duelo de desempate</strong> (si ningún criterio anterior resuelve)</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matriz Resumen Tab */}
      {activeTab === 'matriz' && (
        <div className={styles.tabContent}>
          {fixtureLoading || standingsLoading ? (
            <div className={styles.loading}>Cargando matriz...</div>
          ) : fixtureError || standingsError ? (
            <div className={styles.error}>{fixtureError || standingsError}</div>
          ) : !fixtureData || fixtureData.rounds.length === 0 || standings.length === 0 ? (
            <div className={styles.empty}>No hay datos disponibles para la matriz.</div>
          ) : (
            <div className={styles.standingsWrapper}>
              <h1 className={styles.title}>Matriz de Resultados</h1>
              <div className={styles.matrixTableContainer}>
                <table className={styles.matrixTable}>
                  <thead>
                    <tr>
                      <th className={styles.matrixHeaderCell}>Jugador</th>
                      {standings.map((player) => (
                        <th key={player.id} className={styles.matrixHeaderCell}>
                          <span className={styles.matrixPlayerNameRotated}>
                            {player.name.split(' ')[0]}
                          </span>
                        </th>
                      ))}
                      <th className={styles.matrixHeaderCell}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((rowPlayer) => {
                      return (
                        <tr key={rowPlayer.id}>
                          <td className={styles.matrixRowHeaderCell}>{rowPlayer.name}</td>
                          {standings.map((colPlayer) => {
                            // Find match result between rowPlayer and colPlayer
                            let matchResult = '-';
                            let resultClass = '';
                            
                            if (rowPlayer.id === colPlayer.id) {
                              resultClass = styles.matrixDiagonalCell;
                            } else {
                              // Look through all rounds for matches
                              for (const round of fixtureData.rounds) {
                                const match = round.matches.find(m => 
                                  (m.player1_name === rowPlayer.name && m.player2_name === colPlayer.name) ||
                                  (m.player1_name === colPlayer.name && m.player2_name === rowPlayer.name)
                                );
                                
                                if (match) {
                                  if (match.player1_name === rowPlayer.name) {
                                    matchResult = `${match.score1 ?? '-'}-${match.score2 ?? '-'}`;
                                    if (match.score1 !== undefined && match.score1 !== null && match.score2 !== undefined && match.score2 !== null) {
                                      if (match.score1 > match.score2) resultClass = styles.matrixWin;
                                      else if (match.score1 < match.score2) resultClass = styles.matrixLose;
                                      else resultClass = styles.matrixTie;
                                    }
                                  } else {
                                    matchResult = `${match.score2 ?? '-'}-${match.score1 ?? '-'}`;
                                    if (match.score1 !== undefined && match.score1 !== null && match.score2 !== undefined && match.score2 !== null) {
                                      if (match.score2 > match.score1) resultClass = styles.matrixWin;
                                      else if (match.score2 < match.score1) resultClass = styles.matrixLose;
                                      else resultClass = styles.matrixTie;
                                    }
                                  }
                                  break;
                                }
                              }
                            }
                            
                            return (
                              <td
                                key={`${rowPlayer.id}-${colPlayer.id}`}
                                className={`${styles.matrixDataCell} ${resultClass}`}
                              >
                                <span className={styles.matrixScoreText}>{matchResult}</span>
                              </td>
                            );
                          })}
                          <td className={styles.matrixPointsCell}>{rowPlayer.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PremierTournamentPage;
