import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClipboardList, FaBan, FaGamepad, FaHammer, FaChartBar, FaTrophy } from 'react-icons/fa';
import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img src={`${import.meta.env.BASE_URL}assets/images/logo_app(1).svg`} alt="MYL Premier" />
        </Link>
        
        <nav className={styles.nav}>
          <Link 
            to="/" 
            className={location.pathname === '/' ? styles.active : ''}
          >
            <FaHome className={styles.icon} />
            Inicio
          </Link>
          <Link 
            to="/fixture" 
            className={location.pathname === '/fixture' ? styles.active : ''}
          >
            <FaChartBar className={styles.icon} />
            Fixture
          </Link>
          <Link 
            to="/standings" 
            className={location.pathname === '/standings' ? styles.active : ''}
          >
            <FaTrophy className={styles.icon} />
            Standings
          </Link>
          <Link 
            to="/tournament-info" 
            className={location.pathname === '/tournament-info' ? styles.active : ''}
          >
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </Link>
          <Link 
            to="/banlist" 
            className={location.pathname === '/banlist' ? styles.active : ''}
          >
            <FaBan className={styles.icon} />
            Ban List
          </Link>
          <Link 
            to="/game-formats" 
            className={location.pathname === '/game-formats' ? styles.active : ''}
          >
            <FaGamepad className={styles.icon} />
            Formatos
          </Link>
        </nav>

        <div className={styles.spacer}></div>

        <button className={styles.deckBuilder} disabled>
          <FaHammer className={styles.icon} />
          Deck Builder
        </button>

        <button 
          className={styles.hamburger}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <FaHome className={styles.icon} />
            Inicio
          </Link>
          <Link to="/fixture" onClick={() => setMobileMenuOpen(false)}>
            <FaChartBar className={styles.icon} />
            Fixture
          </Link>
          <Link to="/standings" onClick={() => setMobileMenuOpen(false)}>
            <FaTrophy className={styles.icon} />
            Standings
          </Link>
          <Link to="/tournament-info" onClick={() => setMobileMenuOpen(false)}>
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </Link>
          <Link to="/banlist" onClick={() => setMobileMenuOpen(false)}>
            <FaBan className={styles.icon} />
            Ban List
          </Link>
          <Link to="/game-formats" onClick={() => setMobileMenuOpen(false)}>
            <FaGamepad className={styles.icon} />
            Formatos
          </Link>
          <div className={styles.mobileDisabled}>
            <FaHammer className={styles.icon} />
            Deck Builder
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

