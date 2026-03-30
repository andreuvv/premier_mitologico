import { useState } from 'react';
import { CollectionCard } from '../types/collection';
import styles from './EditionSidebar.module.css';

interface PBEditionSidebarProps {
  cards: CollectionCard[];
  onFilterChange: (data: { cards: CollectionCard[], filterLabel: string | null }) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface FilterState {
  edition: string | null;
}

export default function PBEditionSidebar({ cards, onFilterChange, isOpen = true, onClose: _onClose }: PBEditionSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({ edition: null });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ediciones']));

  // Extract unique editions using edition.name as key
  const editions = Array.from(
    new Map(
      cards
        .filter(card => card.edition && card.edition.name)
        .map(card => [card.edition!.name, card.edition!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setExpandedSections(newSections);
  };

  const handleEditionClick = (editionName: string) => {
    const newFilters = {
      edition: filters.edition === editionName ? null : editionName
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters: FilterState) => {
    let filtered = cards;
    let filterLabel: string | null = null;

    if (newFilters.edition) {
      filtered = filtered.filter(card => card.edition?.name === newFilters.edition);
      filterLabel = newFilters.edition;
    }

    onFilterChange({ cards: filtered, filterLabel });
  };

  const clearFilters = () => {
    setFilters({ edition: null });
    onFilterChange({ cards, filterLabel: null });
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <h3>Filtros</h3>
        {filters.edition && (
          <button className={styles.clearButton} onClick={clearFilters}>
            Limpiar
          </button>
        )}
      </div>

      <div className={styles.section}>
        <button 
          className={styles.sectionHeader}
          onClick={() => toggleSection('ediciones')}
        >
          <span>Ediciones</span>
          <span className={styles.chevron}>
            {expandedSections.has('ediciones') ? '▾' : '▸'}
          </span>
        </button>
        {expandedSections.has('ediciones') && (
          <div className={styles.sectionContent}>
            {editions.length === 0 ? (
              <div className={styles.noItems}>No hay ediciones</div>
            ) : (
              editions.map(edition => (
                <button
                  key={edition.name}
                  className={`${styles.item} ${filters.edition === edition.name ? styles.active : ''}`}
                  onClick={() => handleEditionClick(edition.name)}
                >
                  {edition.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
