import { useState } from 'react';
import { Link } from 'react-router-dom';
import ImportantDocumentsCard from '../components/ImportantDocumentsCard';
import FormatSummaryRow from '../components/FormatSummaryRow';
import FormatBanner from '../components/FormatBanner';
import MitoxicosLoader from '../components/loading/MitoxicosLoader';
import LoadingOverlay from '../components/loading/LoadingOverlay';
import { FaBook, FaGavel } from 'react-icons/fa';
import { useHomePageLoad } from '../hooks/useHomePageLoad';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<'documentos' | 'banlist'>('banlist');
  const { isReady, progress, summaries, summaryMonth } = useHomePageLoad();

  if (!isReady) {
    return (
      <LoadingOverlay visible>
        <MitoxicosLoader progress={progress} message="Cargando..." size="lg" />
      </LoadingOverlay>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageLayout}>
        <div className={styles.bannerSection}>
          <FormatBanner />
        </div>

        <div className={styles.mobileTabsContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'banlist' ? styles.active : ''}`}
            onClick={() => setActiveTab('banlist')}
          >
            <FaGavel className={styles.tabIcon} />
            <span className={styles.tabLabel}>Resumen BanList</span>
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'documentos' ? styles.active : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            <FaBook className={styles.tabIcon} />
            <span className={styles.tabLabel}>Docs Oficiales</span>
          </button>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.desktopView}>
            <div className={styles.banlistSection}>
              <div className={styles.banlistHeader}>
                <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {summaryMonth}</h3>
              </div>
              <FormatSummaryRow summaries={summaries} />
              <Link to="/banlist" className={styles.banlistLink}>
                Ver Ban List completa
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.desktopSidebar}>
          <div className={styles.cardWrapper}>
            <ImportantDocumentsCard />
          </div>
        </div>

        <div className={styles.mobileTabContent}>
          {activeTab === 'documentos' && (
            <div className={styles.cardWrapper}>
              <ImportantDocumentsCard />
            </div>
          )}
          {activeTab === 'banlist' && (
            <div className={styles.banlistTabContent}>
              <div className={styles.banlistHeader}>
                <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {summaryMonth}</h3>
              </div>
              <FormatSummaryRow summaries={summaries} />
              <Link to="/banlist" className={styles.banlistLink}>
                Ver Ban List completa
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
