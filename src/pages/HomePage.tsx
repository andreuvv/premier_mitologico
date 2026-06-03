import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CountdownCard from '../components/CountdownCard';
import MapCard from '../components/MapCard';
import LatestBlogCard from '../components/LatestBlogCard';
import ImportantDocumentsCard from '../components/ImportantDocumentsCard';
import FormatSummaryRow from '../components/FormatSummaryRow';
import OnlineTournamentBanner from '../components/OnlineTournamentBanner';
import {FaTrophy, FaBook, FaBlog, FaGavel } from 'react-icons/fa';
import { BanListCard, BanListData, BanListFormat } from '../types/banlist';
import { getLatestTwoMonthlyBanlists, MonthlyBanlistSnapshot } from '../services/monthlyBanlistService';
import { banlistSummaries, lastUpdateMonth } from '../data/banlistSummary';
import { ChangeType, FormatSummary } from '../data/banlistSummary';
import { tournamentConfig, isTournamentPast, getTournamentMonthYear } from '../config/tournamentConfig';
import styles from './HomePage.module.css';

type RestrictionStatus = 'banned' | 'limitedX1' | 'limitedX2';

const getRestrictionLabel = (status?: RestrictionStatus): string => {
  if (!status) return 'Liberada';
  if (status === 'banned') return 'Baneada';
  if (status === 'limitedX1') return 'Limitada x1';
  return 'Limitada x2';
};

const getStatusRank = (status?: RestrictionStatus): number => {
  if (!status) return 0;
  if (status === 'limitedX2') return 1;
  if (status === 'limitedX1') return 2;
  return 3;
};

const buildStatusMap = (banlist: BanListData): Map<string, { status: RestrictionStatus; card: BanListCard }> => {
  const map = new Map<string, { status: RestrictionStatus; card: BanListCard }>();

  banlist.banned.forEach(card => {
    map.set(card.name.toLowerCase(), { status: 'banned', card });
  });
  banlist.limitedX1.forEach(card => {
    map.set(card.name.toLowerCase(), { status: 'limitedX1', card });
  });
  banlist.limitedX2.forEach(card => {
    map.set(card.name.toLowerCase(), { status: 'limitedX2', card });
  });

  return map;
};

const compareBanlistChanges = (previous: BanListData, current: BanListData): FormatSummary[] => {
  const previousMap = buildStatusMap(previous);
  const currentMap = buildStatusMap(current);
  const allNames = new Set<string>([...previousMap.keys(), ...currentMap.keys()]);

  const changes: FormatSummary[] = [];

  allNames.forEach(nameKey => {
    const prevEntry = previousMap.get(nameKey);
    const currEntry = currentMap.get(nameKey);

    if (prevEntry?.status === currEntry?.status) {
      return;
    }

    let changeType: ChangeType;

    if (!currEntry) {
      changeType = 'positive';
    } else if (currEntry.status === 'banned') {
      changeType = 'negative';
    } else if (!prevEntry && currEntry.status === 'limitedX2') {
      changeType = 'neutral';
    } else if (!prevEntry && currEntry.status === 'limitedX1') {
      changeType = 'negativeSoft';
    } else {
      const prevRank = getStatusRank(prevEntry?.status);
      const currRank = getStatusRank(currEntry.status);
      const diff = currRank - prevRank;

      if (diff > 0) {
        changeType = diff > 1 ? 'negative' : 'negativeSoft';
      } else if (diff < 0) {
        changeType = Math.abs(diff) > 1 ? 'positive' : 'positiveSoft';
      } else {
        changeType = 'neutral';
      }
    }

    changes.push({
      card: currEntry?.card.name ?? prevEntry?.card.name ?? nameKey,
      pastMonth: getRestrictionLabel(prevEntry?.status),
      currentMonth: getRestrictionLabel(currEntry?.status),
      changeType,
      imageUrl: currEntry?.card.imageUrl || prevEntry?.card.imageUrl,
    });
  });

  changes.sort((a, b) => a.card.localeCompare(b.card, 'es'));
  return changes;
};

const getMonthYearLabel = (lastUpdated: string): string => {
  const monthMatch = lastUpdated.match(/^(\d{4})-(\d{2})/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const safeLocalDate = new Date(year, month - 1, 15);
    return safeLocalDate
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase());
  }

  return new Date(lastUpdated)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());
};

const formatDateFromYearMonth = (year: number, month: number): string => {
  return getMonthYearLabel(`${year}-${String(month).padStart(2, '0')}-01`);
};

