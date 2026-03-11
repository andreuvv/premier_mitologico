import { FaGithub } from 'react-icons/fa';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Sobre Este Proyecto</h3>
          <p className={styles.text}>
            Este proyecto es una plataforma independiente para una comunidad de amigos jugadores de Mitos y Leyendas desde hace más de 20 años.
          </p>
          <a
            href="https://github.com/andreuvv"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
          >
            <FaGithub className={styles.githubIcon} />
            <span>GitHub</span>
          </a>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Aviso Legal</h3>
          <p className={styles.legalText}>
            Esta plataforma es un proyecto independiente de uso personal para una comunidad sin
            fines de lucro y no esta oficialmente asociada a Fenix Entertainment S.P.A.
          </p>
          <p className={styles.legalText}>
            Mitos y Leyendas es una marca registrada de sus respectivos dueños. El contenido del
            juego en esta plataforma se usa de manera informativa.
          </p>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p className={styles.copyright}>© 2026 MYL Tournament Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
