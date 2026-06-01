import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fixtureAPI, APIStanding, APIFixtureResponse } from '../services/fixtureAPI';
import { FaTrophy, FaMedal, FaStar } from 'react-icons/fa';
import styles from './StandingsPage.module.css';

// Sorting logic extracted so it can be used both inside and outside the component
const sortStandingsData = (data: APIStanding[]): APIStanding[] => {
  return [...data].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.total_points_scored !== b.total_points_scored) return b.total_points_scored - a.total_points_scored;
    if (a.wins !== b.wins) return b.wins - a.wins;
    return 0;
  });
};

/**
 * Applies extra-round (playoff) results to determine final positions.
 * - Reverses the extra-round point contributions to find pre-playoff standings.
 * - For each completed playoff match, the winner gets the higher pre-playoff position.
 * - Returns the reordered standings and a set of playoff winner names.
 */
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

  // Step 1: Clone standings and reverse extra-round point contributions
  const preExtraMap = new Map(standings.map(p => [p.name, { ...p }]));

  for (const match of extraMatches) {
    const p1 = preExtraMap.get(match.player1_name);
    const p2 = preExtraMap.get(match.player2_name);
    if (!p1 || !p2 || match.score1 === null || match.score2 === null) continue;

    if (match.score1 > match.score2) {
      p1.points -= 3;
      p1.wins -= 1;
    } else if (match.score2 > match.score1) {
      p2.points -= 3;
      p2.wins -= 1;
    } else {
      p1.points -= 1;
      p2.points -= 1;
      p1.ties -= 1;
      p2.ties -= 1;
    }
  }

  // Step 2: Sort pre-extra standings to get pre-playoff seed positions
  const sortedPreExtra = sortStandingsData(Array.from(preExtraMap.values()));
  const seedPosition = new Map<string, number>(); // name -> 1-based position before extra round
  sortedPreExtra.forEach((p, i) => seedPosition.set(p.name, i + 1));

  // Step 3: Determine playoff position overrides and winners
  const positionOverrides = new Map<string, number>(); // name -> final position
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
      // Ties: no override, keep normal order
    }
  }

  if (positionOverrides.size === 0) return { standings, playoffWinners };

  // Step 4: Build final sorted standings
  // Playoff participants are placed at their override positions;
  // remaining spots are filled by non-playoff players in normal order.
  const playoffPlayerNames = new Set(positionOverrides.keys());
  const nonPlayoffPlayers = sortStandingsData(
    standings.filter(p => !playoffPlayerNames.has(p.name))
  );

  const result: (APIStanding | null)[] = new Array(standings.length).fill(null);

  for (const [name, pos] of positionOverrides.entries()) {
    const player = standings.find(p => p.name === name);
    if (player) result[pos - 1] = player;
  }

  let nonPlayoffIdx = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) {
      result[i] = nonPlayoffPlayers[nonPlayoffIdx++] ?? null;
    }
  }

  return { standings: result.filter((p): p is APIStanding => p !== null), playoffWinners };
};

const StandingsPage = () => {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<APIStanding[]>([]);
  const [playoffWinners, setPlayoffWinners] = useState<Set<string>>(new Set());
  const [hasExtraRound, setHasExtraRound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const [data, fixture] = await Promise.all([
        fixtureAPI.getStandings(),
        fixtureAPI.getFixture(),
      ]);

      const extraRoundExists = fixture.rounds.some(r => r.is_extra_round);
      setHasExtraRound(extraRoundExists);

      let sorted: APIStanding[];
      let winners: Set<string>;

      if (extraRoundExists) {
        const result = applyPlayoffPositions(data, fixture);
        sorted = result.standings;
        winners = result.playoffWinners;
      } else {
        sorted = sortStandingsData(data);
        winners = new Set();
      }

      setStandings(sorted);
      setPlayoffWinners(winners);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Error al cargar la tabla de posiciones. Por favor, intenta de nuevo.');
      console.error('Error fetching standings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch standings immediately on mount
    fetchStandings();

    // Set up auto-refresh every 15 minutes (900000 ms)
    const intervalId = setInterval(() => {
      fetchStandings();
    }, 900000); // 15 minutes

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const getPositionIcon = (position: number) => {
    if (position === 1) return <FaTrophy className={styles.goldIcon} />;
    if (position === 2) return <FaMedal className={styles.silverIcon} />;
    if (position === 3) return <FaMedal className={styles.bronzeIcon} />;
    return null;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando tabla de posiciones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No hay datos de posiciones disponibles aún.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
              const isPlayoffWinner = playoffWinners.has(player.name);
              // Calculate MWR% (Matches Win Rate) using total_matches (games played) and total_points_scored (games won)
              const matchWinRate = player.total_matches > 0 
                ? ((player.total_points_scored / player.total_matches) * 100).toFixed(1)
                : '0.0';
              
              // Calculate RWR% (Rounds Win Rate) from wins, ties, losses
              const totalRounds = player.wins + player.ties + player.losses;
              const roundWinRate = totalRounds > 0
                ? (((player.wins + player.ties * 0.5) / totalRounds) * 100).toFixed(1)
                : '0.0';
              
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
  );
};

export default StandingsPage;
