import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import { BanListFormat, BanListCategory, BanListData, BanListCard } from '../types/banlist';
import { CollectionFormat } from '../types/collection';
import { loadBanlist } from '../services/banlistService';
import { useAuth } from '../hooks/useAuth';
import { getLatestTwoMonthlyBanlists, isCurrentUserBanlistAdmin, MonthlyBanlistSnapshot } from '../services/monthlyBanlistService';
import BanlistEditorModal from '../components/BanlistEditorModal';
import FormatSummaryRow from '../components/FormatSummaryRow';
import SectionLoader from '../components/loading/SectionLoader';
import { banlistSummaries, ChangeType, FormatSummary, lastUpdateMonth } from '../data/banlistSummary';
import styles from './BanlistPage.module.css';

const formatToSlug: Record<BanListFormat, string> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: 'pb-libre',
  [BanListFormat.PRIMER_BLOQUE_EDICION]: 'pb-edition',
  [BanListFormat.BLOQUE_FURIA_LIBRE]: 'bf-libre',
  [BanListFormat.BLOQUE_FURIA_RAGNAROK]: 'bf-ragnarok',
};

const slugToFormat = Object.entries(formatToSlug).reduce((acc, [format, slug]) => {
  acc[slug] = format as BanListFormat;
  return acc;
}, {} as Record<string, BanListFormat>);

const categoryToSlug: Record<BanListCategory, string> = {
  [BanListCategory.BANNED]: 'baneadas',
  [BanListCategory.LIMITED_X1]: 'limitadas-x1',
  [BanListCategory.LIMITED_X2]: 'limitadas-x2',
};

const slugToCategory = Object.entries(categoryToSlug).reduce((acc, [category, slug]) => {
  acc[slug] = category as BanListCategory;
  return acc;
}, {} as Record<string, BanListCategory>);

const getCollectionFormatFromBanListFormat = (banListFormat: BanListFormat): string => {
  if (banListFormat === BanListFormat.PRIMER_BLOQUE_LIBRE || banListFormat === BanListFormat.PRIMER_BLOQUE_EDICION) {
    return CollectionFormat.PRIMER_BLOQUE;
  }
  return CollectionFormat.FURIA_EXTENDIDO;
};

