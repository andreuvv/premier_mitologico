import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fixtureAPI, APIStanding } from '../services/fixtureAPI';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import styles from './StandingsPage.module.css';

const StandingsPage = () => {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<APIStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const data = await fixtureAPI.getStandings();
      
      // Apply tie-breaking rules
      const sortedStandings = sortStandings(data);
      setStandings(sortedStandings);
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

  // Tie-breaking rules implementation
  const sortStandings = (data: APIStanding[]): APIStanding[] => {
    return [...data].sort((a, b) => {
      // Rule 1: Total points (3 for win, 1 for tie) - use the points from API
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      // Rule 2: TPG - Total Partidas Ganadas (total individual games won)
      if (a.total_points_scored !== b.total_points_scored) {
        return b.total_points_scored - a.total_points_scored;
      }

      // Rule 3: Most round wins
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }

      // Rule 4: Would require head-to-head or playoff
      return 0;
    });
  };

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
  );
};

export default StandingsPage;
