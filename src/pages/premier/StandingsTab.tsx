import { useNavigate } from 'react-router-dom';
import { FaMedal, FaStar, FaTrophy } from 'react-icons/fa';
import type { APIFixtureResponse, APIStanding } from '../../services/fixtureAPI';
import styles from '../PremierTournamentPage.module.css';
import { companionRecordName, recordByRoundType } from './premierUtils';

interface StandingsTabProps {
  standings: APIStanding[];
  playoffWinners: Set<number>;
  hasExtraRound: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fixtureData: APIFixtureResponse | null;
  tournamentFormat: 'PB' | 'FX' | 'PBFX' | undefined;
}

const getPositionIcon = (position: number) => {
  if (position === 1) return <FaTrophy className={styles.goldIcon} />;
  if (position === 2) return <FaMedal className={styles.silverIcon} />;
  if (position === 3) return <FaMedal className={styles.bronzeIcon} />;
  return null;
};

export default function StandingsTab({
  standings,
  playoffWinners,
  hasExtraRound,
  loading,
  error,
  lastUpdated,
  fixtureData,
  tournamentFormat,
}: StandingsTabProps) {
  const navigate = useNavigate();
  const companion = companionRecordName(tournamentFormat);

  if (loading) return <div className={styles.loading}>Cargando tabla de posiciones...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (standings.length === 0) return <div className={styles.empty}>No hay datos de posiciones disponibles aún.</div>;

  return (
    <div className={styles.standingsWrapper}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className={styles.title}>Tabla de Posiciones</h1>
        {lastUpdated && (
          <div style={{ fontSize: '0.9rem', color: '#888', textAlign: 'right' }}>
            <div>Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Se actualiza en vivo</div>
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
              <th title={`Record en rondas Racial ${companion} (Victorias-Empates-Derrotas)`}>
                Record {companion}
              </th>
              <th title="Matches Win Rate: (Partidas ganadas / Partidas jugadas) * 100">MWR%</th>
              <th title="Rounds Win Rate: ((Rondas ganadas + Rondas empatadas * 0.5) / Rondas Jugadas) * 100">RWR%</th>
              <th title="Puntos (3 por victoria, 1 por empate)">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => {
              const position = index + 1;
              const isPlayoffWinner = playoffWinners.has(player.id);
              const matchWinRate = player.total_matches > 0
                ? ((player.total_points_scored / player.total_matches) * 100).toFixed(1)
                : '0.0';

              const totalRounds = player.wins + player.ties + player.losses;
              const roundWinRate = totalRounds > 0
                ? (((player.wins + player.ties * 0.5) / totalRounds) * 100).toFixed(1)
                : '0.0';

              const recordByType = recordByRoundType(fixtureData, player.name);

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
          <li><strong>Record {companion}:</strong> Record en rondas Racial {companion} (Victorias-Empates-Derrotas)</li>
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
          <li>🏆 <strong>Mayor TPG</strong> (más partidas individuales ganadas)</li>
          <li>💪 <strong>Mayor cantidad de victorias</strong></li>
          <li>🎯 <strong>Victoria directa</strong> (ganó al otro jugador empatado durante las rondas)</li>
          <li>⚔️ <strong>Duelo de desempate</strong> (si ningún criterio anterior resuelve)</li>
        </ol>
      </div>
    </div>
  );
}
