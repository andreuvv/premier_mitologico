import type { CollectionCard } from '../../types/collection';
import { MITOXICOS_LOADER_COLOR } from '../../config/loadingAssets';
import styles from '../DeckViewerPage.module.css';
import CardStack from './CardStack';
import DeckStatsPanel from './DeckStatsPanel';
import {
  FORMAT_LABELS,
  SUBFORMAT_LABELS,
  TYPE_DISPLAY,
  type CostBucket,
  type DeckEntry,
  type DeckGroups,
} from './deckViewerUtils';

export interface DeckViewData {
  name: string;
  format: 'pb' | 'fx';
  subformat: string;
  race: string;
  isDraft: boolean;
  authorName: string;
  editionLabel: string | null;
  mainGroups: DeckGroups;
  mainTypeKeys: string[];
  sideGroups: DeckGroups;
  sideTypeKeys: string[];
  totalSideCount: number;
  totalDeckCount: number;
  costBuckets: CostBucket[];
  errors: string[];
  warnings: string[];
}

interface DeckBodyProps {
  data: DeckViewData;
  view: 'grouped' | 'grid';
  includeSide: boolean;
  cardWidth: number;
  stackOffset: number;
  onSelectCard: (card: CollectionCard) => void;
}

/**
 * Full deck body (header + cards + stats + branding). Rendered once for the
 * visible page and again, off-screen, for the exported image.
 */
export default function DeckBody({ data, view, includeSide, cardWidth, stackOffset, onSelectCard }: DeckBodyProps) {
  const stack = ({ card, count }: DeckEntry) => (
    <CardStack key={card.id} card={card} count={count} cardWidth={cardWidth} stackOffset={stackOffset} onSelect={onSelectCard} />
  );

  const renderCards = (groups: DeckGroups, typeKeys: string[]) =>
    view === 'grouped' ? (
      typeKeys.map((type) => {
        const items = groups[type];
        const groupTotal = items.reduce((s, i) => s + i.count, 0);
        return (
          <div key={type} className={styles.typeGroup}>
            <div className={styles.typeHeader}>
              <span className={styles.typeLabel}>{TYPE_DISPLAY[type] ?? type}</span>
              <span className={styles.typeCount}>{groupTotal}</span>
            </div>
            <div className={styles.cardsRow}>
              {items.map(stack)}
            </div>
          </div>
        );
      })
    ) : (
      <div className={styles.cardsRow}>
        {typeKeys.flatMap((t) => groups[t]).map(stack)}
      </div>
    );

  const countByType = (type: string) =>
    data.mainGroups[type]?.reduce((s, { count }) => s + count, 0) ?? 0;

  return (
    <>
      {/* Deck header */}
      <div className={styles.deckHeader}>
        <div className={styles.deckHeaderMain}>
          <h1 className={styles.deckTitle}>{data.name}</h1>
          <div className={styles.badgesRow}>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${data.format === 'pb' ? styles.badgePb : styles.badgeFx}`}>
                {FORMAT_LABELS[data.format] ?? data.format}
              </span>
              <span className={styles.badge}>{SUBFORMAT_LABELS[data.subformat] ?? data.subformat}</span>
              {data.isDraft && <span className={styles.badge}>Borrador</span>}
              {data.race && <span className={styles.badge}>{data.race}</span>}
              {data.editionLabel && <span className={`${styles.badge} ${styles.badgeEdition}`}>{data.editionLabel}</span>}
            </div>
            <span className={styles.authorLabel}>por <strong>{data.authorName}</strong></span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.cardContainer}>
          {data.mainTypeKeys.length === 0 ? (
            <p className={styles.emptyDeck}>Este mazo no tiene cartas.</p>
          ) : (
            renderCards(data.mainGroups, data.mainTypeKeys)
          )}

          {/* Sidedeck (shown separately, excluded from stats) */}
          {data.sideTypeKeys.length > 0 && includeSide && (
            <div className={styles.sideDeckBlock}>
              <div className={styles.sideDeckDivider}>
                <span className={styles.sideDeckTitle}>Sidedeck</span>
                <span className={styles.sideDeckCount}>{data.totalSideCount} cartas</span>
              </div>
              {renderCards(data.sideGroups, data.sideTypeKeys)}
            </div>
          )}
        </div>

        {/* Right column: stats + branding */}
        <div className={styles.rightColumn}>
          <DeckStatsPanel
            countByType={countByType}
            totalDeckCount={data.totalDeckCount}
            costBuckets={data.costBuckets}
            errors={data.errors}
            warnings={data.warnings}
          />

          {/* Branding shown below the stats panel */}
          <div className={styles.exportBrand}>
            <img src={MITOXICOS_LOADER_COLOR} alt="Mitoxicos" className={styles.brandLogo} />
            <span className={styles.brandText}>mitoxicos.cl</span>
          </div>
        </div>
      </div>
    </>
  );
}
