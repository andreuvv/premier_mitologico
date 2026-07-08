import { useNavigate } from 'react-router-dom';
import type { GlobalStanding } from '../services/tournamentAPI';
import styles from './GlobalStandingsTable.module.css';

interface GlobalStandingsTableProps {
  standings: GlobalStanding[];
  title?: string;
}

const GlobalStandingsTable = ({ standings, title = 'Ranking Global' }: GlobalStandingsTableProps) => {
  const navigate = useNavigate();

  return (
    <div className={styles.globalStandingsView}>
      {title && <h1 className={styles.pageTitle}>{title}</h1>}
      {standings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no hay datos de ranking global disponibles.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.globalStandingsTable}>
            <thead>
              <tr>
                <th className={styles.positionColumn}>#</th>
                <th className={styles.nameColumn}>Jugador</th>
                <th>🥇 1eros Lugares conseguidos</th>
                <th>🥈 2dos Lugares conseguidos</th>
                <th>🥉 3eros Lugares conseguidos</th>
                <th>Torneos Participados</th>
                <th>Raza más usada PB (Winrate%)</th>
                <th>Raza más usada FX (Winrate%)</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => {
                let medalClass = '';
                let positionBadge = '';
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
                    <td className={styles.centerColumn}>{standing.tournaments_participated}</td>
                    <td>{standing.most_played_race_pb ? `${standing.most_played_race_pb} (${standing.winrate_pb.toFixed(1)}%)` : '-'}</td>
                    <td>{standing.most_played_race_bf ? `${standing.most_played_race_bf} (${standing.winrate_bf.toFixed(1)}%)` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GlobalStandingsTable;
