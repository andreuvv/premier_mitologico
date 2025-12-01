import CountdownCard from '../components/CountdownCard';
import MapCard from '../components/MapCard';
import { FaChartBar, FaTrophy } from 'react-icons/fa';
import styles from './HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.container}>
      <h3 className={styles.subtitle}>Premier Mitológico</h3>
      <h1 className={styles.title}>Copa K&T Diciembre 2025</h1>
      <p className={styles.description}>
        Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
      </p>
      
      <div className={styles.quickAccess}>
        <a href="#" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }}>
          <FaChartBar className={styles.cardIcon} />
          <span className={styles.cardText}>Fixture</span>
        </a>
        <a href="#" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }}>
          <FaTrophy className={styles.cardIcon} />
          <span className={styles.cardText}>Tabla de Posiciones</span>
        </a>
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

