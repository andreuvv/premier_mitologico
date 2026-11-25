import type { Tournament, TournamentRound } from '../../services/tournamentAPI';
import { displayStoredSubformat } from '../../utils/bfSubformatLabel';
import styles from '../TournamentHistoryPage.module.css';
import FormatDescription from './FormatDescription';

interface TournamentRoundsViewProps {
  tournament: Tournament | null;
  rounds: TournamentRound[];
}

/** Every round of an archived tournament, each one collapsible. */
export default function TournamentRoundsView({ tournament, rounds }: TournamentRoundsViewProps) {
  return (
    <div className={styles.roundsView}>
      <FormatDescription tournament={tournament} />
      <div className={styles.roundsContainer}>
        {rounds.map((round) => (
          <details key={round.number} className={styles.roundAccordion}>
            <summary className={styles.roundSummary}>
              <span className={styles.roundTitle}>
                {round.is_extra_round ? 'Ronda de finales' : `Ronda ${round.number} - ${round.format === 'PB' ? 'Primer Bloque' : 'Furia Extendido'}`}
                {round.subformat ? ` (${displayStoredSubformat(round.subformat, tournament)})` : ''}
              </span>
              {round.is_extra_round && (
                <span className={styles.finalRoundBadge}>Finales</span>
              )}
            </summary>
            <div className={styles.matchesList}>
              {round.matches.map((match) => (
                <div key={match.id} className={styles.matchCard}>
                  <div className={styles.matchPlayers}>
                    <span className={styles.playerName}>{match.player1_name}</span>
                    <span className={styles.vs}>VS</span>
                    <span className={styles.playerName}>{match.player2_name}</span>
                  </div>
                  {match.completed && match.score1 !== null && match.score2 !== null && (
                    <div className={styles.matchScore}>
                      <span className={`${styles.score} ${match.score1 > match.score2 ? styles.winner : ''}`}>
                        {match.score1}
                      </span>
                      <span className={styles.scoreSeparator}>-</span>
                      <span className={`${styles.score} ${match.score2 > match.score1 ? styles.winner : ''}`}>
                        {match.score2}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