const HomePage = () => {
  const navigate = useNavigate();
  const [showSummaries, setShowSummaries] = useState(false);
  const [activeTab, setActiveTab] = useState<'torneo' | 'documentos' | 'blog' | 'banlist'>('torneo');
  const [computedSummaries, setComputedSummaries] = useState<Record<BanListFormat, FormatSummary[]>>(banlistSummaries);
  const [computedSummaryMonth, setComputedSummaryMonth] = useState<string>(lastUpdateMonth);
  const isPast = isTournamentPast();
  /* const isTodayTournament = isTournamentDay(); */
  const monthYear = getTournamentMonthYear();

  useEffect(() => {
    const formats = Object.values(BanListFormat);

    Promise.all(formats.map(async (format) => {
      const snapshots = await getLatestTwoMonthlyBanlists(format);
      return { format, snapshots };
    }))
      .then((results) => {
        const nextSummaries: Record<BanListFormat, FormatSummary[]> = {
          [BanListFormat.PRIMER_BLOQUE_LIBRE]: banlistSummaries[BanListFormat.PRIMER_BLOQUE_LIBRE],
          [BanListFormat.PRIMER_BLOQUE_EDICION]: banlistSummaries[BanListFormat.PRIMER_BLOQUE_EDICION],
          [BanListFormat.BLOQUE_FURIA_LIBRE]: banlistSummaries[BanListFormat.BLOQUE_FURIA_LIBRE],
          [BanListFormat.BLOQUE_FURIA_LIMITED]: banlistSummaries[BanListFormat.BLOQUE_FURIA_LIMITED],
        };

        const latestByFormat = new Map<BanListFormat, MonthlyBanlistSnapshot>();

        results.forEach(({ format, snapshots }) => {
          if (snapshots.length > 0) {
            latestByFormat.set(format, snapshots[0]);
          }

          if (snapshots.length < 2) {
            return;
          }

          nextSummaries[format] = compareBanlistChanges(snapshots[1].data, snapshots[0].data);
        });

        setComputedSummaries(nextSummaries);

        const defaultLatest = latestByFormat.get(BanListFormat.PRIMER_BLOQUE_LIBRE);
        if (defaultLatest) {
          setComputedSummaryMonth(formatDateFromYearMonth(defaultLatest.year, defaultLatest.month));
        } else {
          setComputedSummaryMonth(lastUpdateMonth);
        }
      })
      .catch((err) => {
        console.error('Error loading dynamic banlist summaries for Home:', err);
        setComputedSummaries(banlistSummaries);
        setComputedSummaryMonth(lastUpdateMonth);
      });
  }, []);

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

        <div className={styles.banlistSection}>
          <div className={styles.banlistHeader}>
            <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {computedSummaryMonth}</h3>
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
              <FormatSummaryRow summaries={computedSummaries} />
              <Link to="/banlist" className={styles.banlistLink}>
                Ver Ban List completa
              </Link>
            </>
          )}
        </div>

        <div className={styles.mainContent}>
          {/* Desktop Layout */}
          <div className={styles.desktopView}>
            <div className={styles.mainContentTop}>
            <div className={styles.mainHeroSection} onClick={() => navigate('/torneo-premier')} style={{ cursor: 'pointer' }}>
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
              
              <div className={styles.formatBadges}>
                {tournamentConfig.formats.map((format) => {
                  const name = format.shortName || format.name;
                  const colorClass = name.startsWith('FX') ? styles.formatBadgeFX
                    : name.startsWith('PB') ? styles.formatBadgePB
                    : styles.formatBadge;
                  return (
                    <Link key={format.name} to={format.link} className={`${styles.formatBadge} ${colorClass}`} onClick={(e) => e.stopPropagation()}>
                      {name}
                    </Link>
                  );
                })}
                <Link to={tournamentConfig.roundType.link} className={`${styles.formatBadge} ${styles.formatBadgeRound}`} onClick={(e) => e.stopPropagation()}>
                  {tournamentConfig.roundType.name}
                </Link>
              </div>

              
              {/* {isTodayTournament && (
                <div className={styles.quickAccess}>
                  <Link to="/fixture" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }} onClick={(e) => e.stopPropagation()}>
                    <FaChartBar className={styles.cardIcon} />
                    <span className={styles.cardText}>Fixture {monthYear}</span>
                    <span className={styles.cardSubtext}>Ver Emparejamientos</span>
                  </Link>
                  <Link to="/standings" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }} onClick={(e) => e.stopPropagation()}>
                    <FaTrophy className={styles.cardIcon} />
                    <span className={styles.cardText}>Standings {monthYear}</span>
                    <span className={styles.cardSubtext}>Ver Tabla de Posiciones</span>
                  </Link>
                </div>
              )} */}
              
            </div>
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

              <div className={styles.mobileHeroSection} onClick={() => navigate('/torneo-premier')} style={{ cursor: 'pointer' }}>
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

                  <div className={styles.formatBadges}>
                    {tournamentConfig.formats.map((format) => {
                      const name = format.shortName || format.name;
                      const colorClass = name.startsWith('FX') ? styles.formatBadgeFX
                        : name.startsWith('PB') ? styles.formatBadgePB
                        : styles.formatBadge;
                      return (
                        <Link key={format.name} to={format.link} className={`${styles.formatBadge} ${colorClass}`} onClick={(e) => e.stopPropagation()}>
                          {name}
                        </Link>
                      );
                    })}
                    <Link to={tournamentConfig.roundType.link} className={`${styles.formatBadge} ${styles.formatBadgeRound}`} onClick={(e) => e.stopPropagation()}>
                      {tournamentConfig.roundType.name}
                    </Link>
                  </div>

                  {/* {isTodayTournament && (
                    <div className={styles.quickAccess}>
                      <Link to="/fixture" className={styles.quickCard} style={{ backgroundColor: 'var(--sage-green)' }} onClick={(e) => e.stopPropagation()}>
                        <FaChartBar className={styles.cardIcon} />
                        <span className={styles.cardText}>Fixture {monthYear}</span>
                        <span className={styles.cardSubtext}>Ver Emparejamientos</span>
                      </Link>
                      <Link to="/standings" className={styles.quickCard} style={{ backgroundColor: 'var(--petrol-blue)' }} onClick={(e) => e.stopPropagation()}>
                        <FaTrophy className={styles.cardIcon} />
                        <span className={styles.cardText}>Standings {monthYear}</span>
                        <span className={styles.cardSubtext}>Ver Tabla de Posiciones</span>
                      </Link>
                    </div>
                  )} */}
                </div>
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
                <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {computedSummaryMonth}</h3>
              </div>
              <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
              <FormatSummaryRow summaries={computedSummaries} />
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

