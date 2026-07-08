import { useEffect, useState } from 'react';
import { FaTable, FaTrophy, FaLayerGroup, FaBlog } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import OnlineTournamentBanner from '../components/OnlineTournamentBanner';
import FormatBanner from '../components/FormatBanner';
import ActiveTournamentSection from '../components/ActiveTournamentSection';
import GlobalStandingsTable from '../components/GlobalStandingsTable';
import LatestDecksSection from '../components/LatestDecksSection';
import LatestBlogCard from '../components/LatestBlogCard';
import { tournamentAPI, GlobalStanding } from '../services/tournamentAPI';
import styles from './MitoxicosHomePage.module.css';

type MitoxicosTab = 'global' | 'torneo' | 'mazos' | 'blog';

const MitoxicosHomePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MitoxicosTab>('global');
  const [globalStandings, setGlobalStandings] = useState<GlobalStanding[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    tournamentAPI.getGlobalStandings()
      .then((standings) => {
        if (!cancelled) setGlobalStandings(standings);
      })
      .catch((err) => console.error('Error loading global standings:', err));
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.gate}>
          <h1 className={styles.gateTitle}>Zona Mitóxicos</h1>
          <p className={styles.gateText}>Inicia sesión para acceder a la sección Mitóxicos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <OnlineTournamentBanner />
      <div className={styles.bannerSection}>
        <FormatBanner />
      </div>

      {/* Mobile/Tablet Tab Navigation */}
      <div className={styles.mobileTabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'global' ? styles.active : ''}`}
          onClick={() => setActiveTab('global')}
        >
          <FaTable className={styles.tabIcon} />
          <span className={styles.tabLabel}>Tabla Global</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'torneo' ? styles.active : ''}`}
          onClick={() => setActiveTab('torneo')}
        >
          <FaTrophy className={styles.tabIcon} />
          <span className={styles.tabLabel}>Torneo Premier</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'mazos' ? styles.active : ''}`}
          onClick={() => setActiveTab('mazos')}
        >
          <FaLayerGroup className={styles.tabIcon} />
          <span className={styles.tabLabel}>Últimos Mazos</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'blog' ? styles.active : ''}`}
          onClick={() => setActiveTab('blog')}
        >
          <FaBlog className={styles.tabIcon} />
          <span className={styles.tabLabel}>Último Blog</span>
        </button>
      </div>

      {/* Desktop layout */}
      <div className={styles.desktopView}>
        <div className={styles.desktopTopRow}>
          <section className={styles.tournamentColumn}>
            <ActiveTournamentSection variant="desktop" />
          </section>
          <aside className={styles.sidebarColumn}>
            <LatestDecksSection contained />
            <LatestBlogCard collapsible />
          </aside>
        </div>
        <section className={styles.standingsRow}>
          <GlobalStandingsTable standings={globalStandings} />
        </section>
      </div>

      {/* Mobile/Tablet tab content */}
      <div className={styles.mobileTabContent}>
        {activeTab === 'global' && (
          <GlobalStandingsTable standings={globalStandings} />
        )}
        {activeTab === 'torneo' && (
          <ActiveTournamentSection variant="mobile" />
        )}
        {activeTab === 'mazos' && (
          <LatestDecksSection contained />
        )}
        {activeTab === 'blog' && (
          <LatestBlogCard collapsible />
        )}
      </div>
    </div>
  );
};

export default MitoxicosHomePage;
