import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaClipboardList, FaBan, FaGamepad, FaHammer, FaTrophy, FaHistory, FaUser, FaBlog, FaBook, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import LatestBlogCard from '../LatestBlogCard';
import { getTournamentMonthYear } from '../../config/tournamentConfig';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../auth/AuthModal';
import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blogHovered, setBlogHovered] = useState(false);
  const [cartasHovered, setCartasHovered] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const monthYear = getTournamentMonthYear();

  const username = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Usuario';

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
          {user ? (
            <Link 
              to="/torneo-premier" 
              className={location.pathname === '/torneo-premier' || location.pathname.startsWith('/torneo-premier/') || location.pathname === '/fixture' || location.pathname === '/standings' ? styles.active : ''}
            >
              <FaTrophy className={styles.icon} />
              Torneo Premier
              {monthYear && <span className={styles.badge}>{monthYear}</span>}
            </Link>
          ) : (
            <span className={styles.navDisabledItem} data-tooltip="Inicia Sesión para acceder">
              <FaTrophy className={styles.icon} />
              Torneo Premier
            </span>
          )}
          {user ? (
            <Link 
              to="/players" 
              className={location.pathname.startsWith('/players') ? styles.active : ''}
            >
              <FaUser className={styles.icon} />
              Jugadores
            </Link>
          ) : (
            <span className={styles.navDisabledItem} data-tooltip="Inicia Sesión para acceder">
              <FaUser className={styles.icon} />
              Jugadores
            </span>
          )}
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
                <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
                  <FaBook className={styles.icon} />
                  Colección
                </button>
              </div>
            )}
          </div>
          {user ? (
            <Link 
              to="/tournament-history" 
              className={location.pathname.startsWith('/tournament-history') ? styles.active : ''}
            >
              <FaHistory className={styles.icon} />
              Historial
            </Link>
          ) : (
            <span className={styles.navDisabledItem} data-tooltip="Inicia Sesión para acceder">
              <FaHistory className={styles.icon} />
              Historial
            </span>
          )}
          {user ? (
            <Link 
              to="/tournament-info" 
              className={location.pathname === '/tournament-info' ? styles.active : ''}
            >
              <FaClipboardList className={styles.icon} />
              Info Torneo
            </Link>
          ) : (
            <span className={styles.navDisabledItem} data-tooltip="Inicia Sesión para acceder">
              <FaClipboardList className={styles.icon} />
              Info Torneo
            </span>
          )}
          <Link 
            to="/game-formats" 
            className={location.pathname === '/game-formats' ? styles.active : ''}
          >
            <FaGamepad className={styles.icon} />
            Formatos
          </Link>
          {user ? (
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
          ) : (
            <span className={styles.navDisabledItem} data-tooltip="Inicia Sesión para acceder">
              <FaBlog className={styles.icon} />
              Blog
            </span>
          )}
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
        
        {user ? (
          <Link to="/players" className={styles.loginButton} onClick={() => setMobileMenuOpen(false)}>
            <FaUser className={styles.icon} />
          </Link>
        ) : (
          <button className={`${styles.loginButton} ${styles.loginButtonLoggedOut}`} onClick={() => setAuthModalOpen(true)}>
            <FaSignInAlt className={styles.icon} />
          </button>
        )}
      </div>

      {user ? (
        <div className={styles.desktopAuthArea}>
          <Link to="/players" className={`${styles.desktopLoginButton} ${styles.desktopLoginButtonActive}`}>
            <FaUser className={styles.icon} />
            {username}
          </Link>
          <button className={styles.desktopSignOutButton} onClick={() => setSignOutConfirmOpen(true)} title="Cerrar sesión">
            <FaSignOutAlt className={styles.icon} />
          </button>
        </div>
      ) : (
        <button className={`${styles.desktopLoginButton} ${styles.desktopLoginButtonLoggedOut}`} onClick={() => setAuthModalOpen(true)}>
          <FaSignInAlt className={styles.icon} />
          Iniciar Sesión
        </button>
      )}


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
        {user ? (
          <Link to="/torneo-premier" onClick={() => setMobileMenuOpen(false)}>
            <FaTrophy className={styles.icon} />
            Torneo Premier
            {monthYear && <span className={styles.mobileBadge}>{monthYear}</span>}
          </Link>
        ) : (
          <span className={styles.mobileNavDisabledItem} data-tooltip="Inicia Sesión para acceder">
            <FaTrophy className={styles.icon} />
            Torneo Premier
          </span>
        )}
        {user ? (
          <Link to="/tournament-history" onClick={() => setMobileMenuOpen(false)}>
            <FaHistory className={styles.icon} />
            Historial
          </Link>
        ) : (
          <span className={styles.mobileNavDisabledItem} data-tooltip="Inicia Sesión para acceder">
            <FaHistory className={styles.icon} />
            Historial
          </span>
        )}
        {user ? (
          <Link to="/players" onClick={() => setMobileMenuOpen(false)}>
            <FaUser className={styles.icon} />
            Jugadores
          </Link>
        ) : (
          <span className={styles.mobileNavDisabledItem} data-tooltip="Inicia Sesión para acceder">
            <FaUser className={styles.icon} />
            Jugadores
          </span>
        )}
        {user ? (
          <Link to="/tournament-info" onClick={() => setMobileMenuOpen(false)}>
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </Link>
        ) : (
          <span className={styles.mobileNavDisabledItem} data-tooltip="Inicia Sesión para acceder">
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </span>
        )}
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
        <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
          <FaBook className={styles.icon} />
          Colección
        </button>
        <Link to="/game-formats" onClick={() => setMobileMenuOpen(false)}>
          <FaGamepad className={styles.icon} />
          Formatos
        </Link>
        {user ? (
          <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>
            <FaBlog className={styles.icon} />
            Blog
          </Link>
        ) : (
          <span className={styles.mobileNavDisabledItem} data-tooltip="Inicia Sesión para acceder">
            <FaBlog className={styles.icon} />
            Blog
          </span>
        )}
        <div className={styles.mobileMenuSpacer} />
        {user ? (
          <>
            <Link to="/players" className={styles.mobileLoginButton} onClick={() => setMobileMenuOpen(false)}>
              <FaUser className={styles.icon} />
              {username}
            </Link>
            <button className={styles.mobileLoginButton} onClick={() => { setSignOutConfirmOpen(true); setMobileMenuOpen(false); }}>
              <FaSignOutAlt className={styles.icon} />
              Cerrar Sesión
            </button>
          </>
        ) : (
          <button className={`${styles.mobileLoginButton} ${styles.mobileLoginButtonLoggedOut}`} onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}>
            <FaSignInAlt className={styles.icon} />
            Iniciar Sesión
          </button>
        )}
      </div>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}

      {signOutConfirmOpen && (
        <div className={styles.signOutOverlay} onClick={() => setSignOutConfirmOpen(false)}>
          <div className={styles.signOutModal} onClick={e => e.stopPropagation()}>
            <p className={styles.signOutText}>¿Seguro que quieres cerrar sesión?</p>
            <div className={styles.signOutActions}>
              <button className={styles.signOutCancel} onClick={() => setSignOutConfirmOpen(false)}>
                Cancelar
              </button>
              <button className={styles.signOutConfirm} onClick={() => { signOut(); setSignOutConfirmOpen(false); }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

