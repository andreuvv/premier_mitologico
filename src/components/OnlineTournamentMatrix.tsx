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

  // Get match result and class between two players
  const getMatchResultAndClass = (player1Id: number, player2Id: number): { text: string; className: string } => {
    if (player1Id === player2Id) return { text: '-', className: styles.diagonalCell };

    const key = `${Math.min(player1Id, player2Id)}-${Math.max(player1Id, player2Id)}`;
    const match = matchMap.get(key);

    if (!match) return { text: '-', className: '' };

    let text: string;
    let className: string = '';

    if (match.player1_id === player1Id) {
      text = `${match.score1}-${match.score2}`;
      if (match.score1 !== undefined && match.score2 !== undefined) {
        if (match.score1 > match.score2) className = styles.win;
        else if (match.score1 < match.score2) className = styles.lose;
        else className = styles.tie;
      }
    } else {
      text = `${match.score2}-${match.score1}`;
      if (match.score1 !== undefined && match.score2 !== undefined) {
        if (match.score2 > match.score1) className = styles.win;
        else if (match.score2 < match.score1) className = styles.lose;
        else className = styles.tie;
      }
    }

    return { text, className };
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
              <th className={styles.headerCell}>MITERO</th>
              {standings.map((standing) => (
                <th key={standing.player_id} className={styles.headerCell}>
                  <span className={styles.playerNameRotated}>
                    {standing.player_name.split(' ')[0]}
                  </span>
                </th>
              ))}
              <th className={styles.headerCell}>PTJ</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((rowPlayer) => (
              <tr key={rowPlayer.player_id}>
                <td className={styles.rowHeaderCell}>{rowPlayer.player_name}</td>
                {standings.map((colPlayer) => {
                  const result = getMatchResultAndClass(rowPlayer.player_id, colPlayer.player_id);
                  return (
                    <td
                      key={`${rowPlayer.player_id}-${colPlayer.player_id}`}
                      className={`${styles.dataCell} ${result.className}`}
                    >
                      {result.text}
                    </td>
                  );
                })}
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
