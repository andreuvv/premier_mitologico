import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaClipboardList, FaBan, FaGamepad, FaHammer, FaTrophy, FaHistory,
  FaUser, FaBlog, FaBook, FaSignInAlt, FaSignOutAlt, FaChartPie, FaChevronDown, FaUsers,
} from 'react-icons/fa';
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
  const [cartasHovered, setCartasHovered] = useState(false);
  const [mitoxicosHovered, setMitoxicosHovered] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [premierPlayerName, setPremierPlayerName] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const monthYear = getTournamentMonthYear();

  const isMitoxicosActive =
    location.pathname === '/mitoxicos'
    || location.pathname.startsWith('/mitoxicos/')
    || location.pathname === '/torneo-premier'
    || location.pathname.startsWith('/torneo-premier/')
    || location.pathname === '/fixture'
    || location.pathname === '/standings'
    || location.pathname.startsWith('/players')
    || location.pathname.startsWith('/tournament-history')
    || location.pathname === '/tournament-info'
    || location.pathname.startsWith('/blog');

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

  const mitoxicosNavItem = (
    <div
      className={`${styles.cartasNavItem} ${styles.mitoxicosNavDesktop}`}
      onMouseEnter={() => setMitoxicosHovered(true)}
      onMouseLeave={() => setMitoxicosHovered(false)}
    >
      {user ? (
        <Link
          to="/mitoxicos"
          className={isMitoxicosActive ? styles.active : ''}
        >
          <FaUsers className={styles.icon} />
          Mitoxicos
          <FaChevronDown className={styles.chevron} />
        </Link>
      ) : (
        <span className={styles.navDisabledItem} data-tooltip="Inicia Sesión para acceder">
          <FaUsers className={styles.icon} />
          Mitoxicos
          <FaChevronDown className={styles.chevron} />
        </span>
      )}
      {mitoxicosHovered && (
        <div className={styles.cartasDropdown}>
          {user ? (
            <Link to="/mitoxicos" className={styles.cartasDropdownItem} onClick={() => setMitoxicosHovered(false)}>
              <FaUsers className={styles.icon} />
              Mitoxicos
            </Link>
          ) : (
            <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
              <FaUsers className={styles.icon} />
              Mitoxicos
            </button>
          )}
          {user ? (
            <Link to="/torneo-premier" className={styles.cartasDropdownItem} onClick={() => setMitoxicosHovered(false)}>
              <FaTrophy className={styles.icon} />
              Torneo Premier
              {monthYear && <span className={styles.badge}>{monthYear}</span>}
            </Link>
          ) : (
            <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
              <FaTrophy className={styles.icon} />
              Torneo Premier
            </button>
          )}
          {user ? (
            <Link to="/players" className={styles.cartasDropdownItem} onClick={() => setMitoxicosHovered(false)}>
              <FaUser className={styles.icon} />
              Jugadores
            </Link>
          ) : (
            <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
              <FaUser className={styles.icon} />
              Jugadores
            </button>
          )}
          {user ? (
            <Link to="/tournament-history" className={styles.cartasDropdownItem} onClick={() => setMitoxicosHovered(false)}>
              <FaHistory className={styles.icon} />
              Historial
            </Link>
          ) : (
            <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
              <FaHistory className={styles.icon} />
              Historial
            </button>
          )}
          {user ? (
            <Link to="/tournament-info" className={styles.cartasDropdownItem} onClick={() => setMitoxicosHovered(false)}>
              <FaClipboardList className={styles.icon} />
              Info Torneo
            </Link>
          ) : (
            <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
              <FaClipboardList className={styles.icon} />
              Info Torneo
            </button>
          )}
          {user ? (
            <Link to="/blog" className={styles.cartasDropdownItem} onClick={() => setMitoxicosHovered(false)}>
              <FaBlog className={styles.icon} />
              Blog
            </Link>
          ) : (
            <button className={`${styles.cartasDropdownItem} ${styles.cartasDropdownDisabled}`} disabled>
              <FaBlog className={styles.icon} />
              Blog
            </button>
          )}
        </div>
      )}
    </div>
  );

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
        <div className={styles.logoGroup}>
          <Link to="/" className={styles.logo}>
            <img src={`${import.meta.env.BASE_URL}assets/images/logo_app(1).svg`} alt="MYL Premier" />
          </Link>
          {mitoxicosNavItem}
        </div>

        <nav className={styles.nav}>
          <Link 
            to="/" 
            className={location.pathname === '/' ? styles.active : ''}
          >
            <FaHome className={styles.icon} />
            Inicio
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
              <FaChevronDown className={styles.chevron} />
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
          <Link 
            to="/game-formats" 
            className={location.pathname === '/game-formats' ? styles.active : ''}
          >
            <FaGamepad className={styles.icon} />
            Formatos
          </Link>

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
            className={`${styles.loginButton} ${styles.loginButtonActive} ${accountDrawerOpen ? styles.loginButtonOpen : ''}`}
            onClick={() => setAccountDrawerOpen(true)}
            aria-label="Menú de cuenta"
            aria-expanded={accountDrawerOpen}
          >
            <FaUser className={styles.icon} />
            <FaChevronDown className={styles.accountChevron} />
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
            <FaChevronDown className={styles.accountChevron} />
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
        <Link to="/banlist" onClick={() => setMobileMenuOpen(false)}>
          <FaBan className={styles.icon} />
          Ban List
        </Link>
        <Link to="/coleccion" onClick={() => setMobileMenuOpen(false)}>
          <FaBook className={styles.icon} />
          Cartas
          <FaChevronDown className={styles.mobileGroupChevron} />
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
        {user ? (
          <Link to="/mitoxicos" onClick={() => setMobileMenuOpen(false)}>
            <FaUsers className={styles.icon} />
            Mitoxicos
            <FaChevronDown className={styles.mobileGroupChevron} />
          </Link>
        ) : (
          <span className={styles.mobileNavDisabledItem} data-tooltip="Inicia Sesión para acceder">
            <FaUsers className={styles.icon} />
            Mitoxicos
            <FaChevronDown className={styles.mobileGroupChevron} />
          </span>
        )}
        {user ? (
          <Link to="/mitoxicos" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaUsers className={styles.icon} />
            Mitoxicos
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaUsers className={styles.icon} />
            Mitoxicos
          </button>
        )}
        {user ? (
          <Link to="/torneo-premier" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaTrophy className={styles.icon} />
            Torneo Premier
            {monthYear && <span className={styles.mobileBadge}>{monthYear}</span>}
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaTrophy className={styles.icon} />
            Torneo Premier
          </button>
        )}
        {user ? (
          <Link to="/players" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaUser className={styles.icon} />
            Jugadores
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaUser className={styles.icon} />
            Jugadores
          </button>
        )}
        {user ? (
          <Link to="/tournament-history" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaHistory className={styles.icon} />
            Historial
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaHistory className={styles.icon} />
            Historial
          </button>
        )}
        {user ? (
          <Link to="/tournament-info" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaClipboardList className={styles.icon} />
            Info Torneo
          </button>
        )}
        {user ? (
          <Link to="/blog" className={styles.mobileSubItem} onClick={() => setMobileMenuOpen(false)}>
            <FaBlog className={styles.icon} />
            Blog
          </Link>
        ) : (
          <button className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`} disabled>
            <FaBlog className={styles.icon} />
            Blog
          </button>
        )}
        <Link to="/game-formats" onClick={() => setMobileMenuOpen(false)}>
          <FaGamepad className={styles.icon} />
          Formatos
        </Link>
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
