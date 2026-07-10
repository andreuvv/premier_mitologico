import { useState } from 'react';
import { FaTable, FaTrophy, FaLayerGroup, FaBlog } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useMitoxicosHomeLoad } from '../hooks/useMitoxicosHomeLoad';
import OnlineTournamentBanner from '../components/OnlineTournamentBanner';
import FormatBanner from '../components/FormatBanner';
import ActiveTournamentSection from '../components/ActiveTournamentSection';
import GlobalStandingsTable from '../components/GlobalStandingsTable';
import LatestDecksSection from '../components/LatestDecksSection';
import LatestBlogCard from '../components/LatestBlogCard';
import MitoxicosLoader from '../components/loading/MitoxicosLoader';
import LoadingOverlay from '../components/loading/LoadingOverlay';
import styles from './MitoxicosHomePage.module.css';

type MitoxicosTab = 'global' | 'torneo' | 'mazos' | 'blog';

const MitoxicosHomeContent = () => {
  const [activeTab, setActiveTab] = useState<MitoxicosTab>('global');
  const {
    isReady,
    progress,
    globalStandings,
    tournament,
    latestPb,
    latestFx,
    latestPost,
  } = useMitoxicosHomeLoad();

  if (!isReady) {
    return (
      <LoadingOverlay visible>
        <MitoxicosLoader progress={progress} message="Cargando..." size="lg" />
      </LoadingOverlay>
    );
  }

  return (
    <div className={styles.container}>
      <OnlineTournamentBanner preloadedTournament={tournament} />
      <div className={styles.bannerSection}>
        <FormatBanner />
      </div>

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

      <div className={styles.desktopView}>
        <div className={styles.desktopTopRow}>
          <section className={styles.tournamentColumn}>
            <ActiveTournamentSection variant="desktop" />
          </section>
          <aside className={styles.sidebarColumn}>
            <LatestDecksSection
              contained
              skipFetch
              preloadedPb={latestPb}
              preloadedFx={latestFx}
            />
            <LatestBlogCard collapsible skipFetch preloadedPost={latestPost} />
          </aside>
        </div>
        <section className={styles.standingsRow}>
          <GlobalStandingsTable standings={globalStandings} />
        </section>
      </div>

      <div className={styles.mobileTabContent}>
        {activeTab === 'global' && (
          <GlobalStandingsTable standings={globalStandings} />
        )}
        {activeTab === 'torneo' && (
          <ActiveTournamentSection variant="mobile" />
        )}
        {activeTab === 'mazos' && (
          <LatestDecksSection
            contained
            skipFetch
            preloadedPb={latestPb}
            preloadedFx={latestFx}
          />
        )}
        {activeTab === 'blog' && (
          <LatestBlogCard collapsible skipFetch preloadedPost={latestPost} />
        )}
      </div>
    </div>
  );
};

const MitoxicosHomePage = () => {
  const { user } = useAuth();

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

  return <MitoxicosHomeContent />;
};

export default MitoxicosHomePage;
