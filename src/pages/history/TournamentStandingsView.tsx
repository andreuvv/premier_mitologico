import { useNavigate } from 'react-router-dom';
import { FaMedal, FaStar, FaTrophy } from 'react-icons/fa';
import type { Tournament, TournamentRound, TournamentStanding } from '../../services/tournamentAPI';
import styles from '../TournamentHistoryPage.module.css';
import FormatDescription from './FormatDescription';
import {
  calculateRoundWinRate,
  calculateWinRate,
  formatFlags,
  raceColumnLabels,
  recordByRoundType,
  recordColumnLabels,
  secondSubformatName,
} from './historyUtils';

interface TournamentStandingsViewProps {
  tournament: Tournament | null;
  standings: TournamentStanding[];
  rounds: TournamentRound[];
  hasExtraRound: boolean;
  playoffWinners: Set<string>;
}

const getPositionIcon = (position: number) => {
  if (position === 1) return <FaTrophy className={styles.goldIcon} />;
  if (position === 2) return <FaMedal className={styles.silverIcon} />;
  if (position === 3) return <FaMedal className={styles.bronzeIcon} />;
  return null;
};

/** Final table of an archived tournament. */
export default function TournamentStandingsView({
  tournament,
  standings,
  rounds,
  hasExtraRound,
  playoffWinners,
}: TournamentStandingsViewProps) {
  const navigate = useNavigate();
  const { isFormatSpecific } = formatFlags(tournament);
  const raceLabels = raceColumnLabels(tournament);
  const recordLabels = recordColumnLabels(tournament);
  const formatName = tournament?.format === 'PB' ? 'Primer Bloque' : 'Furia Extendido';

  return (
    <div className={styles.standingsView}>
      <FormatDescription tournament={tournament} />
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
      <div className={styles.tableContainer}>
        <table className={styles.standingsTable}>
          <thead>
            <tr>
              <th className={styles.posColumn}>Pos.</th>
              <th className={styles.nameColumn}>Jugador</th>
              <th>{raceLabels.libre}</th>
              <th>{raceLabels.edition}</th>
              <th title="Rondas Jugadas">RJ</th>
              <th title="Rondas Ganadas">G</th>
              <th title="Rondas Empatadas">E</th>
              <th title="Rondas Perdidas">P</th>
              <th title="Total Partidas Ganadas (partidas individuales ganadas)">TPG</th>
              <th title={recordLabels.libreTitle}>{recordLabels.libre}</th>
              <th title={recordLabels.edicionTitle}>{recordLabels.edicion}</th>
              <th title="Matches Win Rate: (Partidas ganadas / Partidas jugadas) * 100">MWR%</th>
              <th title="Rounds Win Rate: ((Rondas ganadas + Rondas empatadas * 0.5) / Rondas Jugadas) * 100">RWR%</th>
              <th title="Puntos (3 por victoria, 1 por empate)">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => {
              const position = standing.final_position;
              const isPlayoffWinner = playoffWinners.has(standing.player_name);
              const raceDisplay = isFormatSpecific
                ? {
                    libre: standing.race_libre,
                    edition: standing.race_edition_vcr
                  }
                : {
                    libre: standing.race_pb,
                    edition: standing.race_bf
                  };
              const recordByType = recordByRoundType(rounds, standing.player_name);
              return (
                <tr
                  key={standing.id}
                  className={`${position <= 3 ? styles.topThree : ''} ${isPlayoffWinner ? styles.playoffWinner : ''}`}
                >
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
                      onClick={() => navigate(`/players/${encodeURIComponent(standing.player_name)}`)}
                    >
                      {standing.player_name}
                    </button>
                  </td>
                  <td>{raceDisplay.libre || '-'}</td>
                  <td>{raceDisplay.edition || '-'}</td>
                  <td>{standing.matches_played}</td>
                  <td className={styles.winsColumn}>{standing.wins}</td>
                  <td className={styles.tiesColumn}>{standing.ties}</td>
                  <td className={styles.lossesColumn}>{standing.losses}</td>
                  <td className={styles.totalVictoriesColumn}>{standing.total_points_scored}</td>
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
          <li><strong>{raceLabels.libre}:</strong> {isFormatSpecific ? `Raza elegida en ${formatName} - Libre` : 'Raza elegida en Primer Bloque'}</li>
          <li><strong>{raceLabels.edition}:</strong> {isFormatSpecific ? `Raza elegida en ${formatName} - ${secondSubformatName(tournament)}` : 'Raza elegida en Furia Extendido'}</li>
          <li><strong>RJ:</strong> Rondas Jugadas</li>
          <li><strong>G:</strong> Rondas Ganadas</li>
          <li><strong>E:</strong> Rondas Empatadas</li>
          <li><strong>P:</strong> Rondas Perdidas</li>
          <li><strong>TPG:</strong> Total Partidas Ganadas (partidas individuales ganadas)</li>
          <li><strong>{recordLabels.libre}:</strong> {recordLabels.libreTitle}</li>
          <li><strong>{recordLabels.edicion}:</strong> {recordLabels.edicionTitle}</li>
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
          <li>🏆 <strong>Mayor TPG</strong> (más partidas individuales ganadas)</li>
          <li>💪 <strong>Mayor cantidad de victorias</strong></li>
          <li>🎯 <strong>Victoria directa</strong> (ganó al otro jugador empatado durante las rondas)</li>
          <li>⚔️ <strong>Duelo de desempate</strong> (si ningún criterio anterior resuelve)</li>
        </ol>
      </div>
    </div>
  );
}
