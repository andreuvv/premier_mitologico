import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fixtureAPI, APIPlayer } from '../services/fixtureAPI';
import { API_BASE_URL } from '../config/api';
import { getProfileUsernameForPlayerId } from '../hooks/useUserProfile';
import { FaUser, FaChevronDown, FaChartPie, FaTrophy, FaHistory, FaIdCard } from 'react-icons/fa';
import styles from './PlayersPage.module.css';

interface PlayerDetail extends APIPlayer {
  tournaments?: PlayerTournamentData[];
}

interface PlayerTournamentData {
  tournamentId: number;
  tournamentName: string;
  month: string;
  year: number;
  format?: string | null;
  subformat?: string | null;
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
    race_libre?: string;
    race_edition_vcr?: string;
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
  const { playerName } = useParams<{ playerName?: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [playerTournamentData, setPlayerTournamentData] = useState<PlayerTournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());
  const [graphsExpanded, setGraphsExpanded] = useState(false);
  const [tablesCompact, setTablesCompact] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (playerName && players.length > 0) {
      const player = players.find(p => p.name === decodeURIComponent(playerName));
      if (player) {
        setSelectedPlayer(player);
        setSidebarOpen(false);
        loadPlayerTournamentData(player.id, player.name);
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
      return;
    }

    let cancelled = false;
    getProfileUsernameForPlayerId(selectedPlayer.id).then((username) => {
      if (!cancelled) setProfileUsername(username);
    });

    return () => { cancelled = true; };
  }, [selectedPlayer]);

  // Detect when tables need horizontal scrolling and make them compact
  useEffect(() => {
    const checkTableOverflow = () => {
      if (tableContainerRef.current) {
        const container = tableContainerRef.current;
        const tables = container.querySelectorAll('table');
        
        let needsScrolling = false;
        tables.forEach(table => {
          if (table.scrollWidth > container.clientWidth) {
            needsScrolling = true;
          }
        });
        
        setTablesCompact(needsScrolling);
      }
    };

    // Check immediately and on window resize
    checkTableOverflow();
    window.addEventListener('resize', checkTableOverflow);
    
    return () => window.removeEventListener('resize', checkTableOverflow);
  }, [playerTournamentData, graphsExpanded]);

  // Helper: extract all PB and BF races from a tournament considering format
  // - Mixed (format=null): race_pb → PB, race_bf → BF
  // - format='PB': race_libre → PB, race_edition_vcr → PB
  // - format='BF': race_libre → BF, race_edition_vcr → BF
  const getRacesForFormat = (tournament: PlayerTournamentData) => {
    const pbRaces: string[] = [];
    const bfRaces: string[] = [];

    if (!tournament.format) {
      // Mixed tournament
      if (tournament.races?.race_pb) pbRaces.push(tournament.races.race_pb);
      if (tournament.races?.race_bf) bfRaces.push(tournament.races.race_bf);
    } else if (tournament.format === 'PB') {
      // PB-only tournament: both subformat races count as PB
      if (tournament.races?.race_libre) pbRaces.push(tournament.races.race_libre);
      if (tournament.races?.race_edition_vcr) pbRaces.push(tournament.races.race_edition_vcr);
    } else if (tournament.format === 'BF') {
      // BF-only tournament: both subformat races count as BF
      if (tournament.races?.race_libre) bfRaces.push(tournament.races.race_libre);
      if (tournament.races?.race_edition_vcr) bfRaces.push(tournament.races.race_edition_vcr);
    }

    return { pbRaces, bfRaces };
  };

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

    // Find most played races (considering format-specific tournaments)
    const racePBCount: Record<string, number> = {};
    const raceBFCount: Record<string, number> = {};

    playerTournamentData.forEach(tournament => {
      const { pbRaces, bfRaces } = getRacesForFormat(tournament);
      pbRaces.forEach(race => {
        racePBCount[race] = (racePBCount[race] || 0) + 1;
      });
      bfRaces.forEach(race => {
        raceBFCount[race] = (raceBFCount[race] || 0) + 1;
      });
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
      const { pbRaces } = getRacesForFormat(tournament);
      pbRaces.forEach(race => {
        count[race] = (count[race] || 0) + 1;
      });
    });
    return count;
  }, [playerTournamentData]);

  const raceUsageBF = useMemo(() => {
    const count: { [race: string]: number } = {};
    playerTournamentData.forEach(tournament => {
      const { bfRaces } = getRacesForFormat(tournament);
      bfRaces.forEach(race => {
        count[race] = (count[race] || 0) + 1;
      });
    });
    return count;
  }, [playerTournamentData]);

  const raceWinratesPB = useMemo(() => {
    const winrates: { [race: string]: number } = {};
    const raceStats: { [race: string]: { wins: number; ties: number; total: number } } = {};

    playerTournamentData.forEach(tournament => {
      const { pbRaces } = getRacesForFormat(tournament);
      // For PB stats: use pbMatches for mixed tournaments, or all matches (pb+bf) for PB-only tournaments
      const wins = !tournament.format ? (tournament.pbWins || 0) : (tournament.pbWins || 0) + (tournament.bfWins || 0);
      const ties = !tournament.format ? (tournament.pbTies || 0) : (tournament.pbTies || 0) + (tournament.bfTies || 0);
      const total = !tournament.format ? (tournament.pbMatches || 0) : (tournament.pbMatches || 0) + (tournament.bfMatches || 0);

      if (total > 0) {
        pbRaces.forEach(race => {
          if (!raceStats[race]) {
            raceStats[race] = { wins: 0, ties: 0, total: 0 };
          }
          raceStats[race].wins += wins;
          raceStats[race].ties += ties;
          raceStats[race].total += total;
        });
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
      const { bfRaces } = getRacesForFormat(tournament);
      // For BF stats: use bfMatches for mixed tournaments, or all matches (pb+bf) for BF-only tournaments
      const wins = !tournament.format ? (tournament.bfWins || 0) : (tournament.pbWins || 0) + (tournament.bfWins || 0);
      const ties = !tournament.format ? (tournament.bfTies || 0) : (tournament.pbTies || 0) + (tournament.bfTies || 0);
      const total = !tournament.format ? (tournament.bfMatches || 0) : (tournament.pbMatches || 0) + (tournament.bfMatches || 0);

      if (total > 0) {
        bfRaces.forEach(race => {
          if (!raceStats[race]) {
            raceStats[race] = { wins: 0, ties: 0, total: 0 };
          }
          raceStats[race].wins += wins;
          raceStats[race].ties += ties;
          raceStats[race].total += total;
        });
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

  const toggleTournamentExpand = (tournamentId: number) => {
    const newExpanded = new Set(expandedTournaments);
    if (newExpanded.has(tournamentId)) {
      newExpanded.delete(tournamentId);
    } else {
      newExpanded.add(tournamentId);
    }
    setExpandedTournaments(newExpanded);
  };

  const prepareTableData = (raceData: { [race: string]: number }, winrateData: { [race: string]: number }, format: 'pb' | 'bf') => {
    const allRaces = format === 'pb' 
      ? ['Caballero', 'Faerie', 'Dragón', 'Olímpico', 'Titán', 'Héroe', 'Defensor', 'Desafiante', 'Sombra', 'Sacerdote', 'Faraón', 'Eterno', 'Tótem']
      : ['Caballero', 'Guerrero', 'Eterno', 'Sombra', 'Dragón', 'Bestia', 'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro', 'Tótem'];
    
    const total = Object.values(raceData).reduce((sum, count) => sum + count, 0);
    
    return allRaces.map(race => ({
      race: race,
      vecesUsada: raceData[race] || 0,
      porcentaje: total > 0 ? Math.round(((raceData[race] || 0) / total) * 100) : 0,
      winrate: winrateData[race] || 0
    })).filter(item => item.vecesUsada > 0); // Only show races that were actually used
  };

  const getFormatLabels = (tournament: PlayerTournamentData) => {
    const format = tournament.format;
    const sub = (tournament.subformat || '').toLowerCase();
    const isFormatSpecific = !!format; // PB or BF only

    const isLibre = ['libre', 'pbrl', 'bfrl'].some(v => sub === v) || sub.includes('libre');
    const isEdicion = ['pbre', 'bfvcr', 'vcr', 'edición', 'edicion'].some(v => sub === v)
                   || sub.includes('vcr') || sub.includes('edici');
    const isBoth = !sub || sub === 'both' || (isLibre && isEdicion);

    const showPB = !format || format === 'PB';
    const showBF = !format || format === 'BF';

    const formatName = format === 'PB' ? 'PB' : format === 'BF' ? 'FX' : '';
    const edicionLabel = format === 'BF' ? 'VCR' : 'Edición';
    // Build race rows: each has a label and a value
    const rows: { label: string; value: string }[] = [];

    if (isFormatSpecific) {
      // Single format tournament: race_libre and race_edition_vcr hold the subformat races
      if (isBoth) {
        rows.push({ label: `Raza ${formatName} Libre`, value: tournament.races?.race_libre || 'No registrada' });
        rows.push({ label: `Raza ${formatName} ${edicionLabel}`, value: tournament.races?.race_edition_vcr || 'No registrada' });
      } else if (isLibre) {
        rows.push({ label: `Raza ${formatName} Libre`, value: tournament.races?.race_libre || tournament.races?.race_pb || 'No registrada' });
      } else if (isEdicion) {
        rows.push({ label: `Raza ${formatName} ${edicionLabel}`, value: tournament.races?.race_edition_vcr || tournament.races?.race_pb || 'No registrada' });
      } else {
        rows.push({ label: `Raza ${formatName}`, value: tournament.races?.race_pb || tournament.races?.race_bf || 'No registrada' });
      }
    } else {
      // Both formats tournament: race_pb = PB race, race_bf = BF race
      if (isBoth) {
        if (showPB) {
          rows.push({ label: 'Raza PB Libre', value: tournament.races?.race_pb || 'No registrada' });
          rows.push({ label: 'Raza PB Edición', value: tournament.races?.race_libre || 'No registrada' });
        }
        if (showBF) {
          rows.push({ label: 'Raza FX Libre', value: tournament.races?.race_bf || 'No registrada' });
          rows.push({ label: 'Raza FX VCR', value: tournament.races?.race_edition_vcr || 'No registrada' });
        }
      } else if (isLibre) {
        if (showPB) rows.push({ label: 'Raza PB Libre', value: tournament.races?.race_pb || 'No registrada' });
        if (showBF) rows.push({ label: 'Raza FX Libre', value: tournament.races?.race_bf || 'No registrada' });
      } else if (isEdicion) {
        if (showPB) rows.push({ label: 'Raza PB Edición', value: tournament.races?.race_pb || 'No registrada' });
        if (showBF) rows.push({ label: 'Raza FX VCR', value: tournament.races?.race_bf || 'No registrada' });
      } else {
        if (showPB) rows.push({ label: 'Raza PB', value: tournament.races?.race_pb || 'No registrada' });
        if (showBF) rows.push({ label: 'Raza FX', value: tournament.races?.race_bf || 'No registrada' });
      }
    }

    return rows;
  };

  const getFormatBadges = (tournament: PlayerTournamentData): { label: string; type: 'pb' | 'fx' }[] => {
    const format = tournament.format;
    const sub = (tournament.subformat || '').toLowerCase();

    const isLibre = ['libre', 'pbrl', 'bfrl'].some(v => sub === v) || sub.includes('libre');
    const isEdicion = ['pbre', 'bfvcr', 'vcr', 'edición', 'edicion'].some(v => sub === v)
                   || sub.includes('vcr') || sub.includes('edici');
    const isBoth = !sub || sub === 'both' || (isLibre && isEdicion);

    const showPB = !format || format === 'PB';
    const showBF = !format || format === 'BF';

    const badges: { label: string; type: 'pb' | 'fx' }[] = [];

    if (showPB) {
      if (isBoth || isLibre) badges.push({ label: 'PB Racial Libre', type: 'pb' });
      if (isBoth || isEdicion) badges.push({ label: 'PB Racial Edición', type: 'pb' });
      if (!isBoth && !isLibre && !isEdicion) badges.push({ label: 'PB', type: 'pb' });
    }
    if (showBF) {
      if (isBoth || isLibre) badges.push({ label: 'FX Racial Libre', type: 'fx' });
      if (isBoth || isEdicion) badges.push({ label: 'FX Racial VCR', type: 'fx' });
      if (!isBoth && !isLibre && !isEdicion) badges.push({ label: 'FX', type: 'fx' });
    }

    return badges;
  };

  const handlePlayerClick = async (player: APIPlayer) => {
    // Navigate to player-specific URL using name
    navigate(`/players/${encodeURIComponent(player.name)}`);
    setSidebarOpen(false);
    // The useEffect will handle loading the player data
  };

  const loadPlayerTournamentData = async (playerId: number, playerName: string) => {
    try {
      setDataLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/players/${playerId}/tournaments?name=${encodeURIComponent(playerName)}`
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
        format: item.format,
        subformat: item.subformat,
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
          race_libre: item.race_libre,
          race_edition_vcr: item.race_edition_vcr,
        },
        // Include actual match data by format
        pbWins: item.pb_wins,
        pbTies: item.pb_ties,
        pbMatches: item.pb_matches,
        bfWins: item.bf_wins,
        bfTies: item.bf_ties,
        bfMatches: item.bf_matches,
      }));

      // Sort by date descending (newest first)
      const monthOrder: Record<string, number> = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
        'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
        'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12,
      };
      tournamentData.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (monthOrder[b.month] || 0) - (monthOrder[a.month] || 0);
      });

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
          ☰
        </button>
        <h1 className={styles.mobileTitle}>Jugadores</h1>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
                <div className={styles.playerProfilePicture}>
                  {selectedPlayer.name === 'Troke' ? (
                    <img 
                      src={`${import.meta.env.BASE_URL}assets/images/simon-andre.jpeg`}
                      alt={`${selectedPlayer.name} profile`}
                      className={styles.trokeImage}
                    />
                  ) : (
                    <span>{selectedPlayer.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h1 className={styles.playerName}>{selectedPlayer.name}</h1>
                {profileUsername && (
                  <Link
                    to={`/perfil/${encodeURIComponent(profileUsername)}`}
                    className={styles.profileLinkBtn}
                  >
                    <FaIdCard />
                    Ver perfil
                  </Link>
                )}
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
                    <span className={styles.summaryLabel}>Raza más jugada FX:</span>
                    <span className={styles.summaryValue}>
                      {playerSummary.mostPlayedRaceBF ? `${playerSummary.mostPlayedRaceBF} (${playerSummary.mostPlayedRaceBFPercentage}%)` : '-'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>WinRate Global en FX:</span>
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
                      <div className={`${styles.tableContainer} ${tablesCompact ? styles.tableContainerCompact : ''}`} ref={tableContainerRef}>
                        <table className={styles.raceTable}>
                          <thead>
                            <tr>
                              <th>Raza</th>
                              <th>Veces Usada</th>
                              <th>Winrate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prepareTableData(raceUsagePB, raceWinratesPB, 'pb').map((row, index) => (
                              <tr key={index}>
                                <td>{row.race}</td>
                                <td>{row.vecesUsada} ({row.porcentaje}%)</td>
                                <td>{row.winrate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className={styles.chartSection}>
                      <h4>Uso de Razas en Furia Extendido</h4>
                      <div className={`${styles.tableContainer} ${tablesCompact ? styles.tableContainerCompact : ''}`}>
                        <table className={styles.raceTable}>
                          <thead>
                            <tr>
                              <th>Raza</th>
                              <th>Veces Usada</th>
                              <th>Winrate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prepareTableData(raceUsageBF, raceWinratesBF, 'bf').map((row, index) => (
                              <tr key={index}>
                                <td>{row.race}</td>
                                <td>{row.vecesUsada} ({row.porcentaje}%)</td>
                                <td>{row.winrate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
              <>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--beige)' }}>
                  <FaHistory style={{ color: 'var(--sage-green)' }} />
                  Historial de Torneos
                </h2>
                <div className={styles.tournamentsList}>
                {playerTournamentData.map(tournament => {
                  const pos = tournament.standing?.final_position;
                  const podiumClass = pos === 1 ? styles.cardGold : pos === 2 ? styles.cardSilver : pos === 3 ? styles.cardBronze : '';
                  return (
                  <div key={tournament.tournamentId} className={`${styles.tournamentCard} ${podiumClass}`}>
                    <button
                      className={styles.accordionHeader}
                      onClick={() => toggleTournamentExpand(tournament.tournamentId)}
                    >
                      <div className={styles.headerContent}>
                        <h3>{tournament.tournamentName}</h3>
                        <div className={styles.headerMeta}>
                          <span className={styles.tournamentDate}>
                            {tournament.month} {tournament.year}
                          </span>
                          <div className={styles.formatBadges}>
                            {getFormatBadges(tournament).map((badge, i) => (
                              <span key={i} className={`${styles.formatBadge} ${badge.type === 'pb' ? styles.formatBadgePB : styles.formatBadgeFX}`}>{badge.label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={styles.headerRight}>
                        {pos && (
                          <span className={`${styles.positionBadge} ${pos === 1 ? styles.posGold : pos === 2 ? styles.posSilver : pos === 3 ? styles.posBronze : ''}`}>
                            {pos}°
                          </span>
                        )}
                        <FaChevronDown 
                          className={`${styles.chevron} ${expandedTournaments.has(tournament.tournamentId) ? styles.expanded : ''}`}
                        />
                      </div>
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
                        
                        {tournament.races && (() => {
                          const rows = getFormatLabels(tournament);
                          return (
                            <div className={styles.racesInfo}>
                              {rows.map((row, i) => (
                                <div key={i} className={styles.infoRow}>
                                  <span className={styles.label}>{row.label}:</span>
                                  <span className={styles.value}>{row.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  );
                })}
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
  );
};

export default PlayersPage;
