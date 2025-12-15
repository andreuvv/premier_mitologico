import { useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownCard from '../components/CountdownCard';
import MapCard from '../components/MapCard';
import FormatSummaryRow from '../components/FormatSummaryRow';
import { FaChartBar, FaTrophy } from 'react-icons/fa';
import { banlistSummaries, lastUpdateMonth } from '../data/banlistSummary';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [showSummaries, setShowSummaries] = useState(false);

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
      <h1 className={styles.title}>Copa K&T TBD</h1>
      <p className={styles.description}>
        Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
      </p>
      
      <div className={styles.tournamentInfo}>
        <p className={styles.infoText}>
          Formatos: <Link to="/game-formats#primerBloqueRacialLibre" className={styles.formatLink}>Primer Bloque Racial Libre</Link> y <Link to="/game-formats#bloqueFuriaRacialLibre" className={styles.formatLink}>Furia Extendido Racial Libre</Link>
        </p>
        <p className={styles.infoText}>
          Tipo de Rondas: <Link to="/tournament-info#md3" className={styles.formatLink}>Mejor de 3</Link>
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

