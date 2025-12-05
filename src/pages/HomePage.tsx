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
      <h1 className={styles.title}>Copa K&T Diciembre 2025</h1>
      <p className={styles.description}>
        Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
      </p>
      
      <div className={styles.quickAccess}>
        <Link to="/fixture" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }}>
          <FaChartBar className={styles.cardIcon} />
          <span className={styles.cardText}>Fixture</span>
          <span className={styles.cardSubtext}>Ver Emparejamientos</span>
        </Link>
        <Link to="/standings" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }}>
          <FaTrophy className={styles.cardIcon} />
          <span className={styles.cardText}>Tabla de Posiciones</span>
          <span className={styles.cardSubtext}>Ver Clasificación</span>
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

