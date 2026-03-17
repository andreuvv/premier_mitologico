import { useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownCard from '../components/CountdownCard';
import MapCard from '../components/MapCard';
import LatestBlogCard from '../components/LatestBlogCard';
import ImportantDocumentsCard from '../components/ImportantDocumentsCard';
import FormatSummaryRow from '../components/FormatSummaryRow';
import OnlineTournamentBanner from '../components/OnlineTournamentBanner';
import { FaChartBar, FaTrophy, FaBook, FaBlog, FaGavel } from 'react-icons/fa';
import { banlistSummaries, lastUpdateMonth } from '../data/banlistSummary';
import { tournamentConfig, isTournamentPast, getTournamentMonthYear, isTournamentDay } from '../config/tournamentConfig';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [showSummaries, setShowSummaries] = useState(true);
  const [activeTab, setActiveTab] = useState<'torneo' | 'documentos' | 'blog' | 'banlist'>('torneo');
  const isPast = isTournamentPast();
  const isTodayTournament = isTournamentDay();
  const monthYear = getTournamentMonthYear();

  return (
    <div className={styles.container}>
      <OnlineTournamentBanner />
      <div className={styles.pageLayout}>
        {/*<h2 className={styles.pageTitle}>Próximo Torneo Premier</h2>*/}
        
        {/* Mobile/Tablet Tab Navigation */}
        <div className={styles.mobileTabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'torneo' ? styles.active : ''}`}
            onClick={() => setActiveTab('torneo')}
          >
            <FaTrophy className={styles.tabIcon} />
            <span className={styles.tabLabel}>Torneo Premier</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'documentos' ? styles.active : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            <FaBook className={styles.tabIcon} />
            <span className={styles.tabLabel}>Docs Oficiales</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'banlist' ? styles.active : ''}`}
            onClick={() => setActiveTab('banlist')}
          >
            <FaGavel className={styles.tabIcon} />
            <span className={styles.tabLabel}>Resumen BanList</span>
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'blog' ? styles.active : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <FaBlog className={styles.tabIcon} />
            <span className={styles.tabLabel}>Último Blog</span>
          </button>
        </div>

        <div className={styles.mainContent}>
          {/* Desktop Layout */}
          <div className={styles.desktopView}>
            <div className={styles.mainContentTop}>
            {tournamentConfig.dateTentative && (
              <div className={styles.undefinedRibbon}>
                Fecha y Ubicación aún NO definidas
              </div>
            )}
            <div className={styles.logoSection}>
              <div className={styles.logoContainer}>
                <img 
                  src={`${import.meta.env.BASE_URL}assets/images/premier_image.png`} 
                  alt="Premier Tournament Image" 
                  className={styles.mainLogo}
                />
              </div>
            </div>
            
            <div className={styles.contentSection}>
              <div className={styles.eventBadge}>Torneo Premier</div>
              <h1 className={styles.title}>
                {tournamentConfig.name} {isPast ? (
                  <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>TBD</span>
                ) : (
                  monthYear && <span>{monthYear}</span>
                )}
              </h1>
              <p className={styles.description}>
                Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
              </p>
              
              <div className={styles.tournamentInfo}>
                <p className={styles.infoText}>
                  Formatos: {tournamentConfig.formats.map((format, index) => (
                    <span key={format.name}>
                      {index > 0 && ' y '}
                      <Link to={format.link} className={styles.formatLink}>{format.name}</Link>
                    </span>
                  ))}
                </p>
                <p className={styles.infoText}>
                  Tipo de Rondas: <Link to={tournamentConfig.roundType.link} className={styles.formatLink}>{tournamentConfig.roundType.name}</Link>
                </p>
              </div>
              
              {isTodayTournament && (
                <div className={styles.quickAccess}>
                  <Link to="/fixture" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }}>
                    <FaChartBar className={styles.cardIcon} />
                    <span className={styles.cardText}>Fixture {monthYear}</span>
                    <span className={styles.cardSubtext}>Ver Emparejamientos</span>
                  </Link>
                  <Link to="/standings" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }}>
                    <FaTrophy className={styles.cardIcon} />
                    <span className={styles.cardText}>Standings {monthYear}</span>
                    <span className={styles.cardSubtext}>Ver Tabla de Posiciones</span>
                  </Link>
                </div>
              )}
            </div>

            <div className={styles.cardsRow}>
              <div className={styles.cardWrapper}>
                <CountdownCard />
              </div>
              <div className={styles.cardWrapper}>
                <MapCard />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className={styles.desktopSidebar}>
          <div className={styles.cardWrapper}>
            <ImportantDocumentsCard />
          </div>
          <div className={styles.cardWrapper}>
            <LatestBlogCard />
          </div>
        </div>

        {/* Mobile/Tablet Tab Content */}
        <div className={styles.mobileTabContent}>
          {activeTab === 'torneo' && (
            <div className={styles.mobileMainContentTop}>
              {tournamentConfig.dateTentative && (
                <div className={styles.undefinedRibbon}>
                  Fecha y Ubicación aún NO definidas
                </div>
              )}
              <div className={styles.logoSection}>
                <div className={styles.logoContainer}>
                  <img 
                    src={`${import.meta.env.BASE_URL}assets/images/premier_image.png`} 
                    alt="Premier Tournament Image" 
                    className={styles.mainLogo}
                  />
                </div>
              </div>
              
              <div className={styles.contentSection}>
                <div className={styles.eventBadge}>Torneo Premier</div>
                <h1 className={styles.title}>
                  {tournamentConfig.name} {isPast ? (
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>TBD</span>
                  ) : (
                    monthYear && <span>{monthYear}</span>
                  )}
                </h1>
                <p className={styles.description}>
                  Prepara tus mazos para el torneo más esperado del reino. Gloria y premios esperan a los mejores duelistas.
                </p>
                
                <div className={styles.tournamentInfo}>
                  <p className={styles.infoText}>
                    Formatos: {tournamentConfig.formats.map((format, index) => (
                      <span key={format.name}>
                        {index > 0 && ' y '}
                        <Link to={format.link} className={styles.formatLink}>{format.name}</Link>
                      </span>
                    ))}
                  </p>
                  <p className={styles.infoText}>
                    Tipo de Rondas: <Link to={tournamentConfig.roundType.link} className={styles.formatLink}>{tournamentConfig.roundType.name}</Link>
                  </p>
                </div>
                
                {isTodayTournament && (
                  <div className={styles.quickAccess}>
                    <Link to="/fixture" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }}>
                      <FaChartBar className={styles.cardIcon} />
                      <span className={styles.cardText}>Fixture {monthYear}</span>
                      <span className={styles.cardSubtext}>Ver Emparejamientos</span>
                    </Link>
                    <Link to="/standings" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }}>
                      <FaTrophy className={styles.cardIcon} />
                      <span className={styles.cardText}>Standings {monthYear}</span>
                      <span className={styles.cardSubtext}>Ver Tabla de Posiciones</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className={styles.cardsRow}>
                <div className={styles.cardWrapper}>
                  <CountdownCard />
                </div>
                <div className={styles.cardWrapper}>
                  <MapCard />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'documentos' && (
            <div className={styles.cardWrapper}>
              <ImportantDocumentsCard />
            </div>
          )}
          {activeTab === 'blog' && (
            <div className={styles.cardWrapper}>
              <LatestBlogCard />
            </div>
          )}
          {activeTab === 'banlist' && (
            <div className={styles.banlistTabContent}>
              <div className={styles.banlistHeader}>
                <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {lastUpdateMonth}</h3>
              </div>
              <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
              <FormatSummaryRow summaries={banlistSummaries} />
              <Link to="/banlist" className={styles.banlistLink}>
                Ver Ban List completa
              </Link>
            </div>
          )}
        </div>

      <div className={styles.banlistSection}>
        <div className={styles.banlistHeader}>
          <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {lastUpdateMonth}</h3>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowSummaries(!showSummaries)}
          >
            {showSummaries ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {showSummaries && (
          <>
            <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
            <FormatSummaryRow summaries={banlistSummaries} />
            <Link to="/banlist" className={styles.banlistLink}>
              Ver Ban List completa
            </Link>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default HomePage;

