import { Link } from 'react-router-dom';
import styles from '../components/StatusMessage.module.css';

export default function NotFoundPage() {
  return (
    <section className={styles.wrapper}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Página no encontrada</h1>
      <p className={styles.text}>
        La dirección que buscas no existe o cambió de lugar.
      </p>
      <div className={styles.actions}>
        <Link to="/" className={styles.primary}>Ir al inicio</Link>
        <Link to="/torneo-premier" className={styles.secondary}>Torneo Premier</Link>
      </div>
    </section>
  );
}
