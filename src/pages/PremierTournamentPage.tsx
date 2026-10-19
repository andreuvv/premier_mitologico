import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fixtureAPI, APIFixtureResponse, APIMatchDetail, APIStanding } from '../services/fixtureAPI';
import { tournamentAdminAPI } from '../services/tournamentAdminService';
import { supabase } from '../config/supabase';
import { useActiveTournamentCard } from '../hooks/useActiveTournamentCard';
import { useAuth } from '../hooks/useAuth';
import { isCurrentUserBanlistAdmin } from '../services/monthlyBanlistService';
import { FaHandRock, FaFire, FaTrophy, FaMedal, FaThLarge, FaListOl, FaClock, FaChevronLeft, FaChevronRight, FaPlay, FaPause, FaRedo, FaStar } from 'react-icons/fa';
import styles from './PremierTournamentPage.module.css';

type Tab = 'fixture' | 'standings' | 'matriz';

const headToHeadWinner = (
  fixture: APIFixtureResponse | undefined,
  idA: number,
  idB: number,
): number | null => {
  if (!fixture) return null;
  let aWins = 0;
  let bWins = 0;
  for (const round of fixture.rounds) {
    if (round.is_extra_round) continue;
    for (const match of round.matches) {
      if (!match.completed || match.score1 === null || match.score2 === null || match.score1 === match.score2) continue;
      const players = [match.player1_id, match.player2_id];
      if (!players.includes(idA) || !players.includes(idB)) continue;
      const winner = match.score1 > match.score2 ? match.player1_id : match.player2_id;
      if (winner === idA) aWins += 1;
      else bWins += 1;
    }
  }
  if (aWins > bWins) return idA;
  if (bWins > aWins) return idB;
  return null;
};

const sortStandingsData = (data: APIStanding[], fixture?: APIFixtureResponse): APIStanding[] => {
  const sorted = [...data].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.total_points_scored !== b.total_points_scored) return b.total_points_scored - a.total_points_scored;
    if (a.wins !== b.wins) return b.wins - a.wins;
    return a.id - b.id;
  });

  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (
      j < sorted.length
      && sorted[i].points === sorted[j].points
      && sorted[i].total_points_scored === sorted[j].total_points_scored
      && sorted[i].wins === sorted[j].wins
    ) {
      j += 1;
    }
    if (j - i === 2 && headToHeadWinner(fixture, sorted[i].id, sorted[i + 1].id) === sorted[i + 1].id) {
      [sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]];
    }
    i = j;
  }

  return sorted;
};

const applyPlayoffPositions = (
  standings: APIStanding[],
  fixture: APIFixtureResponse
): { standings: APIStanding[]; playoffWinners: Set<string> } => {
  const extraRounds = fixture.rounds.filter(r => r.is_extra_round);
  if (extraRounds.length === 0) return { standings, playoffWinners: new Set() };

  const extraMatches = extraRounds
    .flatMap(r => r.matches)
    .filter(m => m.completed && m.score1 !== null && m.score2 !== null);

  if (extraMatches.length === 0) return { standings, playoffWinners: new Set() };

  const preExtraMap = new Map(standings.map(p => [p.name, { ...p }]));

  for (const match of extraMatches) {
    const p1 = preExtraMap.get(match.player1_name);
    const p2 = preExtraMap.get(match.player2_name);
    if (!p1 || !p2 || match.score1 === null || match.score2 === null) continue;
    p1.total_points_scored -= match.score1;
    p2.total_points_scored -= match.score2;
    if (match.score1 > match.score2) {
      p1.points -= 3; p1.wins -= 1;
    } else if (match.score2 > match.score1) {
      p2.points -= 3; p2.wins -= 1;
    } else {
      p1.points -= 1; p2.points -= 1; p1.ties -= 1; p2.ties -= 1;
    }
  }

  const sortedPreExtra = sortStandingsData(Array.from(preExtraMap.values()), fixture);
  const seedPosition = new Map<string, number>();
  sortedPreExtra.forEach((p, i) => seedPosition.set(p.name, i + 1));

  const positionOverrides = new Map<string, number>();
  const playoffWinners = new Set<string>();

  for (const match of extraMatches) {
    const pos1 = seedPosition.get(match.player1_name) ?? 9999;
    const pos2 = seedPosition.get(match.player2_name) ?? 9999;
    const higherPos = Math.min(pos1, pos2);
    const lowerPos = Math.max(pos1, pos2);
    if (match.score1 !== null && match.score2 !== null) {
      if (match.score1 > match.score2) {
        positionOverrides.set(match.player1_name, higherPos);
        positionOverrides.set(match.player2_name, lowerPos);
        playoffWinners.add(match.player1_name);
      } else if (match.score2 > match.score1) {
        positionOverrides.set(match.player2_name, higherPos);
        positionOverrides.set(match.player1_name, lowerPos);
        playoffWinners.add(match.player2_name);
      }
    }
  }

  if (positionOverrides.size === 0) return { standings, playoffWinners };

  const playoffPlayerNames = new Set(positionOverrides.keys());
  const nonPlayoffPlayers = sortStandingsData(standings.filter(p => !playoffPlayerNames.has(p.name)), fixture);
  const result: (APIStanding | null)[] = new Array(standings.length).fill(null);

  for (const [name, pos] of positionOverrides.entries()) {
    const player = standings.find(p => p.name === name);
    if (player) result[pos - 1] = player;
  }

  let nonPlayoffIdx = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) result[i] = nonPlayoffPlayers[nonPlayoffIdx++] ?? null;
  }

  return { standings: result.filter((p): p is APIStanding => p !== null), playoffWinners };
};

