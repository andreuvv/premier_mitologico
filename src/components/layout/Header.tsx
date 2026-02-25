import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClipboardList, FaBan, FaGamepad, FaHammer, FaChartBar, FaTrophy, FaHistory, FaUser } from 'react-icons/fa';
import { getTournamentMonthYear } from '../../config/tournamentConfig';
import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const monthYear = getTournamentMonthYear();

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
            {monthYear && <span className={styles.badge}>{monthYear}</span>}
          </Link>
          <Link 
            to="/standings" 
            className={location.pathname === '/standings' ? styles.active : ''}
          >
            <FaTrophy className={styles.icon} />
            Standings
            {monthYear && <span className={styles.badge}>{monthYear}</span>}
          </Link>
          <Link 
            to="/players" 
            className={location.pathname.startsWith('/players') ? styles.active : ''}
          >
            <FaUser className={styles.icon} />
            Jugadores
          </Link>
          <Link 
            to="/banlist" 
            className={location.pathname === '/banlist' ? styles.active : ''}
          >
            <FaBan className={styles.icon} />
            Ban List
          </Link>
          <Link 
            to="/tournament-history" 
            className={location.pathname.startsWith('/tournament-history') ? styles.active : ''}
          >
            <FaHistory className={styles.icon} />
            Historial
          </Link>
          <Link 
            to="/tournament-info" 
            className={location.pathname === '/tournament-info' ? styles.active : ''}
          >
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </Link>
          <Link 
            to="/game-formats" 
            className={location.pathname === '/game-formats' ? styles.active : ''}
          >
            <FaGamepad className={styles.icon} />
            Formatos
          </Link>
          {/* <button className={styles.navDisabled} disabled>
            <FaHammer className={styles.icon} />
            Deck Builder
          </button> */}
        </nav>

        <button 
          className={styles.hamburger}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        {/* Aca poner un option si es que quieres un botón al lado del hambuger icon */}
        
        <button className={styles.loginButton} disabled>
        </button>
      </div>
  
      {/* Acá poner un option que este justificado a la derecha, usar styles.loginButton */}
      <button 
        className={styles.loginButton}
        onClick={() => window.open('https://mazos.cl/format-selection', '_blank')}
      >
        <FaHammer className={styles.icon} />
        Deck Builder
      </button>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <FaHome className={styles.icon} />
            Inicio
          </Link>
          <Link to="/fixture" onClick={() => setMobileMenuOpen(false)}>
            <FaChartBar className={styles.icon} />
            Fixture
            {monthYear && <span className={styles.mobileBadge}>{monthYear}</span>}
          </Link>
          <Link to="/standings" onClick={() => setMobileMenuOpen(false)}>
            <FaTrophy className={styles.icon} />
            Standings
            {monthYear && <span className={styles.mobileBadge}>{monthYear}</span>}
          </Link>
          <Link to="/tournament-history" onClick={() => setMobileMenuOpen(false)}>
            <FaHistory className={styles.icon} />
            Historial
          </Link>
          <Link to="/players" onClick={() => setMobileMenuOpen(false)}>
            <FaUser className={styles.icon} />
            Jugadores
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
          <button 
            className={styles.mobileMenuLink}
            onClick={() => {
              window.open('https://mazos.cl/format-selection', '_blank');
              setMobileMenuOpen(false);
            }}
          >
            <FaHammer className={styles.icon} />
            Deck Builder
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;

