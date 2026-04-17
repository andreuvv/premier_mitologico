import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClipboardList, FaBan, FaGamepad, FaHammer, FaTrophy, FaHistory, FaUser, FaBlog, FaBook } from 'react-icons/fa';
import LatestBlogCard from '../LatestBlogCard';
import { getTournamentMonthYear } from '../../config/tournamentConfig';
import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blogHovered, setBlogHovered] = useState(false);
  const [cartasHovered, setCartasHovered] = useState(false);
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
            to="/torneo-premier" 
            className={location.pathname === '/torneo-premier' || location.pathname.startsWith('/torneo-premier/') || location.pathname === '/fixture' || location.pathname === '/standings' ? styles.active : ''}
          >
            <FaTrophy className={styles.icon} />
            Torneo Premier
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
          <div
            className={styles.cartasNavItem}
            onMouseEnter={() => setCartasHovered(true)}
            onMouseLeave={() => setCartasHovered(false)}
          >
            <Link 
              to="/coleccion" 
              className={location.pathname === '/coleccion' || location.pathname.startsWith('/coleccion/') ? styles.active : ''}
            >
              <FaBook className={styles.icon} />
              Cartas
            </Link>
            {cartasHovered && (
              <div className={styles.cartasDropdown}>
                <button
                  className={styles.cartasDropdownItem}
                  onClick={() => {
                    window.open('https://mazos.cl/format-selection', '_blank');
                    setCartasHovered(false);
                  }}
                >
                  <FaHammer className={styles.icon} />
                  Deck Builder
                </button>
              </div>
            )}
          </div>
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
          <div 
            className={styles.blogNavItem}
            onMouseEnter={() => setBlogHovered(true)}
            onMouseLeave={() => setBlogHovered(false)}
          >
            <Link 
              to="/blog" 
              className={location.pathname.startsWith('/blog') ? styles.active : ''}
            >
              <FaBlog className={styles.icon} />
              Blog
            </Link>
            {blogHovered && (
              <div className={styles.blogPopover}>
                <h3 className={styles.blogPopoverTitle}>Último Post</h3>
                <LatestBlogCard />
              </div>
            )}
          </div>
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
  


      {mobileMenuOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          <FaHome className={styles.icon} />
          Inicio
        </Link>
        <Link to="/torneo-premier" onClick={() => setMobileMenuOpen(false)}>
          <FaTrophy className={styles.icon} />
          Torneo Premier
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
        <Link to="/coleccion" onClick={() => setMobileMenuOpen(false)}>
          <FaBook className={styles.icon} />
          Cartas
        </Link>
        <button
          className={styles.mobileSubItem}
          onClick={() => {
            window.open('https://mazos.cl/format-selection', '_blank');
            setMobileMenuOpen(false);
          }}
        >
          <FaHammer className={styles.icon} />
          Deck Builder
        </button>
        <Link to="/game-formats" onClick={() => setMobileMenuOpen(false)}>
          <FaGamepad className={styles.icon} />
          Formatos
        </Link>
        <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>
          <FaBlog className={styles.icon} />
          Blog
        </Link>
      </div>
    </header>
  );
};

export default Header;

