import { useState } from 'react';
import {
  COST_CHART_SEGMENT_CLASS,
  COST_CHART_TYPES,
  CostBucket,
  CostChartType,
  DECK_SIZE,
  DeckGroups,
  TYPE_STATS,
} from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

interface EditorStatsPanelProps {
  deckByType: DeckGroups;
  totalDeckCount: number;
  isDraft: boolean;
  costDistribution: CostBucket[];
}

export default function EditorStatsPanel({
  deckByType, totalDeckCount, isDraft, costDistribution,
}: EditorStatsPanelProps) {
  const [hoveredCostSegment, setHoveredCostSegment] = useState<{
    cost: number;
    type: CostChartType;
    count: number;
  } | null>(null);

  const countByType = (type: string) =>
    deckByType[type]?.reduce((s, { count }) => s + count, 0) ?? 0;
  const maxCostCount = Math.max(1, ...costDistribution.map((item) => item.count));

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>📊 Estadísticas de construcción</h3>
      <div className={styles.statsList}>
        {TYPE_STATS.map(({ type, label }) => {
          const n = countByType(type);
          return (
            <div key={type} className={styles.statRow}>
              <span className={styles.statLabel}>{label}</span>
              <span className={`${styles.statCount} ${n > 0 ? styles.statCountActive : ''}`}>
                {n}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.progressArea}>
        {isDraft && (
          <div className={styles.draftNotice}>
            Modo borrador activo: puedes superar las 50 cartas, pero el mazo quedará privado.
          </div>
        )}
        {totalDeckCount < DECK_SIZE && (
          <div className={styles.missingLabel}>
            Falta {DECK_SIZE - totalDeckCount} para completar el mazo
          </div>
        )}
        {totalDeckCount > DECK_SIZE && (
          <div className={styles.overLabel}>
            Te pasas por {totalDeckCount - DECK_SIZE} cartas
          </div>
        )}
        <div
          className={`${styles.countBadge} ${
            totalDeckCount === DECK_SIZE
              ? styles.countBadgeFull
              : totalDeckCount > DECK_SIZE
              ? styles.countBadgeOver
              : ''
          }`}
        >
          {totalDeckCount} / {DECK_SIZE}
        </div>
      </div>

      <div className={styles.costChartSection}>
        <h4 className={styles.costChartTitle}>Distribución por costo</h4>
        <div className={styles.costChartHoverInfo}>
          {hoveredCostSegment
            ? `Costo ${hoveredCostSegment.cost} · ${hoveredCostSegment.type}: ${hoveredCostSegment.count}`
            : 'Pasa el cursor por un color para ver tipo y cantidad'}
        </div>
        {costDistribution.length === 0 ? (
          <div className={styles.costChartEmpty}>Aún no hay cartas para mostrar.</div>
        ) : (
          <div className={styles.costChart}>
            <div className={styles.costChartHeaderRow}>
              <span className={styles.costChartColHeader}>Costo</span>
              <span className={styles.costChartColHeaderSpacer} aria-hidden />
              <span className={styles.costChartColHeader} title="Cantidad">Cant.</span>
            </div>
            {costDistribution.map(({ cost, count, byType }) => {
              const segments = COST_CHART_TYPES
                .map((type) => ({ type, count: byType[type] }))
                .filter((item) => item.count > 0);
              const breakdown = segments
                .map((item) => `${item.type}: ${item.count}`)
                .join(' | ');
              return (
                <div key={cost} className={styles.costChartBarGroup}>
                  <span className={styles.costChartLabel}>{cost}</span>
                  <div className={styles.costChartBarTrack}>
                    <div
                      className={styles.costChartBar}
                      style={{ width: `${Math.max(8, (count / maxCostCount) * 100)}%` }}
                      title={`Costo ${cost}: ${count} carta${count === 1 ? '' : 's'}${breakdown ? ` (${breakdown})` : ''}`}
                      aria-label={`Costo ${cost}: ${count} carta${count === 1 ? '' : 's'}`}
                    >
                      {segments.map((item) => (
                        <div
                          key={`${cost}-${item.type}`}
                          className={`${styles.costChartSegment} ${styles[COST_CHART_SEGMENT_CLASS[item.type]]}`}
                          style={{ width: `${(item.count / count) * 100}%` }}
                          title={`${item.type}: ${item.count}`}
                          onMouseEnter={() =>
                            setHoveredCostSegment({ cost, type: item.type, count: item.count })
                          }
                          onMouseLeave={() => setHoveredCostSegment(null)}
                        />
                      ))}
                    </div>
                  </div>
                  <span className={styles.costChartCount}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className={styles.costChartLegend}>
          {COST_CHART_TYPES.map((type) => (
            <span key={type} className={styles.costChartLegendItem}>
              <span
                className={`${styles.costChartLegendSwatch} ${styles[COST_CHART_SEGMENT_CLASS[type]]}`}
                aria-hidden="true"
              />
              {type}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
