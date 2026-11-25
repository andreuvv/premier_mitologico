import type { APIFixtureResponse, APIStanding } from '../../services/fixtureAPI';
import styles from '../PremierTournamentPage.module.css';
import { matrixResult, type MatrixOutcome } from './premierUtils';

interface ResultsMatrixTabProps {
  fixtureData: APIFixtureResponse | null;
  standings: APIStanding[];
  loading: boolean;
  error: string | null;
}

const outcomeClass: Record<Exclude<MatrixOutcome, null>, string> = {
  win: styles.matrixWin,
  lose: styles.matrixLose,
  tie: styles.matrixTie,
};

export default function ResultsMatrixTab({ fixtureData, standings, loading, error }: ResultsMatrixTabProps) {
  if (loading) return <div className={styles.loading}>Cargando matriz...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!fixtureData || fixtureData.rounds.length === 0 || standings.length === 0) {
    return <div className={styles.empty}>No hay datos disponibles para la matriz.</div>;
  }

  return (
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
            {standings.map((rowPlayer) => (
              <tr key={rowPlayer.id}>
                <td className={styles.matrixRowHeaderCell}>{rowPlayer.name}</td>
                {standings.map((colPlayer) => {
                  const isDiagonal = rowPlayer.id === colPlayer.id;
                  const result = isDiagonal ? { text: '-', outcome: null } : matrixResult(fixtureData, rowPlayer.id, colPlayer.id);
                  const resultClass = isDiagonal
                    ? styles.matrixDiagonalCell
                    : result.outcome ? outcomeClass[result.outcome] : '';
                  return (
                    <td
                      key={`${rowPlayer.id}-${colPlayer.id}`}
                      className={`${styles.matrixDataCell} ${resultClass}`}
                    >
                      <span className={styles.matrixScoreText}>{result.text}</span>
                    </td>
                  );
                })}
                <td className={styles.matrixPointsCell}>{rowPlayer.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
