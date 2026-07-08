import { useEffect, useRef, useState } from 'react';
import styles from './ReworkFilters.module.css';

const CARD_TYPES = ['Aliado', 'Arma', 'Totem', 'Talisman', 'Oro'];

export interface ReworkFilterParams {
  q: string | null;
  type: string | null;
}

interface ReworkFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange: (params: ReworkFilterParams) => void;
  initialSearch?: string | null;
  initialType?: string | null;
}

export default function ReworkFilters({
  isOpen,
  onClose,
  onFilterChange,
  initialSearch,
  initialType,
}: ReworkFiltersProps) {
  const [search, setSearch] = useState(initialSearch || '');
  const [type, setType] = useState(initialType || '');
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

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} aria-hidden="true" />}

      <aside className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Filtros</span>
          <div className={styles.panelActions}>
            <button type="button" className={styles.clearButton} onClick={handleClear}>
              Limpiar
            </button>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Cerrar filtros"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={styles.panelBody}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="rework-search">Nombre o código</label>
            <input
              id="rework-search"
              type="search"
              className={styles.input}
              placeholder="Buscar carta..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Tipo</span>
            <div className={styles.typeButtons}>
              {CARD_TYPES.map((cardType) => (
                <button
                  key={cardType}
                  type="button"
                  className={`${styles.typeBtn} ${type === cardType ? styles.typeBtnActive : ''}`}
                  onClick={() => handleTypeClick(cardType)}
                >
                  {cardType}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
