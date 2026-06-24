import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaClipboardList, FaBan, FaGamepad, FaHammer, FaTrophy, FaHistory,
  FaUser, FaBlog, FaBook, FaSignInAlt, FaSignOutAlt, FaChartPie,
} from 'react-icons/fa';
import LatestBlogCard from '../LatestBlogCard';
import { getTournamentMonthYear } from '../../config/tournamentConfig';
import { useAuth } from '../../hooks/useAuth';
import { loadProfileById } from '../../hooks/useUserProfile';
import { fixtureAPI } from '../../services/fixtureAPI';
import AuthModal from '../auth/AuthModal';
import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [blogHovered, setBlogHovered] = useState(false);
  const [cartasHovered, setCartasHovered] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [premierPlayerName, setPremierPlayerName] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const monthYear = getTournamentMonthYear();

  const username = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Usuario';

  useEffect(() => {
    if (!user) {
      setPremierPlayerName(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const profile = await loadProfileById(user.id);
      if (cancelled || !profile?.premier_player_id) {
        if (!cancelled) setPremierPlayerName(null);
        return;
      }

      try {
        const players = await fixtureAPI.getPremierPlayers();
        const player = players.find((p) => p.id === profile.premier_player_id);
        if (!cancelled) setPremierPlayerName(player?.name ?? null);
      } catch {
        if (!cancelled) setPremierPlayerName(null);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  const closeAccountMenus = useCallback(() => {
    setAccountMenuOpen(false);
    setAccountDrawerOpen(false);
  }, []);

  const handleSignOutClick = () => {
    closeAccountMenus();
    setMobileMenuOpen(false);
    setSignOutConfirmOpen(true);
  };

  const handleStatsClick = () => {
    if (!premierPlayerName) return;
    closeAccountMenus();
    setMobileMenuOpen(false);
    navigate(`/players/${encodeURIComponent(premierPlayerName)}`);
  };

  const accountMenuItems = (
    <>
      <Link to="/perfil" className={styles.accountMenuItem} onClick={closeAccountMenus}>
        <FaUser className={styles.icon} />
        Ver Perfil
      </Link>
      <Link to="/deck-builder" className={styles.accountMenuItem} onClick={closeAccountMenus}>
        <FaHammer className={styles.icon} />
        Ver mis Mazos
      </Link>
      <Link to="/carpeta" className={styles.accountMenuItem} onClick={closeAccountMenus}>
        <FaBook className={styles.icon} />
        Ver mi Colección
      </Link>
      {premierPlayerName ? (
        <button type="button" className={styles.accountMenuItem} onClick={handleStatsClick}>
          <FaChartPie className={styles.icon} />
          Ver mis Estadísticas
        </button>
      ) : (
        <button type="button" className={`${styles.accountMenuItem} ${styles.accountMenuItemDisabled}`} disabled>
          <FaChartPie className={styles.icon} />
          Ver mis Estadísticas
        </button>
      )}
      <button type="button" className={styles.accountMenuItem} onClick={handleSignOutClick}>
        <FaSignOutAlt className={styles.icon} />
        Cerrar Sesión
      </button>
    </>
  );

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
              className={
                location.pathname === '/coleccion'
                || location.pathname.startsWith('/coleccion/')
                || location.pathname === '/carpeta'
                || location.pathname.startsWith('/carpeta/')
                  ? styles.active
                  : ''
              }
            >
              <FaBook className={styles.icon} />
              Cartas
            </Link>
            {cartasHovered && (
              <div className={styles.cartasDropdown}>
                <Link
                  to="/coleccion"
                  className={styles.cartasDropdownItem}
                  onClick={() => setCartasHovered(false)}
                >
                  <FaBook className={styles.icon} />
                  Cartas
                </Link>
                <Link
                  to="/deck-builder"
                  className={styles.cartasDropdownItem}
                  onClick={() => setCartasHovered(false)}
                >
                  <FaHammer className={styles.icon} />
                  Deck Builder
                </Link>
                {user ? (
                  <Link
                    to="/carpeta"
                    className={styles.cartasDropdownItem}
                    onClick={() => setCartasHovered(false)}
                  >
                    <FaBook className={styles.icon} />
                    Carpeta
                  </Link>
                ) : (
                  <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
                    <FaBook className={styles.icon} />
                    Carpeta
                  </button>
                )}
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

        </nav>

        <button 
          className={styles.hamburger}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        
        {user ? (
          <button
            type="button"
            className={styles.loginButton}
            onClick={() => setAccountDrawerOpen(true)}
            aria-label="Menú de cuenta"
          >
            <FaUser className={styles.icon} />
          </button>
        ) : (
          <button className={`${styles.loginButton} ${styles.loginButtonLoggedOut}`} onClick={() => setAuthModalOpen(true)}>
            <FaSignInAlt className={styles.icon} />
          </button>
        )}
      </div>

      {user ? (
        <div className={styles.desktopAuthArea} ref={accountMenuRef}>
          <button
            type="button"
            className={`${styles.desktopLoginButton} ${styles.desktopLoginButtonActive} ${accountMenuOpen ? styles.desktopLoginButtonOpen : ''}`}
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-expanded={accountMenuOpen}
            aria-haspopup="true"
          >
            <FaUser className={styles.icon} />
            {username}
          </button>
          {accountMenuOpen && (
            <div className={styles.accountDropdown}>
              {accountMenuItems}
            </div>
          )}
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
        <Link
          to="/deck-builder"
          className={styles.mobileSubItem}
          onClick={() => setMobileMenuOpen(false)}
        >
          <FaHammer className={styles.icon} />
          Deck Builder
        </Link>
        {user ? (
          <Link to="/carpeta" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaBook className={styles.icon} />
            Carpeta
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaBook className={styles.icon} />
            Carpeta
          </button>
        )}
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
        {!user && (
          <button className={`${styles.mobileLoginButton} ${styles.mobileLoginButtonLoggedOut}`} onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}>
            <FaSignInAlt className={styles.icon} />
            Iniciar Sesión
          </button>
        )}
      </div>

      {accountDrawerOpen && (
        <div className={styles.overlay} onClick={() => setAccountDrawerOpen(false)} />
      )}
      <div className={`${styles.accountDrawer} ${accountDrawerOpen ? styles.accountDrawerOpen : ''}`}>
        <div className={styles.accountDrawerHeader}>
          <FaUser className={styles.icon} />
          <span>{username}</span>
        </div>
        {accountMenuItems}
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