const getCardIdFromUrl = (cardUrl?: string): number | null => {
  if (!cardUrl) return null;
  const match = cardUrl.match(/\/card\/(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
};

const getCardSlugFromUrl = (cardUrl?: string): string | null => {
  if (!cardUrl) return null;
  const match = cardUrl.match(/\/card\/\d+\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
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
      // Any restriction -> liberated should always be positive.
      changeType = 'positive';
    } else if (currEntry.status === 'banned') {
      // Any level -> banned should always be negative.
      changeType = 'negative';
    } else if (!prevEntry && currEntry.status === 'limitedX2') {
      // Neutral only for liberated -> limited x2.
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

const BanlistPage = () => {
  const { format: formatSlug, category: categorySlug } = useParams<{ format?: string; category?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedFormat, setSelectedFormat] = useState<BanListFormat>(
    formatSlug && slugToFormat[formatSlug] ? slugToFormat[formatSlug] : BanListFormat.PRIMER_BLOQUE_LIBRE
  );
  const [selectedCategory, setSelectedCategory] = useState<BanListCategory>(
    categorySlug && slugToCategory[categorySlug] ? slugToCategory[categorySlug] : BanListCategory.BANNED
  );
  const [banlistData, setBanlistData] = useState<BanListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showAccordion, setShowAccordion] = useState(false);
  const [computedSummaries, setComputedSummaries] = useState<Record<BanListFormat, FormatSummary[]>>(banlistSummaries);
  const [computedSummaryMonth, setComputedSummaryMonth] = useState<string>(lastUpdateMonth);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    isCurrentUserBanlistAdmin(user.id)
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadBanlist(selectedFormat)
      .then(data => {
        setBanlistData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading banlist:', err);
        setLoading(false);
      });
  }, [selectedFormat, refreshKey]);

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

        const selectedLatest = latestByFormat.get(selectedFormat);
        if (selectedLatest) {
          setComputedSummaryMonth(formatDateFromYearMonth(selectedLatest.year, selectedLatest.month));
        } else {
          setComputedSummaryMonth(lastUpdateMonth);
        }
      })
      .catch((err) => {
        console.error('Error loading dynamic banlist summaries:', err);
        setComputedSummaries(banlistSummaries);
        setComputedSummaryMonth(lastUpdateMonth);
      });
  }, [refreshKey, selectedFormat]);

  const getFormatLabel = (format: BanListFormat): string => {
    switch (format) {
      case BanListFormat.PRIMER_BLOQUE_LIBRE:
        return 'Primer Bloque Racial Libre';
      case BanListFormat.PRIMER_BLOQUE_EDICION:
        return 'Primer Bloque Racial Edición';
      case BanListFormat.BLOQUE_FURIA_LIBRE:
        return 'Furia Extendido Racial Libre';
      case BanListFormat.BLOQUE_FURIA_RAGNAROK:
        return 'Furia Extendido Racial Ragnarok';
    }
  };

  const getCategoryLabel = (category: BanListCategory): string => {
    switch (category) {
      case BanListCategory.BANNED:
        return 'Baneadas';
      case BanListCategory.LIMITED_X1:
        return 'Limitadas x1';
      case BanListCategory.LIMITED_X2:
        return 'Limitadas x2';
    }
  };

  const getCurrentCards = (): BanListCard[] => {
    if (!banlistData) return [];
    switch (selectedCategory) {
      case BanListCategory.BANNED:
        return banlistData.banned;
      case BanListCategory.LIMITED_X1:
        return banlistData.limitedX1;
      case BanListCategory.LIMITED_X2:
        return banlistData.limitedX2;
    }
  };

  const handleCardClick = (card: BanListCard) => {
    const cardId = card.id || getCardIdFromUrl(card.cardUrl);
    const cardSlug = getCardSlugFromUrl(card.cardUrl);
    if (!cardId || !cardSlug) {
      console.warn('No card ID or slug found');
      return;
    }
    const collectionFormat = getCollectionFormatFromBanListFormat(selectedFormat);
    navigate(`/coleccion/carta/${collectionFormat}/${cardId}/${cardSlug}`);
  };

  const cards = getCurrentCards();

  return (
    <div className={styles.container}>
      <div className={styles.accordion}>
        <button 
          className={styles.accordionHeader} 
          onClick={() => setShowAccordion(!showAccordion)}
        >
          <span>Resumen actualización {computedSummaryMonth}</span>
          <span className={styles.accordionChevron}>{showAccordion ? '▾' : '▸'}</span>
        </button>
        {showAccordion && (
          <div className={styles.accordionBody}>
            <p className={styles.disclaimer}>Cartas no mencionadas mantienen restricciones del mes anterior</p>
            <FormatSummaryRow summaries={computedSummaries} />
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.formatSelector}>
          <label>Formato:</label>
          <select 
            value={selectedFormat} 
            onChange={(e) => {
              const newFormat = e.target.value as BanListFormat;
              setSelectedFormat(newFormat);
              const formatSlug = formatToSlug[newFormat];
              const categorySlug = categoryToSlug[selectedCategory];
              navigate(`/banlist/${formatSlug}/${categorySlug}`);
            }}
          >
            {Object.values(BanListFormat).map(format => (
              <option key={format} value={format}>
                {getFormatLabel(format)}
              </option>
            ))}
          </select>
          {isAdmin && (
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setShowEditor(true)}
            >
              Editar formato actual
            </button>
          )}
          {banlistData && (
            <div className={styles.lastUpdatedWrapper}>
              <p className={styles.lastUpdated}>
                Última actualización: {getMonthYearLabel(banlistData.lastUpdated)}
              </p>
              <div className={styles.infoIconContainer}>
                <FaInfoCircle 
                  className={styles.infoIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoPopup(!showInfoPopup);
                  }}
                />
                <div className={styles.tooltip}>
                   Información importante de las restricciones.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.categoryTabs}>
          {Object.values(BanListCategory).map(category => (
            <button
              key={category}
              className={selectedCategory === category ? styles.activeTab : ''}
              onClick={() => {
                setSelectedCategory(category);
                const formatSlug = formatToSlug[selectedFormat];
                const categorySlug = categoryToSlug[category];
                navigate(`/banlist/${formatSlug}/${categorySlug}`);
              }}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SectionLoader message="Cargando lista..." />
      ) : (
        <div className={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div 
              key={index} 
              className={styles.card}
              onClick={() => handleCardClick(card)}
              style={{ cursor: 'pointer' }}
            >
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} />
              ) : (
                <div className={styles.placeholder}>Sin imagen</div>
              )}
              <div className={styles.cardInfo}>
                <h3>{card.name}</h3>
                <p>{card.type}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInfoPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowInfoPopup(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>Información de Banlist</h3>
              <button onClick={() => setShowInfoPopup(false)}>×</button>
            </div>
            <div className={styles.popupContent}>
              <p><strong>Para todos los formatos, no se pueden incluir en el mazo:</strong></p>
              <ul>
                <li>Las cartas de Aliado sin raza</li>
                <li>Las cartas con "SP" en su nombre</li>
              </ul>
              <p> </p>
              <p><strong>Agregando a lo de arriba, en Primer Bloque, no se pueden incluir en el mazo:</strong></p>
              <ul>
                <li>Las cartas con ★ en su nombre</li>
              </ul>
              <p> </p>
              <p>Las imágenes usadas son referenciales y pueden o no corresponder a la última versión impresa de la carta.</p>
              <p>Las restricciones en esta página aplican a cualquier versión de la carta.</p>
            </div>
          </div>
        </div>
      )}

      {showEditor && banlistData && (
        <BanlistEditorModal
          format={selectedFormat}
          initialCategory={selectedCategory}
          baseData={banlistData}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

export default BanlistPage;
