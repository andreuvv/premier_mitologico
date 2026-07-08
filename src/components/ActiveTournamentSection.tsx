import { Link, useNavigate } from 'react-router-dom';
import CountdownCard from './CountdownCard';
import MapCard from './MapCard';
import { tournamentConfig, isTournamentPast, getTournamentMonthYear } from '../config/tournamentConfig';
import styles from './ActiveTournamentSection.module.css';

interface ActiveTournamentSectionProps {
  variant?: 'desktop' | 'mobile';
}

const TournamentHero = () => {
  const isPast = isTournamentPast();
  const monthYear = getTournamentMonthYear();

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
        <h1 className={styles.title}>
          {tournamentConfig.name} {isPast ? (
            <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>TBD</span>
          ) : (
            monthYear && <span>{monthYear}</span>
          )}
        </h1>
        <p className={styles.description}>
          Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
        </p>

        <div className={styles.formatBadges}>
          {tournamentConfig.formats.map((format) => {
            const name = format.shortName || format.name;
            const colorClass = name.startsWith('FX') ? styles.formatBadgeFX
              : name.startsWith('PB') ? styles.formatBadgePB
              : styles.formatBadge;
            return (
              <Link key={format.name} to={format.link} className={`${styles.formatBadge} ${colorClass}`} onClick={(e) => e.stopPropagation()}>
                {name}
              </Link>
            );
          })}
          <Link to={tournamentConfig.roundType.link} className={`${styles.formatBadge} ${styles.formatBadgeRound}`} onClick={(e) => e.stopPropagation()}>
            {tournamentConfig.roundType.name}
          </Link>
        </div>
      </div>
    </>
  );
};

const ActiveTournamentSection = ({ variant = 'desktop' }: ActiveTournamentSectionProps) => {
  const navigate = useNavigate();

  if (variant === 'mobile') {
    return (
      <div className={styles.mobileMainContentTop}>
        {tournamentConfig.dateTentative && (
          <div className={styles.undefinedRibbon}>
            Fecha y Ubicación aún NO definidas
          </div>
        )}

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
        {tournamentConfig.dateTentative && (
          <div className={styles.undefinedRibbon}>
            Fecha y Ubicación aún NO definidas
          </div>
        )}
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
