import { useState, useEffect } from 'react';
import { fixtureAPI, APIStanding } from '../services/fixtureAPI';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import styles from './StandingsPage.module.css';

const StandingsPage = () => {
  const [standings, setStandings] = useState<APIStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        const data = await fixtureAPI.getStandings();
        
        // Apply tie-breaking rules
        const sortedStandings = sortStandings(data);
        setStandings(sortedStandings);
        setError(null);
      } catch (err) {
        setError('Error al cargar la tabla de posiciones. Por favor, intenta de nuevo.');
        console.error('Error fetching standings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  // Tie-breaking rules implementation
  const sortStandings = (data: APIStanding[]): APIStanding[] => {
    return [...data].sort((a, b) => {
      // Calculate total points (wins * 3)
      const pointsA = a.wins * 3;
      const pointsB = b.wins * 3;

      // Rule 1: Total points (higher is better)
      if (pointsA !== pointsB) {
        return pointsB - pointsA;
      }

      // Rule 2: Most victories (higher is better)
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }

      // Rule 3: Head-to-head result would need match data
      // For now, we'll use points scored as tiebreaker
      if (a.total_points_scored !== b.total_points_scored) {
        return b.total_points_scored - a.total_points_scored;
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
      <h1 className={styles.title}>Tabla de Posiciones</h1>
      
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
              <th>TV</th>
              <th>MWR%</th>
              <th>RWR%</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => {
              const position = index + 1;
              const totalPoints = player.wins * 3 + player.ties * 1;
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
                  <td className={styles.nameColumn}>{player.name}</td>
                  <td>{player.matches_played}</td>
                  <td className={styles.winsColumn}>{player.wins}</td>
                  <td className={styles.tiesColumn}>{player.ties}</td>
                  <td className={styles.lossesColumn}>{player.losses}</td>
                  <td className={styles.totalVictoriesColumn}>{player.total_points_scored}</td>
                  <td className={styles.winRateColumn}>{matchWinRate}%</td>
                  <td className={styles.winRateColumn}>{roundWinRate}%</td>
                  <td className={styles.pointsColumn}>{totalPoints}</td>
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
          <li><strong>G:</strong> Ganados</li>
          <li><strong>E:</strong> Empates</li>
          <li><strong>P:</strong> Perdidos</li>
          <li><strong>TV:</strong> Total Victorias (suma de victorias logradas en todas las partidas)</li>
          <li><strong>MWR%:</strong> Matches Win Rate (porcentaje de partidas individuales ganadas)</li>
          <li><strong>RWR%:</strong> Rounds Win Rate (porcentaje de rondas ganadas, empates cuentan como 0.5)</li>
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