const ROUND_TIMER_SECONDS = 45 * 60;

const pointsBeforeRound = (fixture: APIFixtureResponse, playerId: number, roundNumber: number): number => {
  let points = 0;
  fixture.rounds.forEach((round) => {
    if (round.number >= roundNumber) return;
    round.matches.forEach((match) => {
      if (!match.completed || match.score1 === null || match.score2 === null) return;
      const isPlayer1 = match.player1_id === playerId;
      const isPlayer2 = match.player2_id === playerId;
      if (!isPlayer1 && !isPlayer2) return;
      const own = isPlayer1 ? match.score1 : match.score2;
      const other = isPlayer1 ? match.score2 : match.score1;
      if (own > other) points += 3;
      else if (match.player2_id !== null && own === other) points += 1;
    });
  });
  return points;
};

const playerInitial = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';

const companionRecordName = (format: 'PB' | 'FX' | 'PBFX' | undefined): string => {
  if (format === 'PB') return 'Edición';
  if (format === 'FX') return 'Ragnarok';
  return 'Edición/Ragnarok';
};

const isLibreRound = (subformat: string | null | undefined): boolean => {
  const sub = (subformat || '').toLowerCase();
  return sub === 'libre' || sub === 'pbrl' || sub === 'bfrl' || sub.includes('libre');
};

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
  const { user } = useAuth();
  const { loading: activeLoading, tournament: activeTournament } = useActiveTournamentCard();
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
  const [playoffWinners, setPlayoffWinners] = useState<Set<string>>(new Set());
  const [hasExtraRound, setHasExtraRound] = useState(false);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Modal and Carousel state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carouselRoundIndex, setCarouselRoundIndex] = useState(0);
  const [timeRemaining45, setTimeRemaining45] = useState(ROUND_TIMER_SECONDS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatars, setAvatars] = useState<Map<number, string>>(new Map());
  const [reportMatchId, setReportMatchId] = useState<number | null>(null);
  const [reportScore1, setReportScore1] = useState('');
  const [reportScore2, setReportScore2] = useState('');
  const [reportError, setReportError] = useState('');
  const [isCountdown45Running, setIsCountdown45Running] = useState(false);
  const [timeRemaining5, setTimeRemaining5] = useState(5 * 60); // 5 minutes in seconds
  const [isCountdown5Running, setIsCountdown5Running] = useState(false);
  const [firstCountdownCompleted, setFirstCountdownCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    isCurrentUserBanlistAdmin(user.id).then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [user]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('premier_player_id, avatar_url')
      .eq('is_public', true)
      .not('premier_player_id', 'is', null)
      .then(({ data }) => {
        const next = new Map<number, string>();
        (data ?? []).forEach((row) => {
          const playerId = row.premier_player_id as number | null;
          const avatar = row.avatar_url as string | null;
          if (playerId && avatar) next.set(playerId, avatar);
        });
        setAvatars(next);
      });
  }, []);

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

  // Auto-refresh fixture data every 1 minute and 30 seconds
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const data = await fixtureAPI.getFixture();
        setFixtureData(data);
      } catch (err) {
        console.error('Error refreshing fixture data:', err);
      }
    }, 90 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 45-minute countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCountdown45Running && timeRemaining45 > 0) {
      interval = setInterval(() => {
        setTimeRemaining45(prev => {
          if (prev <= 1) {
            setIsCountdown45Running(false);
            setFirstCountdownCompleted(true);
            setIsCountdown5Running(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCountdown45Running, timeRemaining45]);

  // 5-minute countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCountdown5Running && timeRemaining5 > 0) {
      interval = setInterval(() => {
        setTimeRemaining5(prev => {
          if (prev <= 1) {
            setIsCountdown5Running(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCountdown5Running, timeRemaining5]);

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

  // Load standings data. The 90s refresh only replaces table rows.
  useEffect(() => {
    let cancelled = false;

    const fetchStandings = async (silent: boolean) => {
      try {
        if (!silent) setStandingsLoading(true);
        const [data, fixture] = await Promise.all([
          fixtureAPI.getStandings(),
          fixtureAPI.getFixture(),
        ]);
        if (cancelled) return;
        const extraRoundExists = fixture.rounds.some(r => r.is_extra_round);
        setHasExtraRound(extraRoundExists);
        setFixtureData(fixture);
        let sorted: APIStanding[];
        let winners: Set<string>;
        if (extraRoundExists) {
          const result = applyPlayoffPositions(data, fixture);
          sorted = result.standings;
          winners = result.playoffWinners;
        } else {
          sorted = sortStandingsData(data, fixture);
          winners = new Set();
        }
        setStandings(sorted);
        setPlayoffWinners(winners);
        setLastUpdated(new Date());
        setStandingsError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching standings:', err);
        if (!silent) {
          setStandingsError('Error al cargar la tabla de posiciones. Por favor, intenta de nuevo.');
        }
      } finally {
        if (!cancelled && !silent) setStandingsLoading(false);
      }
    };

    fetchStandings(false);

    const intervalId = setInterval(() => {
      fetchStandings(true);
    }, 90 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);



  interface RecordByType {
    libre: { wins: number; ties: number; losses: number };
    edicion: { wins: number; ties: number; losses: number };
  }

  const calculateRecordByRoundType = (playerName: string): RecordByType => {
    const record: RecordByType = {
      libre: { wins: 0, ties: 0, losses: 0 },
      edicion: { wins: 0, ties: 0, losses: 0 }
    };

    if (!fixtureData) return record;

    fixtureData.rounds.forEach(round => {
      const targetRecord = isLibreRound(round.subformat) ? record.libre : record.edicion;

      round.matches.forEach(match => {
        if (match.score1 === null || match.score2 === null) return;

        if (match.player1_name === playerName) {
          if (match.score1 > match.score2) targetRecord.wins++;
          else if (match.score1 < match.score2) targetRecord.losses++;
          else targetRecord.ties++;
        } else if (match.player2_name === playerName) {
          if (match.score2 > match.score1) targetRecord.wins++;
          else if (match.score2 < match.score1) targetRecord.losses++;
          else targetRecord.ties++;
        }
      });
    });

    return record;
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

  const openReport = (match: APIMatchDetail) => {
    setReportMatchId(match.id);
    setReportScore1(match.score1 === null ? '' : String(match.score1));
    setReportScore2(match.score2 === null ? '' : String(match.score2));
    setReportError('');
  };

  const saveReport = async (event: FormEvent) => {
    event.preventDefault();
    if (reportMatchId === null) return;
    const score1 = Number(reportScore1);
    const score2 = Number(reportScore2);
    if (reportScore1.trim() === '' || reportScore2.trim() === '' || Number.isNaN(score1) || Number.isNaN(score2)) {
      setReportError('Ingresa los dos resultados.');
      return;
    }
    try {
      await tournamentAdminAPI.updateScore(reportMatchId, score1, score2);
      const [fixture, data] = await Promise.all([
        fixtureAPI.getFixture(),
        fixtureAPI.getStandings(),
      ]);
      setFixtureData(fixture);
      const extraRoundExists = fixture.rounds.some((round) => round.is_extra_round);
      setHasExtraRound(extraRoundExists);
      if (extraRoundExists) {
        const result = applyPlayoffPositions(data, fixture);
        setStandings(result.standings);
        setPlayoffWinners(result.playoffWinners);
      } else {
        setStandings(sortStandingsData(data, fixture));
        setPlayoffWinners(new Set());
      }
      setLastUpdated(new Date());
      setReportMatchId(null);
      setReportError('');
    } catch (saveError) {
      setReportError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el resultado.');
    }
  };

  const renderDuelist = (playerId: number, name: string, roundNumber: number, side: 'left' | 'right') => {
    const avatar = avatars.get(playerId);
    const points = fixtureData ? pointsBeforeRound(fixtureData, playerId, roundNumber) : 0;
    return (
      <div className={`${styles.duelist} ${side === 'left' ? styles.duelistLeft : styles.duelistRight}`}>
        {side === 'right' && (
          avatar
            ? <img src={avatar} alt="" className={styles.duelistAvatar} />
            : <span className={styles.duelistFallback}>{playerInitial(name)}</span>
        )}
        <span className={styles.duelistMeta}>
          <span className={styles.duelistName}>{name}</span>
          <span className={styles.enteringPoints}>{points} pts</span>
        </span>
        {side === 'left' && (
          avatar
            ? <img src={avatar} alt="" className={styles.duelistAvatar} />
            : <span className={styles.duelistFallback}>{playerInitial(name)}</span>
        )}
      </div>
    );
  };

  const renderReport = (match: APIMatchDetail) => {
    if (!isAdmin || match.player2_id === null) return null;
    if (reportMatchId !== match.id) {
      return (
        <button type="button" className={styles.reportButton} onClick={() => openReport(match)}>
          Reportar
        </button>
      );
    }
    return (
      <form className={styles.reportForm} onSubmit={saveReport}>
        <input inputMode="numeric" aria-label={`Resultado de ${match.player1_name}`} value={reportScore1} onChange={(event) => setReportScore1(event.target.value)} />
        <span>vs</span>
        <input inputMode="numeric" aria-label={`Resultado de ${match.player2_name}`} value={reportScore2} onChange={(event) => setReportScore2(event.target.value)} />
        <button type="submit" className={styles.reportButton}>Guardar</button>
        <button type="button" className={styles.reportCancel} onClick={() => setReportMatchId(null)}>Cancelar</button>
        {reportError && <span className={styles.reportError}>{reportError}</span>}
      </form>
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrevRound = () => {
    setCarouselRoundIndex(prev => (prev > 0 ? prev - 1 : (fixtureData?.rounds.length ?? 1) - 1));
  };

  const handleNextRound = () => {
    setCarouselRoundIndex(prev => (prev < (fixtureData?.rounds.length ?? 1) - 1 ? prev + 1 : 0));
  };

  const handleStop45 = () => {
    setIsCountdown45Running(false);
  };

  const handleReset45 = () => {
    setIsCountdown45Running(false);
    setTimeRemaining45(ROUND_TIMER_SECONDS);
    setFirstCountdownCompleted(false);
    setIsCountdown5Running(false);
    setTimeRemaining5(5 * 60);
  };

  const handleStop5 = () => {
    setIsCountdown5Running(false);
  };

  const handleReset5 = () => {
    setIsCountdown5Running(false);
    setTimeRemaining5(5 * 60);
  };

  const handleCompleteReset = () => {
    setIsCountdown45Running(false);
    setIsCountdown5Running(false);
    setTimeRemaining45(ROUND_TIMER_SECONDS);
    setTimeRemaining5(5 * 60);
    setFirstCountdownCompleted(false);
  };

  return (
    <div className={styles.container}>
      {/* Title and Subtitle */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>
          {activeLoading
            ? 'Cargando…'
            : activeTournament
              ? `${activeTournament.name} ${activeTournament.monthYear}`
              : 'Aún no se ha creado un nuevo torneo.'}
        </h1>
        {activeTournament && (
          <p className={styles.subtitle}>
            {activeTournament.formats.map((format, index) => (
              <span key={format.link + format.name}>
                <Link to={format.link} style={{ color: 'var(--ocher)', textDecoration: 'none', fontWeight: 'bold' }} className={styles.formatLink}>
                  {format.name}
                </Link>
                {index < activeTournament.formats.length - 1 && ' • '}
              </span>
            ))}
          </p>
        )}
        <button
          className={styles.timerButton}
          onClick={() => {
            setIsModalOpen(true);
            setCarouselRoundIndex(0);
          }}
          title="Abre modal con cronómetro y carrusel de rondas"
        >
          <FaClock className={styles.timerIcon} />
          Cronómetro
        </button>
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
                      Ronda {selectedRound} - {currentRound?.format === 'PB' ? 'Primer Bloque' : 'Furia Extendido'}
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
                            <td>{renderDuelist(match.player1_id, match.player1_name, currentRound.number, 'left')}</td>
                            <td className={styles.score}>{match.score1 ?? '-'}</td>
                            <td className={styles.vs}>
                              <div>vs</div>
                              {renderReport(match)}
                            </td>
                            <td className={styles.score}>{match.score2 ?? '-'}</td>
                            <td>{match.player2_id === null ? match.player2_name : renderDuelist(match.player2_id, match.player2_name, currentRound.number, 'right')}</td>
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
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Se actualiza cada 1:30 minutos</div>
                  </div>
                )}
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.standingsTable}>
                  <thead>
                    <tr>
                      <th className={styles.posColumn}>Pos.</th>
                      <th className={styles.nameColumn}>Jugador</th>
                      <th title="Rondas Jugadas">RJ</th>
                      <th title="Rondas Ganadas">G</th>
                      <th title="Rondas Empatadas">E</th>
                      <th title="Rondas Perdidas">P</th>
                      <th title="Total Partidas Ganadas (partidas individuales ganadas)">TPG</th>
                      <th title="Record en rondas Racial Libre (Victorias-Empates-Derrotas)">Record Libre</th>
                      <th title={`Record en rondas Racial ${companionRecordName(activeTournament?.format)} (Victorias-Empates-Derrotas)`}>
                        Record {companionRecordName(activeTournament?.format)}
                      </th>
                      <th title="Matches Win Rate: (Partidas ganadas / Partidas jugadas) * 100">MWR%</th>
                      <th title="Rounds Win Rate: ((Rondas ganadas + Rondas empatadas * 0.5) / Rondas Jugadas) * 100">RWR%</th>
                      <th title="Puntos (3 por victoria, 1 por empate)">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, index) => {
                      const position = index + 1;
                      const isPlayoffWinner = playoffWinners.has(player.name);
                      const matchWinRate = player.total_matches > 0 
                        ? ((player.total_points_scored / player.total_matches) * 100).toFixed(1)
                        : '0.0';
                      
                      const totalRounds = player.wins + player.ties + player.losses;
                      const roundWinRate = totalRounds > 0
                        ? (((player.wins + player.ties * 0.5) / totalRounds) * 100).toFixed(1)
                        : '0.0';
                      
                      const recordByType = calculateRecordByRoundType(player.name);
                      
                      return (
                        <tr key={player.id} className={[
                          position === 1 ? styles.pos1 : '',
                          position === 2 ? styles.pos2 : '',
                          position === 3 ? styles.pos3 : '',
                          position === 4 ? styles.pos4 : '',
                          position <= 4 ? styles.topFour : '',
                          isPlayoffWinner ? styles.playoffWinner : '',
                        ].join(' ')}>
                          <td className={styles.posColumn}>
                            <div className={styles.posCell}>
                              {getPositionIcon(position)}
                              <span>{position}</span>
                              {isPlayoffWinner && (
                                <FaStar
                                  className={position === 1 ? styles.playoffIcon : styles.playoffIconBronze}
                                  title="Ganador de ronda de finales"
                                />
                              )}
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
                          <td className={styles.recordCell}>
                            <span className={styles.recordWins}>{recordByType.libre.wins}</span>
                            <span className={styles.recordSeparator}>-</span>
                            <span className={styles.recordTies}>{recordByType.libre.ties}</span>
                            <span className={styles.recordSeparator}>-</span>
                            <span className={styles.recordLosses}>{recordByType.libre.losses}</span>
                          </td>
                          <td className={styles.recordCell}>
                            <span className={styles.recordWins}>{recordByType.edicion.wins}</span>
                            <span className={styles.recordSeparator}>-</span>
                            <span className={styles.recordTies}>{recordByType.edicion.ties}</span>
                            <span className={styles.recordSeparator}>-</span>
                            <span className={styles.recordLosses}>{recordByType.edicion.losses}</span>
                          </td>
                          <td className={styles.winRateColumn}>{matchWinRate}%</td>
                          <td className={styles.winRateColumn}>{roundWinRate}%</td>
                          <td className={styles.pointsColumn}>{player.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasExtraRound && (
                <div className={styles.extraRoundNotice}>
                  <FaStar className={styles.playoffIcon} />
                  <span>
                    Este torneo incluyó una <strong>ronda de finales</strong>. Las posiciones finales con{' '}
                    <FaStar className={styles.playoffIconInline} /> fueron determinadas por el resultado
                    de esa ronda, independientemente del puntaje acumulado.
                  </span>
                </div>
              )}

              <div className={styles.legend}>
                <h3>Leyenda</h3>
                <ul>
                  <li><strong>RJ:</strong> Rondas Jugadas</li>
                  <li><strong>G:</strong> Rondas Ganadas</li>
                  <li><strong>E:</strong> Rondas Empatadas</li>
                  <li><strong>P:</strong> Rondas Perdidas</li>
                  <li><strong>TPG:</strong> Total Partidas Ganadas (partidas individuales ganadas)</li>
                  <li><strong>Record Libre:</strong> Record en rondas Racial Libre (Victorias-Empates-Derrotas)</li>
                  <li><strong>Record {companionRecordName(activeTournament?.format)}:</strong> Record en rondas Racial {companionRecordName(activeTournament?.format)} (Victorias-Empates-Derrotas)</li>
                  <li><strong>MWR%:</strong> Matches Win Rate ( (Partidas ganadas / Partidas jugadas) * 100 )</li>
                  <li><strong>RWR%:</strong> Rounds Win Rate ( ((Rondas ganadas + Rondas empatadas * 0.5) / Rondas Jugadas) * 100 )</li>
                  <li><strong>Pts:</strong> Puntos (3 por victoria, 1 por empate)</li>
                  {hasExtraRound && (
                    <li><FaStar className={styles.playoffIconInline} /> <strong>Ronda de finales:</strong> Posición determinada por resultado de ronda de finales</li>
                  )}
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
                                  (m.player1_id === rowPlayer.id && m.player2_id === colPlayer.id) ||
                                  (m.player1_id === colPlayer.id && m.player2_id === rowPlayer.id)
                                );
                                
                                if (match) {
                                  if (match.player1_id === rowPlayer.id) {
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

      {/* Timer Modal */}
      {isModalOpen && fixtureData && fixtureData.rounds.length > 0 && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Cronómetro de Rondas</h2>
              <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <div className={styles.modalContent}>
              {/* Carousel - Left Column */}
              <div className={styles.carouselSection}>
                <div className={styles.carouselContainer}>
                  <div className={styles.carouselDisplay}>
                  {fixtureData.rounds[carouselRoundIndex] && (
                    <div className={styles.roundCard}>
                      <h3>
                        {fixtureData.rounds[carouselRoundIndex].format === 'PB' ? (
                          <FaListOl className={styles.roundIcon} />
                        ) : (
                          <FaFire className={styles.roundIcon} />
                        )}
                        Ronda {fixtureData.rounds[carouselRoundIndex].number}
                      </h3>
                      <div className={styles.formatRow}>
                        <p className={styles.roundFormat}>
                          {fixtureData.rounds[carouselRoundIndex].format === 'PB' ? 'Primer Bloque' : 'Furia Extendido'}
                        </p>
                        {fixtureData.rounds[carouselRoundIndex].subformat && (
                          <p className={styles.roundSubformat}>
                            {getSubformatDisplayName(fixtureData.rounds[carouselRoundIndex].subformat)}
                          </p>
                        )}
                      </div>
                      <div className={styles.matchesList}>
                        {fixtureData.rounds[carouselRoundIndex].matches.map((match) => (
                          <div key={match.id} className={styles.matchBlock}>
                            <div className={styles.matchItem}>
                              {renderDuelist(match.player1_id, match.player1_name, fixtureData.rounds[carouselRoundIndex].number, 'left')}
                              <span className={styles.matchScore}>{match.score1 ?? '-'}</span>
                              <span className={styles.vs}>vs</span>
                              <span className={styles.matchScore}>{match.score2 ?? '-'}</span>
                              {match.player2_id === null
                                ? <span className={styles.duelistName}>{match.player2_name}</span>
                                : renderDuelist(match.player2_id, match.player2_name, fixtureData.rounds[carouselRoundIndex].number, 'right')}
                            </div>
                            {renderReport(match)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
                <div className={styles.carouselArrowsContainer}>
                  <button
                    className={styles.carouselArrow}
                    onClick={handlePrevRound}
                    title="Ronda anterior"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    className={styles.carouselArrow}
                    onClick={handleNextRound}
                    title="Siguiente ronda"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              {/* Countdowns */}
              <div className={styles.countdownsSection}>
                {/* Unified countdown box */}
                <div className={styles.countdownBox}>
                  {/* Show 45-min timer when it's active, or in corner when supplementary time is active */}
                  {firstCountdownCompleted && (
                    <div className={styles.timerCorner}>
                      <div className={styles.timerCornerLabel}>Tiempo Principal COMPLETADO</div>
                      <div className={styles.timerCornerDisplay}>{formatTime(timeRemaining45)}</div>
                    </div>
                  )}

                  <div className={styles.countdownTitle}>
                    {firstCountdownCompleted ? 'Tiempo Suplementario' : 'Tiempo Principal'}
                  </div>
                  
                  <div className={styles.countdownDisplay}>
                    {firstCountdownCompleted ? formatTime(timeRemaining5) : formatTime(timeRemaining45)}
                  </div>

                  <div className={styles.buttonGroup}>
                    {!firstCountdownCompleted ? (
                      <>
                        <button
                          className={`${styles.countdownButton} ${styles.buttonStart} ${isCountdown45Running ? styles.running : ''}`}
                          onClick={() => {
                            if (!isCountdown45Running && timeRemaining45 > 0) {
                              setIsCountdown45Running(true);
                            }
                          }}
                          disabled={isCountdown45Running || timeRemaining45 === 0}
                        >
                          <FaPlay /> {isCountdown45Running ? 'En progreso...' : 'Iniciar'}
                        </button>
                        {isCountdown45Running && (
                          <button
                            className={`${styles.countdownButton} ${styles.buttonStop}`}
                            onClick={handleStop45}
                          >
                            <FaPause /> Detener
                          </button>
                        )}
                        <button
                          className={`${styles.countdownButton} ${styles.buttonReset}`}
                          onClick={handleReset45}
                        >
                          <FaRedo /> Reiniciar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`${styles.countdownButton} ${styles.buttonStart} ${isCountdown5Running ? styles.running : ''}`}
                          onClick={() => {
                            if (!isCountdown5Running && timeRemaining5 > 0) {
                              setIsCountdown5Running(true);
                            }
                          }}
                          disabled={isCountdown5Running || timeRemaining5 === 0}
                        >
                          <FaPlay /> {isCountdown5Running ? 'En progreso...' : 'Iniciar'}
                        </button>
                        {isCountdown5Running && (
                          <button
                            className={`${styles.countdownButton} ${styles.buttonStop}`}
                            onClick={handleStop5}
                          >
                            <FaPause /> Detener
                          </button>
                        )}
                        <button
                          className={`${styles.countdownButton} ${styles.buttonReset}`}
                          onClick={handleReset5}
                        >
                          <FaRedo /> Reiniciar
                        </button>
                      </>
                    )}
                  </div>
                  {firstCountdownCompleted && (
                    <div className={styles.completeResetContainer}>
                      <button
                        className={`${styles.countdownButton} ${styles.buttonCompleteReset}`}
                        onClick={handleCompleteReset}
                      >
                        <FaRedo /> Reiniciar Todo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremierTournamentPage;
