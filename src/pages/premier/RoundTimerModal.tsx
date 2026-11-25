import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaFire, FaListOl, FaPause, FaPlay, FaRedo } from 'react-icons/fa';
import type { APIFixtureResponse } from '../../services/fixtureAPI';
import styles from '../PremierTournamentPage.module.css';
import { Duelist, MatchReportControl } from './MatchCells';
import type { MatchReport } from './useMatchReport';
import type { RoundTimer } from './useRoundTimer';
import { formatTime, getSubformatDisplayName } from './premierUtils';

interface RoundTimerModalProps {
  fixtureData: APIFixtureResponse;
  timer: RoundTimer;
  avatars: Map<number, string>;
  isAdmin: boolean;
  report: MatchReport;
  onClose: () => void;
}

/** Round clock next to a carousel with the pairings of each round. */
export default function RoundTimerModal({ fixtureData, timer, avatars, isAdmin, report, onClose }: RoundTimerModalProps) {
  const [carouselRoundIndex, setCarouselRoundIndex] = useState(0);
  const roundCount = fixtureData.rounds.length;
  const round = fixtureData.rounds[carouselRoundIndex];

  const handlePrevRound = () => {
    setCarouselRoundIndex(prev => (prev > 0 ? prev - 1 : roundCount - 1));
  };

  const handleNextRound = () => {
    setCarouselRoundIndex(prev => (prev < roundCount - 1 ? prev + 1 : 0));
  };

  const {
    timeRemaining45,
    timeRemaining5,
    isCountdown45Running,
    isCountdown5Running,
    firstCountdownCompleted,
  } = timer;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Cronómetro de Rondas</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalContent}>
          {/* Carousel - Left Column */}
          <div className={styles.carouselSection}>
            <div className={styles.carouselContainer}>
              <div className={styles.carouselDisplay}>
                {round && (
                  <div className={styles.roundCard}>
                    <h3>
                      {round.format === 'PB' ? (
                        <FaListOl className={styles.roundIcon} />
                      ) : (
                        <FaFire className={styles.roundIcon} />
                      )}
                      Ronda {round.number}
                    </h3>
                    <div className={styles.formatRow}>
                      <p className={styles.roundFormat}>
                        {round.format === 'PB' ? 'Primer Bloque' : 'Furia Extendido'}
                      </p>
                      {round.subformat && (
                        <p className={styles.roundSubformat}>
                          {getSubformatDisplayName(round.subformat)}
                        </p>
                      )}
                    </div>
                    <div className={styles.matchesList}>
                      {round.matches.map((match) => (
                        <div key={match.id} className={styles.matchBlock}>
                          <div className={styles.matchItem}>
                            <Duelist playerId={match.player1_id} name={match.player1_name} roundNumber={round.number} side="left" fixture={fixtureData} avatars={avatars} />
                            <span className={styles.matchScore}>{match.score1 ?? '-'}</span>
                            <span className={styles.vs}>vs</span>
                            <span className={styles.matchScore}>{match.score2 ?? '-'}</span>
                            {match.player2_id === null
                              ? <span className={styles.duelistName}>{match.player2_name}</span>
                              : <Duelist playerId={match.player2_id} name={match.player2_name} roundNumber={round.number} side="right" fixture={fixtureData} avatars={avatars} />}
                          </div>
                          <MatchReportControl match={match} isAdmin={isAdmin} report={report} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.carouselArrowsContainer}>
              <button
                className={styles.carouselArrow}
                onClick={handlePrevRound}
                title="Ronda anterior"
              >
                <FaChevronLeft />
              </button>
              <button
                className={styles.carouselArrow}
                onClick={handleNextRound}
                title="Siguiente ronda"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Countdowns */}
          <div className={styles.countdownsSection}>
            <div className={styles.countdownBox}>
              {/* Main time moves to the corner once extra time is running */}
              {firstCountdownCompleted && (
                <div className={styles.timerCorner}>
                  <div className={styles.timerCornerLabel}>Tiempo Principal COMPLETADO</div>
                  <div className={styles.timerCornerDisplay}>{formatTime(timeRemaining45)}</div>
                </div>
              )}

              <div className={styles.countdownTitle}>
                {firstCountdownCompleted ? 'Tiempo Suplementario' : 'Tiempo Principal'}
              </div>

              <div className={styles.countdownDisplay}>
                {firstCountdownCompleted ? formatTime(timeRemaining5) : formatTime(timeRemaining45)}
              </div>

              <div className={styles.buttonGroup}>
                {!firstCountdownCompleted ? (
                  <>
                    <button
                      className={`${styles.countdownButton} ${styles.buttonStart} ${isCountdown45Running ? styles.running : ''}`}
                      onClick={timer.start45}
                      disabled={isCountdown45Running || timeRemaining45 === 0}
                    >
                      <FaPlay /> {isCountdown45Running ? 'En progreso...' : 'Iniciar'}
                    </button>
                    {isCountdown45Running && (
                      <button
                        className={`${styles.countdownButton} ${styles.buttonStop}`}
                        onClick={timer.stop45}
                      >
                        <FaPause /> Detener
                      </button>
                    )}
                    <button
                      className={`${styles.countdownButton} ${styles.buttonReset}`}
                      onClick={timer.reset45}
                    >
                      <FaRedo /> Reiniciar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`${styles.countdownButton} ${styles.buttonStart} ${isCountdown5Running ? styles.running : ''}`}
                      onClick={timer.start5}
                      disabled={isCountdown5Running || timeRemaining5 === 0}
                    >
                      <FaPlay /> {isCountdown5Running ? 'En progreso...' : 'Iniciar'}
                    </button>
                    {isCountdown5Running && (
                      <button
                        className={`${styles.countdownButton} ${styles.buttonStop}`}
                        onClick={timer.stop5}
                      >
                        <FaPause /> Detener
                      </button>
                    )}
                    <button
                      className={`${styles.countdownButton} ${styles.buttonReset}`}
                      onClick={timer.reset5}
                    >
                      <FaRedo /> Reiniciar
                    </button>
                  </>
                )}
              </div>
              {firstCountdownCompleted && (
                <div className={styles.completeResetContainer}>
                  <button
                    className={`${styles.countdownButton} ${styles.buttonCompleteReset}`}
                    onClick={timer.resetAll}
                  >
                    <FaRedo /> Reiniciar Todo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
