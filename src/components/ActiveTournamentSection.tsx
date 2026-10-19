import { Link, useNavigate } from 'react-router-dom';
import CountdownCard from './CountdownCard';
import MapCard from './MapCard';
import { useActiveTournamentCard } from '../hooks/useActiveTournamentCard';
import styles from './ActiveTournamentSection.module.css';

interface ActiveTournamentSectionProps {
  variant?: 'desktop' | 'mobile';
}

const TournamentHero = () => {
  const { loading, tournament } = useActiveTournamentCard();

  return (
    <>
      <div className={styles.logoSection}>
        <div className={styles.logoContainer}>
          <img
            src={`${import.meta.env.BASE_URL}assets/images/premier_image.png`}
            alt="Premier Tournament Image"
            className={styles.mainLogo}
          />
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.eventBadge}>Torneo Premier</div>
        {loading ? (
          <h1 className={styles.title}>Cargando…</h1>
        ) : tournament ? (
          <>
            <h1 className={styles.title}>
              {tournament.name} <span>{tournament.monthYear}</span>
            </h1>
            <p className={styles.description}>
              Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
            </p>
            <div className={styles.formatBadges}>
              {tournament.formats.map((format) => {
                const name = format.shortName || format.name;
                const colorClass = name.startsWith('FX') ? styles.formatBadgeFX
                  : name.startsWith('PB') ? styles.formatBadgePB
                  : name.startsWith('Mejor') ? styles.formatBadgeRound
                  : styles.formatBadge;
                return (
                  <Link key={format.link + format.name} to={format.link} className={`${styles.formatBadge} ${colorClass}`} onClick={(event) => event.stopPropagation()}>
                    {name}
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <h1 className={styles.title}>Aún no se ha creado un nuevo torneo.</h1>
        )}
      </div>
    </>
  );
};

const ActiveTournamentSection = ({ variant = 'desktop' }: ActiveTournamentSectionProps) => {
  const navigate = useNavigate();
  const { tournament } = useActiveTournamentCard();
  const dateMissing = Boolean(tournament && !tournament.startDate);
  const locationMissing = Boolean(tournament && !tournament.locationName && !tournament.locationAddress);
  const ribbonText = dateMissing && locationMissing
    ? 'Fecha y ubicación aún no definidas'
    : dateMissing
      ? 'Fecha aún no definida'
      : locationMissing
        ? 'Ubicación aún no definida'
        : null;

  const ribbon = ribbonText ? (
    <div className={styles.undefinedRibbon}>
      {ribbonText}
    </div>
  ) : null;

  if (variant === 'mobile') {
    return (
      <div className={styles.mobileMainContentTop}>
        {ribbon}
        <div
          className={styles.mobileHeroSection}
          onClick={() => navigate('/torneo-premier')}
          style={{ cursor: 'pointer' }}
        >
          <TournamentHero />
        </div>
        <div className={styles.cardsRow}>
          <div className={styles.cardWrapper}>
            <CountdownCard />
          </div>
          <div className={styles.cardWrapper}>
            <MapCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContentTop}>
      <div
        className={styles.mainHeroSection}
        onClick={() => navigate('/torneo-premier')}
        style={{ cursor: 'pointer' }}
      >
        {ribbon}
        <TournamentHero />
      </div>
      <div className={styles.cardsRow}>
        <div className={styles.cardWrapper}>
          <CountdownCard />
        </div>
        <div className={styles.cardWrapper}>
          <MapCard />
        </div>
      </div>
    </div>
  );
};

export default ActiveTournamentSection;
