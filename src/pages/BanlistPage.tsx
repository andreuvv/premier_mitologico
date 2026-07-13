import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaList, FaImages } from 'react-icons/fa';
import { BanListFormat, BanListCategory, BanListData, BanListCard } from '../types/banlist';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadBanlist } from '../services/banlistService';
import { loadCollectionCards } from '../services/collectionService';
import { useAuth } from '../hooks/useAuth';
import { getLatestTwoMonthlyBanlists, isCurrentUserBanlistAdmin, MonthlyBanlistSnapshot } from '../services/monthlyBanlistService';
import BanlistEditorModal from '../components/BanlistEditorModal';
import FormatSummaryRow from '../components/FormatSummaryRow';
import BanlistMarqueeCarousel from '../components/BanlistMarqueeCarousel';
import CardDetailModal from '../components/CardDetailModal';
import SectionLoader from '../components/loading/SectionLoader';
import { banlistSummaries, ChangeType, FormatSummary, lastUpdateMonth } from '../data/banlistSummary';
import styles from './BanlistPage.module.css';

type ViewMode = 'carousel' | 'grid';

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

const FORMAT_TABS: {
  format: BanListFormat;
  label: string;
  labelLine1: string;
  labelLine2: string;
  isPb: boolean;
}[] = [
  {
    format: BanListFormat.PRIMER_BLOQUE_EDICION,
    label: 'Primer Bloque Racial Edición',
    labelLine1: 'PB Racial',
    labelLine2: 'Edición',
    isPb: true,
  },
  {
    format: BanListFormat.PRIMER_BLOQUE_LIBRE,
    label: 'Primer Bloque Racial Libre',
    labelLine1: 'PB Racial',
    labelLine2: 'Libre',
    isPb: true,
  },
  {
    format: BanListFormat.BLOQUE_FURIA_LIBRE,
    label: 'Furia Extendido Racial Libre',
    labelLine1: 'FX Racial',
    labelLine2: 'Libre',
    isPb: false,
  },
  {
    format: BanListFormat.BLOQUE_FURIA_RAGNAROK,
    label: 'Furia Extendido Racial Ragnarok',
    labelLine1: 'FX Racial',
    labelLine2: 'Ragnarok',
    isPb: false,
  },
];

const CATEGORY_SECTIONS: {
  category: BanListCategory;
  label: string;
  key: keyof Pick<BanListData, 'banned' | 'limitedX1' | 'limitedX2'>;
  panelClass: string;
}[] = [
  { category: BanListCategory.BANNED, label: 'Baneadas', key: 'banned', panelClass: 'categoryPanelBanned' },
  { category: BanListCategory.LIMITED_X1, label: 'Limitadas x1', key: 'limitedX1', panelClass: 'categoryPanelLimitedX1' },
  { category: BanListCategory.LIMITED_X2, label: 'Limitadas x2', key: 'limitedX2', panelClass: 'categoryPanelLimitedX2' },
];

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

