import { useEffect, useRef, useState } from 'react';
import { FaChevronUp } from 'react-icons/fa';
import styles from './ReworkFilters.module.css';

const CARD_TYPES = ['Aliado', 'Arma', 'Totem', 'Talisman', 'Oro'];

export interface ReworkFilterParams {
  q: string | null;
  type: string | null;
}

interface ReworkFiltersProps {
  onFilterChange: (params: ReworkFilterParams) => void;
  initialSearch?: string | null;
  initialType?: string | null;
  defaultCollapsed?: boolean;
}

export default function ReworkFilters({
  onFilterChange,
  initialSearch,
  initialType,
  defaultCollapsed = false,
}: ReworkFiltersProps) {
  const [search, setSearch] = useState(initialSearch || '');
  const [type, setType] = useState(initialType || '');
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isStuck, setIsStuck] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const appliedInitialRef = useRef(false);

  const applyFilters = (s: string, t: string) => {
    onFilterChange({
      q: s.trim() || null,
      type: t || null,
    });
  };

  useEffect(() => {
    if (appliedInitialRef.current) return;
    appliedInitialRef.current = true;
    applyFilters(search, type);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const headerOffset = 70;
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const rect = panel.getBoundingClientRect();
      setIsStuck(rect.top <= headerOffset + 1 && rect.bottom > headerOffset + 1);
    };

    const scheduleUpdate = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    applyFilters(val, type);
  };

  const handleTypeClick = (val: string) => {
    const newType = type === val ? '' : val;
    setType(newType);
    applyFilters(search, newType);
  };

  const handleClear = () => {
    setSearch('');
    setType('');
    applyFilters('', '');
  };

  const hasFilters = !!(search.trim() || type);

  return (
    <aside
      ref={panelRef}
      className={`${styles.panel} ${isStuck ? styles.panelStuck : ''}`}
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Filtros</span>
        <div className={styles.panelActions}>
          {hasFilters && (
            <button type="button" className={styles.clearButton} onClick={handleClear}>
              Limpiar
            </button>
          )}
          <button
            type="button"
            className={`${styles.chevronButton} ${collapsed ? styles.chevronCollapsed : ''}`}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir filtros' : 'Colapsar filtros'}
          >
            <FaChevronUp className={styles.chevronIcon} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`${styles.panelBody} ${collapsed ? styles.panelBodyCollapsed : ''}`}>
        <div className={`${styles.section} ${styles.fieldSearch}`}>
          <label className={styles.label} htmlFor="rework-search">Buscar</label>
          <input
            id="rework-search"
            type="search"
            className={styles.searchInput}
            placeholder="Nombre o código..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className={`${styles.section} ${styles.fieldType}`}>
          <span className={styles.label}>Tipo</span>
          <div className={styles.typeButtons}>
            {CARD_TYPES.map((cardType) => (
              <button
                key={cardType}
                type="button"
                className={`${styles.typeButton} ${type === cardType ? styles.typeButtonActive : ''}`}
                onClick={() => handleTypeClick(cardType)}
              >
                {cardType}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
