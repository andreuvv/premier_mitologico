import { useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownCard from '../components/CountdownCard';
import MapCard from '../components/MapCard';
import FormatSummaryRow from '../components/FormatSummaryRow';
import { FaChartBar, FaTrophy } from 'react-icons/fa';
import { banlistSummaries, lastUpdateMonth } from '../data/banlistSummary';
import { tournamentConfig, isTournamentPast, getTournamentMonthYear } from '../config/tournamentConfig';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [showSummaries, setShowSummaries] = useState(false);
  const isPast = isTournamentPast();
  const monthYear = getTournamentMonthYear();

  return (
    <div className={styles.container}>
      <h3 className={styles.subtitle}>Premier Mitológico</h3>
      <div className={styles.logoContainer}>
        <img 
          src={`${import.meta.env.BASE_URL}assets/images/logo_app(1).svg`} 
          alt="MYL Tournament Logo" 
          className={styles.mainLogo}
        />
      </div>
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
      
      <div className={styles.tournamentInfo}>
        <p className={styles.infoText}>
          Formatos: {tournamentConfig.formats.map((format, index) => (
            <span key={format.name}>
              {index > 0 && ' y '}
              <Link to={format.link} className={styles.formatLink}>{format.name}</Link>
            </span>
          ))}
        </p>
        <p className={styles.infoText}>
          Tipo de Rondas: <Link to={tournamentConfig.roundType.link} className={styles.formatLink}>{tournamentConfig.roundType.name}</Link>
        </p>
      </div>
      
      <div className={styles.quickAccess}>
        <Link to="/fixture" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }}>
          <FaChartBar className={styles.cardIcon} />
          <span className={styles.cardText}>Fixture</span>
          <span className={styles.cardSubtext}>Ver Emparejamientos</span>
        </Link>
        <Link to="/standings" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }}>
          <FaTrophy className={styles.cardIcon} />
          <span className={styles.cardText}>Standings</span>
          <span className={styles.cardSubtext}>Ver Tabla de Posiciones</span>
        </Link>
      </div>

      <div className={styles.banlistSection}>
        <div className={styles.banlistHeader}>
          <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {lastUpdateMonth}</h3>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowSummaries(!showSummaries)}
          >
            {showSummaries ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {showSummaries && (
          <>
            <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
            <FormatSummaryRow summaries={banlistSummaries} />
            <Link to="/banlist" className={styles.banlistLink}>
              Ver Ban List completa
            </Link>
          </>
        )}
      </div>

      <div className={styles.cardsGrid}>
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

export default HomePage;

