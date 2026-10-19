import { useEffect, useState } from 'react';
import {
  activeTournamentDateTime,
  formatActiveTournamentDate,
  isTournamentDatePast,
  useActiveTournamentCard,
} from '../hooks/useActiveTournamentCard';
import styles from './CountdownCard.module.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownCard() {
  const { loading, tournament } = useActiveTournamentCard();
  const startDate = tournament?.startDate ?? null;
  const isPast = !startDate || isTournamentDatePast(startDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = activeTournamentDateTime(startDate);
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    const tick = () => {
      const difference = targetDate.getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>⏱️</span>
        <h2>FECHA DEL TORNEO PREMIER</h2>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.dateBox}>
        <p className={styles.dateValue}>
          {loading
            ? 'Cargando…'
            : tournament
              ? formatActiveTournamentDate(startDate)
              : 'Aún no se ha creado un nuevo torneo.'}
        </p>
      </div>
      {tournament && !isPast ? (
        <div className={styles.countdown}>
          <div className={styles.timeUnit}>
            <div className={styles.timeValue}>{timeLeft.days}</div>
            <div className={styles.timeLabel}>Días</div>
          </div>
          <div className={styles.timeSeparator}>:</div>
          <div className={styles.timeUnit}>
            <div className={styles.timeValue}>{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className={styles.timeLabel}>Horas</div>
          </div>
          <div className={styles.timeSeparator}>:</div>
          <div className={styles.timeUnit}>
            <div className={styles.timeValue}>{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className={styles.timeLabel}>Minutos</div>
          </div>
          <div className={styles.timeSeparator}>:</div>
          <div className={styles.timeUnit}>
            <div className={styles.timeValue}>{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className={styles.timeLabel}>Segundos</div>
          </div>
        </div>
      ) : (
        <div className={styles.tbdMessage}>
          <p className={styles.tbdText}>{tournament ? 'TBD' : ''}</p>
        </div>
      )}
    </div>
  );
}
