import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar } from 'react-icons/fa';
import onlineTournamentService, { OnlineTournament } from '../services/onlineTournamentService';
import styles from './OnlineTournamentBanner.module.css';

const OnlineTournamentBanner = () => {
  const [tournament, setTournament] = useState<OnlineTournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      const tournaments = await onlineTournamentService.getActiveTournaments();
      if (tournaments.length > 0) {
        setTournament(tournaments[0]); // Get the first active online tournament
      }
      setLoading(false);
    };

    fetchTournaments();
  }, []);

  if (loading || !tournament) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Extract just the date part (YYYY-MM-DD) if time is included
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      
      // Validate the parts
      if (!year || !month || !day) return null;
      
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const startDate = formatDate(tournament.start_date);
  const endDate = formatDate(tournament.end_date);

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.badge}>Evento Especial</div>
        <h2 className={styles.title}>Torneo '{tournament.name}'</h2>
        <div className={styles.dates}>
          <FaCalendar className={styles.icon} />
          {startDate && endDate && (
            <p>
              {startDate} - {endDate}
            </p>
          )}
          {startDate && !endDate && <p>Desde {startDate}</p>}
        </div>
        <p className={styles.format}>Torneo Presencial • Formato Sellado {tournament.format}</p>
        <Link to={`/online-tournament/${tournament.id}`} className={styles.ctaButton}>
          <span className={styles.ctaText}>Ver Tabla</span>
        </Link>
      </div>
    </div>
  );
};

export default OnlineTournamentBanner;
