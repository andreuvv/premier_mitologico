import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChartPie, FaChevronDown } from 'react-icons/fa';
import styles from '../PlayersPage.module.css';
import { prepareTableData, raceUsage, raceWinrates, type PlayerTournamentData, type RaceFormat } from './playerStats';

interface RaceStatsAccordionProps {
  data: PlayerTournamentData[];
  expanded: boolean;
  onToggle: () => void;
}

/** Collapsible tables with how often the player used each race and its winrate. */
export default function RaceStatsAccordion({ data, expanded, onToggle }: RaceStatsAccordionProps) {
  const [tablesCompact, setTablesCompact] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => ({
    pb: prepareTableData(raceUsage(data, 'pb'), raceWinrates(data, 'pb'), 'pb'),
    bf: prepareTableData(raceUsage(data, 'bf'), raceWinrates(data, 'bf'), 'bf'),
  }), [data]);

  // Make the tables compact when they would need horizontal scrolling.
  // A ResizeObserver re-checks whenever the container's width changes (window
  // resize, a scrollbar appearing as the page grows, etc.), not only on resize.
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const checkTableOverflow = () => {
      // Measure the table at its regular size: the compact style shrinks it.
      const table = container.querySelector('table');
      if (!table) return;
      const compactClass = styles.tableContainerCompact;
      const wasCompact = container.classList.contains(compactClass);
      if (wasCompact) container.classList.remove(compactClass);
      const needsScrolling = table.scrollWidth > container.clientWidth;
      if (wasCompact) container.classList.add(compactClass);
      setTablesCompact(needsScrolling);
    };

    checkTableOverflow();
    const observer = new ResizeObserver(checkTableOverflow);
    observer.observe(container);
    return () => observer.disconnect();
  }, [data, expanded]);

  const raceTable = (format: RaceFormat, title: string, measured: boolean) => (
    <div className={styles.chartSection}>
      <h4>{title}</h4>
      <div
        className={`${styles.tableContainer} ${tablesCompact ? styles.tableContainerCompact : ''}`}
        ref={measured ? tableContainerRef : undefined}
      >
        <table className={styles.raceTable}>
          <thead>
            <tr>
              <th>Raza</th>
              <th>Veces Usada</th>
              <th>Winrate</th>
            </tr>
          </thead>
          <tbody>
            {rows[format].map((row, index) => (
              <tr key={index}>
                <td>{row.race}</td>
                <td>{row.vecesUsada} ({row.porcentaje}%)</td>
                <td>{row.winrate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={styles.graphsAccordion}>
      <button
        className={styles.accordionHeader}
        onClick={onToggle}
      >
        <div className={styles.headerContent}>
          <h3><FaChartPie className={styles.chartIcon} /> Estadísticas de Razas</h3>
        </div>
        <FaChevronDown
          className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}
        />
      </button>

      {expanded && (
        <div className={styles.graphsContent}>
          {raceTable('pb', 'Uso de Razas en Primer Bloque', true)}
          {raceTable('bf', 'Uso de Razas en Furia Extendido', false)}
        </div>
      )}
    </div>
  );
}
