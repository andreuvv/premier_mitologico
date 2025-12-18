import { useState, useEffect } from 'react';
import { getTournamentDateTime, formatTournamentDate, isTournamentPast } from '../config/tournamentConfig';
import styles from './CountdownCard.module.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownCard() {
  const targetDate = getTournamentDateTime();
  const isPast = isTournamentPast();
  
  const calculateTimeLeft = (): TimeLeft => {
    if (!targetDate || isPast) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  
  useEffect(() => {
    if (!targetDate || isPast) return;
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, isPast]);
  
  const dateDisplay = formatTournamentDate();
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>⏱️</span>
        <h2>FECHA DEL EVENTO</h2>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.dateBox}>
        {/* <p className={styles.dateLabel}>Fecha del evento</p> */}
        <p className={styles.dateValue}>{dateDisplay}</p>
      </div>
      {isPast ? (
        <div className={styles.tbdMessage}>
          <p className={styles.tbdText}>TBD</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
