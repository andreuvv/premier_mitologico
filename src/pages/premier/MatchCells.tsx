import type { APIFixtureResponse, APIMatchDetail } from '../../services/fixtureAPI';
import styles from '../PremierTournamentPage.module.css';
import type { MatchReport } from './useMatchReport';
import { playerInitial, pointsBeforeRound } from './premierUtils';

interface DuelistProps {
  playerId: number;
  name: string;
  roundNumber: number;
  side: 'left' | 'right';
  fixture: APIFixtureResponse | null;
  avatars: Map<number, string>;
}

/** Player name, avatar and the points they had before this round. */
export function Duelist({ playerId, name, roundNumber, side, fixture, avatars }: DuelistProps) {
  const avatar = avatars.get(playerId);
  const points = fixture ? pointsBeforeRound(fixture, playerId, roundNumber) : 0;
  const picture = avatar
    ? <img src={avatar} alt="" className={styles.duelistAvatar} />
    : <span className={styles.duelistFallback}>{playerInitial(name)}</span>;
  return (
    <div className={`${styles.duelist} ${side === 'left' ? styles.duelistLeft : styles.duelistRight}`}>
      {side === 'right' && picture}
      <span className={styles.duelistMeta}>
        <span className={styles.duelistName}>{name}</span>
        <span className={styles.enteringPoints}>{points} pts</span>
      </span>
      {side === 'left' && picture}
    </div>
  );
}

interface MatchReportControlProps {
  match: APIMatchDetail;
  isAdmin: boolean;
  report: MatchReport;
}

/** Admin-only "Reportar" button, or the inline score form for the match being edited. */
export function MatchReportControl({ match, isAdmin, report }: MatchReportControlProps) {
  if (!isAdmin || match.player2_id === null) return null;
  if (report.matchId !== match.id) {
    return (
      <button type="button" className={styles.reportButton} onClick={() => report.open(match)}>
        Reportar
      </button>
    );
  }
  return (
    <form className={styles.reportForm} onSubmit={report.save}>
      <input inputMode="numeric" aria-label={`Resultado de ${match.player1_name}`} value={report.score1} onChange={(event) => report.setScore1(event.target.value)} />
      <span>vs</span>
      <input inputMode="numeric" aria-label={`Resultado de ${match.player2_name}`} value={report.score2} onChange={(event) => report.setScore2(event.target.value)} />
      <button type="submit" className={styles.reportButton}>Guardar</button>
      <button type="button" className={styles.reportCancel} onClick={report.cancel}>Cancelar</button>
      {report.error && <span className={styles.reportError}>{report.error}</span>}
    </form>
  );
}
