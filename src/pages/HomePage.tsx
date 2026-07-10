import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImportantDocumentsCard from '../components/ImportantDocumentsCard';
import FormatSummaryRow from '../components/FormatSummaryRow';
import FormatBanner from '../components/FormatBanner';
import { FaBook, FaGavel } from 'react-icons/fa';
import { BanListCard, BanListData, BanListFormat } from '../types/banlist';
import { getLatestTwoMonthlyBanlists, MonthlyBanlistSnapshot } from '../services/monthlyBanlistService';
import { banlistSummaries, lastUpdateMonth } from '../data/banlistSummary';
import { ChangeType, FormatSummary } from '../data/banlistSummary';
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

    const banListCard = currEntry?.card ?? prevEntry?.card;

    changes.push({
      card: banListCard?.name ?? nameKey,
      pastMonth: getRestrictionLabel(prevEntry?.status),
      currentMonth: getRestrictionLabel(currEntry?.status),
      changeType,
      imageUrl: currEntry?.card.imageUrl || prevEntry?.card.imageUrl,
      cardId: banListCard?.id,
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
  const [activeTab, setActiveTab] = useState<'documentos' | 'banlist'>('documentos');
  const [computedSummaries, setComputedSummaries] = useState<Record<BanListFormat, FormatSummary[]>>(banlistSummaries);
  const [computedSummaryMonth, setComputedSummaryMonth] = useState<string>(lastUpdateMonth);

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
          [BanListFormat.BLOQUE_FURIA_RAGNAROK]: banlistSummaries[BanListFormat.BLOQUE_FURIA_RAGNAROK],
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
      <div className={styles.pageLayout}>
        <div className={styles.bannerSection}>
          <FormatBanner />
        </div>

        <div className={styles.mobileTabsContainer}>
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
        </div>

        <div className={styles.mainContent}>
          <div className={styles.desktopView}>
            <div className={styles.banlistSection}>
              <div className={styles.banlistHeader}>
                <h3 className={styles.banlistTitle}>Resumen Actualización Ban List {computedSummaryMonth}</h3>
              </div>
              <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
              <FormatSummaryRow summaries={computedSummaries} />
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

