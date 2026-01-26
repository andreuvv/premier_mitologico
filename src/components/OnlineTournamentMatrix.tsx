import { OnlineStanding, OnlineMatch } from '../services/onlineTournamentService';
import styles from './OnlineTournamentMatrix.module.css';

interface OnlineTournamentMatrixProps {
  standings: OnlineStanding[];
  matches: OnlineMatch[];
}

const OnlineTournamentMatrix = ({ standings, matches }: OnlineTournamentMatrixProps) => {
  // Create a map of match results for quick lookup
  const matchMap = new Map<string, OnlineMatch>();
  matches.forEach((match) => {
    if (match.completed) {
      const key1 = `${Math.min(match.player1_id, match.player2_id)}-${Math.max(match.player1_id, match.player2_id)}`;
      matchMap.set(key1, match);
    }
  });

  // Get match result between two players
  const getMatchResult = (player1Id: number, player2Id: number, player1Name: string, player2Name: string): string => {
    if (player1Id === player2Id) return '-';

    const key = `${Math.min(player1Id, player2Id)}-${Math.max(player1Id, player2Id)}`;
    const match = matchMap.get(key);

    if (!match) return '-';

    if (match.player1_id === player1Id) {
      return `${player1Name.split(' ')[0]} ${match.score1}-${match.score2}`;
    } else {
      return `${player1Name.split(' ')[0]} ${match.score2}-${match.score1}`;
    }
  };

  if (standings.length === 0) {
    return <div className={styles.noData}>No standings data available</div>;
  }

  return (
    <div className={styles.matrixContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Player</th>
              {standings.map((standing) => (
                <th key={standing.player_id} className={styles.headerCell}>
                  <span className={styles.playerNameRotated}>
                    {standing.player_name.split(' ')[0]}
                  </span>
                </th>
              ))}
              <th className={styles.headerCell}>Points</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((rowPlayer) => (
              <tr key={rowPlayer.player_id}>
                <td className={styles.rowHeaderCell}>{rowPlayer.player_name}</td>
                {standings.map((colPlayer) => (
                  <td
                    key={`${rowPlayer.player_id}-${colPlayer.player_id}`}
                    className={`${styles.dataCell} ${
                      rowPlayer.player_id === colPlayer.player_id ? styles.diagonalCell : ''
                    }`}
                  >
                    {getMatchResult(
                      rowPlayer.player_id,
                      colPlayer.player_id,
                      rowPlayer.player_name,
                      colPlayer.player_name
                    )}
                  </td>
                ))}
                <td className={styles.pointsCell}>{rowPlayer.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnlineTournamentMatrix;
