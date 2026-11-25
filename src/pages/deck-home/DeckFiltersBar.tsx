import type { ReactNode } from 'react';
import type { DeckFilters } from './useDeckFilters';
import type { FormatFilter, SubformatFilter } from './deckHomeUtils';
import styles from '../DeckBuilderHomePage.module.css';

const FORMAT_CHIPS: { value: FormatFilter; label: string; className: string }[] = [
  { value: 'all', label: 'Todos', className: styles.filterChipAll },
  { value: 'pb', label: 'Primer Bloque', className: styles.filterChipPb },
  { value: 'fx', label: 'Furia Extendido', className: styles.filterChipFx },
];

interface DeckFiltersBarProps {
  filters: DeckFilters;
  inputsClassName?: string;
  /** Extra controls after the race select (e.g. the explore sort). */
  children?: ReactNode;
}

/** Format chips plus subformat and race selects. */
export default function DeckFiltersBar({ filters, inputsClassName, children }: DeckFiltersBarProps) {
  const {
    formatFilter, changeFormatFilter, subformatFilter, setSubformatFilter,
    raceFilter, setRaceFilter, visibleSubformats, visibleRaces,
  } = filters;
  return (
    <div className={styles.filtersBar}>
      <div className={styles.formatFilterGroup}>
        {FORMAT_CHIPS.map((chip) => (
          <button
            key={chip.value}
            className={`${formatFilter === chip.value ? styles.filterChipActive : styles.filterChip} ${chip.className}`}
            onClick={() => changeFormatFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className={inputsClassName ? `${styles.filtersInputsRow} ${inputsClassName}` : styles.filtersInputsRow}>
        <select
          className={styles.filterSelect}
          value={subformatFilter}
          onChange={(e) => setSubformatFilter(e.target.value as SubformatFilter)}
        >
          <option value="all">Todos los subformatos</option>
          {visibleSubformats.map((sf) => (
            <option key={sf.value} value={sf.value}>
              {sf.label}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={raceFilter}
          onChange={(e) => setRaceFilter(e.target.value)}
        >
          <option value="">Todas las razas</option>
          {visibleRaces.map((race) => (
            <option key={race} value={race}>
              {race}
            </option>
          ))}
        </select>
        {children}
      </div>
    </div>
  );
}