const BanlistPage = () => {
  const { format: formatSlug } = useParams<{ format?: string; category?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedFormat, setSelectedFormat] = useState<BanListFormat>(
    formatSlug && slugToFormat[formatSlug] ? slugToFormat[formatSlug] : BanListFormat.PRIMER_BLOQUE_EDICION,
  );
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [banlistData, setBanlistData] = useState<BanListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showAccordion, setShowAccordion] = useState(false);
  const [computedSummaries, setComputedSummaries] = useState<Record<BanListFormat, FormatSummary[]>>(banlistSummaries);
  const [computedSummaryMonth, setComputedSummaryMonth] = useState<string>(lastUpdateMonth);
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [modalCards, setModalCards] = useState<CollectionCard[]>([]);

  const cardsById = useMemo(
    () => new Map(allCards.map((card) => [card.id, card])),
    [allCards],
  );

  const cardsByName = useMemo(() => {
    const map = new Map<string, CollectionCard>();
    allCards.forEach((card) => {
      map.set(card.name.toLowerCase(), card);
    });
    return map;
  }, [allCards]);

  const resolveCollectionCard = useCallback(
    (card: BanListCard): CollectionCard | null => {
      if (card.id) {
        const byId = cardsById.get(card.id);
        if (byId) return byId;
      }

      const byName = cardsByName.get(card.name.toLowerCase());
      if (byName) return byName;

      if (card.imageUrl) {
        const byImage = allCards.find((collectionCard) => collectionCard.imageUrl === card.imageUrl);
        if (byImage) return byImage;
      }

      return null;
    },
    [allCards, cardsById, cardsByName],
  );

  useEffect(() => {
    if (formatSlug && slugToFormat[formatSlug]) {
      setSelectedFormat(slugToFormat[formatSlug]);
    }
  }, [formatSlug]);

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
    let cancelled = false;

    Promise.all([
      loadCollectionCards(CollectionFormat.PRIMER_BLOQUE),
      loadCollectionCards(CollectionFormat.FURIA_EXTENDIDO),
    ])
      .then(([pbCatalog, fxCatalog]) => {
        if (cancelled) return;
        setAllCards([
          ...pbCatalog.data.CardCatalog.cards,
          ...fxCatalog.data.CardCatalog.cards,
        ]);
      })
      .catch((error) => {
        console.error('Error loading collection cards for banlist page:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleFormatChange = (format: BanListFormat) => {
    setSelectedFormat(format);
    navigate(`/banlist/${formatToSlug[format]}`);
  };

  const handleCardClick = (card: BanListCard, sectionCards: BanListCard[]) => {
    const resolved = resolveCollectionCard(card);
    if (!resolved) return;

    const resolvedSectionCards = sectionCards
      .map((sectionCard) => resolveCollectionCard(sectionCard))
      .filter((sectionResolved): sectionResolved is CollectionCard => sectionResolved !== null);

    setModalCards(resolvedSectionCards);
    setSelectedCard(resolved);
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
    setModalCards([]);
  };

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
            <FormatSummaryRow summaries={computedSummaries} />
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.formatTabs}>
          {FORMAT_TABS.map(({ format, label, labelLine1, labelLine2, isPb }) => (
            <button
              key={format}
              type="button"
              className={`${styles.formatTab} ${selectedFormat === format ? styles.formatTabActive : ''} ${selectedFormat === format ? (isPb ? styles.formatTabPb : styles.formatTabFx) : ''}`}
              onClick={() => handleFormatChange(format)}
              aria-label={label}
            >
              <span className={styles.formatTabLabelDesktop}>{label}</span>
              <span className={styles.formatTabLabelMobile}>
                <span>{labelLine1}</span>
                <span>{labelLine2}</span>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.metaRow}>
          {banlistData && (
            <div className={styles.lastUpdatedWrapper}>
              <p className={styles.lastUpdated}>
                Última actualización: {getMonthYearLabel(banlistData.lastUpdated)}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => setShowEditor(true)}
                >
                  Editar formato actual
                </button>
              )}
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

          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewToggleButton} ${viewMode === 'carousel' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('carousel')}
              aria-pressed={viewMode === 'carousel'}
              aria-label="Vista carrusel"
              title="Vista carrusel"
            >
              <FaImages />
            </button>
            <button
              type="button"
              className={`${styles.viewToggleButton} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Vista grilla"
              title="Vista grilla"
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SectionLoader message="Cargando lista..." />
      ) : banlistData ? (
        <div className={styles.categoriesContainer}>
          {CATEGORY_SECTIONS.map(({ label, key, panelClass }) => {
            const sectionCards = banlistData[key];
            const panelStyleClass = styles[panelClass as keyof typeof styles];

            return (
              <section key={key} className={styles.categorySection}>
                <div className={`${styles.categoryPanel} ${panelStyleClass}`}>
                  <h3 className={styles.categoryTitle}>{label}</h3>
                  {viewMode === 'carousel' ? (
                    <BanlistMarqueeCarousel
                      cards={sectionCards}
                      onCardClick={(card) => handleCardClick(card, sectionCards)}
                    />
                  ) : (
                    <div className={styles.cardsGrid}>
                      {sectionCards.length === 0 ? (
                        <p className={styles.emptySection}>Sin cartas</p>
                      ) : (
                        sectionCards.map((card, index) => (
                          <button
                            key={`${card.name}-${index}`}
                            type="button"
                            className={styles.gridCard}
                            onClick={() => handleCardClick(card, sectionCards)}
                            aria-label={`Ver detalle de ${card.name}`}
                          >
                            {card.imageUrl ? (
                              <img src={card.imageUrl} alt={card.name} />
                            ) : (
                              <div className={styles.placeholder}>Sin imagen</div>
                            )}
                            <span className={styles.gridCardName}>{card.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

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
          initialCategory={BanListCategory.BANNED}
          baseData={banlistData}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          cards={modalCards.length > 1 ? modalCards : undefined}
          onNavigate={modalCards.length > 1 ? setSelectedCard : undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default BanlistPage;
