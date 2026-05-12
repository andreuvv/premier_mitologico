import { useEffect, useMemo, useState } from 'react';
import { BanListCard, BanListCategory, BanListData, BanListFormat } from '../types/banlist';
import { CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import { getMonthlyBanlistByMonth, upsertMonthlyBanlist } from '../services/monthlyBanlistService';
import styles from './BanlistEditorModal.module.css';

type Props = {
  format: BanListFormat;
  initialCategory: BanListCategory;
  baseData: BanListData;
  onClose: () => void;
  onSaved: () => void;
};

const getCollectionFormat = (format: BanListFormat): CollectionFormat => {
  if (format === BanListFormat.PRIMER_BLOQUE_LIBRE || format === BanListFormat.PRIMER_BLOQUE_EDICION) {
    return CollectionFormat.PRIMER_BLOQUE;
  }
  return CollectionFormat.FURIA_EXTENDIDO;
};

const getMonthLabel = (month: number): string => {
  const labels = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return labels[month - 1] ?? String(month);
};

const getPreviousMonth = (year: number, month: number): { year: number; month: number } => {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
};

const mergeWithoutDuplicates = (list: BanListCard[], newCard: BanListCard): BanListCard[] => {
  const exists = list.some(card => card.id === newCard.id || card.name.toLowerCase() === newCard.name.toLowerCase());
  if (exists) {
    return list;
  }
  return [...list, newCard];
};

export default function BanlistEditorModal({ format, initialCategory, baseData, onClose, onSaved }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [banned, setBanned] = useState<BanListCard[]>(baseData.banned);
  const [limitedX1, setLimitedX1] = useState<BanListCard[]>(baseData.limitedX1);
  const [limitedX2, setLimitedX2] = useState<BanListCard[]>(baseData.limitedX2);

  const [selectedCategory, setSelectedCategory] = useState<BanListCategory>(initialCategory);
  const [search, setSearch] = useState('');
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingPreviousMonth, setLoadingPreviousMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverPreviewImage, setHoverPreviewImage] = useState<string | null>(null);
  const [previousMonthData, setPreviousMonthData] = useState<BanListData | null>(null);

  const previousMonth = useMemo(() => getPreviousMonth(year, month), [year, month]);

  const formatLabel = useMemo(() => {
    switch (format) {
      case BanListFormat.PRIMER_BLOQUE_LIBRE:
        return 'Primer Bloque Racial Libre';
      case BanListFormat.PRIMER_BLOQUE_EDICION:
        return 'Primer Bloque Racial Edición';
      case BanListFormat.BLOQUE_FURIA_LIBRE:
        return 'Furia Extendido Racial Libre';
      case BanListFormat.BLOQUE_FURIA_LIMITED:
        return 'Furia Extendido Racial Limitado';
      default:
        return format;
    }
  }, [format]);

  useEffect(() => {
    setLoadingCards(true);
    loadCollectionCards(getCollectionFormat(format))
      .then(data => setAllCards(data.data.CardCatalog.cards))
      .catch(err => {
        console.error('Error loading card catalog:', err);
        setError('No se pudo cargar el catálogo de cartas.');
      })
      .finally(() => setLoadingCards(false));
  }, [format]);

  useEffect(() => {
    setLoadingMonth(true);
    getMonthlyBanlistByMonth(format, year, month)
      .then(data => {
        if (!data) {
          setBanned([]);
          setLimitedX1([]);
          setLimitedX2([]);
          return;
        }
        setBanned(data.banned);
        setLimitedX1(data.limitedX1);
        setLimitedX2(data.limitedX2);
      })
      .finally(() => setLoadingMonth(false));
  }, [format, year, month]);

  useEffect(() => {
    setLoadingPreviousMonth(true);
    getMonthlyBanlistByMonth(format, previousMonth.year, previousMonth.month)
      .then(data => setPreviousMonthData(data))
      .catch(err => {
        console.error('Error loading previous monthly banlist:', err);
        setPreviousMonthData(null);
      })
      .finally(() => setLoadingPreviousMonth(false));
  }, [format, previousMonth.year, previousMonth.month]);

  const cardsInBanlist = useMemo(() => {
    const ids = new Set<number>();
    const names = new Set<string>();
    [...banned, ...limitedX1, ...limitedX2].forEach(card => {
      if (card.id) ids.add(card.id);
      names.add(card.name.toLowerCase());
    });
    return { ids, names };
  }, [banned, limitedX1, limitedX2]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];

    return allCards
      .filter(card => card.name.toLowerCase().includes(q))
      .filter(card => !cardsInBanlist.ids.has(card.id) && !cardsInBanlist.names.has(card.name.toLowerCase()))
      .slice(0, 30);
  }, [allCards, cardsInBanlist, search]);

  const handleAddCard = (card: CollectionCard) => {
    setHoverPreviewImage(null);
    setSearch('');

    const banlistCard: BanListCard = {
      id: card.id,
      name: card.name,
      type: card.type,
      imageUrl: card.imageUrl,
      cardUrl: `https://mazos.cl/card/${card.id}/${card.slug}`,
    };

    if (selectedCategory === BanListCategory.BANNED) {
      setBanned(prev => mergeWithoutDuplicates(prev, banlistCard));
      return;
    }

    if (selectedCategory === BanListCategory.LIMITED_X1) {
      setLimitedX1(prev => mergeWithoutDuplicates(prev, banlistCard));
      return;
    }

    setLimitedX2(prev => mergeWithoutDuplicates(prev, banlistCard));
  };

  const handleKeepPreviousMonthList = () => {
    if (!previousMonthData) return;

    setError(null);
    setHoverPreviewImage(null);
    setSearch('');
    setBanned(previousMonthData.banned);
    setLimitedX1(previousMonthData.limitedX1);
    setLimitedX2(previousMonthData.limitedX2);
  };

  const removeCard = (category: BanListCategory, cardName: string) => {
    if (category === BanListCategory.BANNED) {
      setBanned(prev => prev.filter(card => card.name !== cardName));
      return;
    }

    if (category === BanListCategory.LIMITED_X1) {
      setLimitedX1(prev => prev.filter(card => card.name !== cardName));
      return;
    }

    setLimitedX2(prev => prev.filter(card => card.name !== cardName));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload: BanListData = {
      format,
      lastUpdated: `${year}-${String(month).padStart(2, '0')}-01`,
      banned,
      limitedX1,
      limitedX2,
    };

    const result = await upsertMonthlyBanlist(format, year, month, payload);

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo guardar la banlist.');
      return;
    }

    onSaved();
  };

  const Section = ({ title, cards, category }: { title: string; cards: BanListCard[]; category: BanListCategory }) => (
    <div className={styles.section}>
      <h4>{title} ({cards.length})</h4>
      {cards.length === 0 ? (
        <p className={styles.empty}>Sin cartas</p>
      ) : (
        <ul className={styles.cardList}>
          {cards.map(card => (
            <li key={card.id ?? card.name}>
              <span>{card.name}</span>
              <button type="button" onClick={() => removeCard(category, card.name)}>Quitar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Editar banlist mensual: {formatLabel}</h3>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <div className={styles.monthControls}>
          <label>
            Año
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2024} max={2100} />
          </label>
          <label>
            Mes
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{getMonthLabel(m)}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={styles.keepPreviousButton}
            onClick={handleKeepPreviousMonthList}
            disabled={loadingPreviousMonth || !previousMonthData}
          >
            {loadingPreviousMonth
              ? 'Cargando lista anterior...'
              : previousMonthData
                ? `Mantener lista de ${getMonthLabel(previousMonth.month)} ${previousMonth.year}`
                : 'No hay lista anterior'}
          </button>
          {loadingMonth && <p className={styles.helper}>Cargando datos del mes...</p>}
        </div>

        <div className={styles.searchArea}>
          <div className={styles.statusRow}>
            <span>Estado al agregar:</span>
            <button
              type="button"
              className={selectedCategory === BanListCategory.BANNED ? styles.activeStatus : ''}
              onClick={() => setSelectedCategory(BanListCategory.BANNED)}
            >
              Baneadas
            </button>
            <button
              type="button"
              className={selectedCategory === BanListCategory.LIMITED_X1 ? styles.activeStatus : ''}
              onClick={() => setSelectedCategory(BanListCategory.LIMITED_X1)}
            >
              Limitadas x1
            </button>
            <button
              type="button"
              className={selectedCategory === BanListCategory.LIMITED_X2 ? styles.activeStatus : ''}
              onClick={() => setSelectedCategory(BanListCategory.LIMITED_X2)}
            >
              Limitadas x2
            </button>
          </div>

          <input
            type="text"
            placeholder={loadingCards ? 'Cargando catálogo...' : 'Buscar carta por nombre'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHoverPreviewImage(null);
            }}
            disabled={loadingCards}
          />

          {search.trim() && (
            <div className={styles.results}>
              {filteredCards.length === 0 ? (
                <p className={styles.empty}>No hay resultados disponibles</p>
              ) : (
                filteredCards.map(card => (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => handleAddCard(card)}
                    className={styles.resultItem}
                    onMouseEnter={() => setHoverPreviewImage(card.imageUrl)}
                    onMouseLeave={() => setHoverPreviewImage(null)}
                  >
                    <div className={styles.resultCardInfo}>
                      <img src={card.imageUrl} alt={card.name} className={styles.resultCardImage} loading="lazy" />
                      <div className={styles.resultCardText}>
                        <span>{card.name}</span>
                        <small>{card.type}</small>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {hoverPreviewImage && (
            <div className={styles.hoverPreview}>
              <img src={hoverPreviewImage} alt="Vista previa carta" />
            </div>
          )}
        </div>

        <div className={styles.sections}>
          <Section title="Baneadas" cards={banned} category={BanListCategory.BANNED} />
          <Section title="Limitadas x1" cards={limitedX1} category={BanListCategory.LIMITED_X1} />
          <Section title="Limitadas x2" cards={limitedX2} category={BanListCategory.LIMITED_X2} />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancel}>Cancelar</button>
          <button type="button" onClick={handleSave} className={styles.save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar banlist'}
          </button>
        </div>
      </div>
    </div>
  );
}
