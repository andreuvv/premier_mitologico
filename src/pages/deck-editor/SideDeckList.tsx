import { CollectionCard } from '../../types/collection';
import DeckCardRow from './DeckCardRow';
import { DeckGroups, TYPE_DISPLAY, sortedTypeKeys } from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

interface SideDeckListProps {
  sideByType: DeckGroups;
  totalSideCount: number;
  sideMax: number;
  canAdd: (card: CollectionCard) => boolean;
  onSelectCard: (card: CollectionCard) => void;
  onAdd: (card: CollectionCard) => void;
  onRemove: (cardId: number) => void;
}

export default function SideDeckList({
  sideByType, totalSideCount, sideMax, canAdd, onSelectCard, onAdd, onRemove,
}: SideDeckListProps) {
  const typeKeys = sortedTypeKeys(sideByType);
  return (
    <section className={styles.deckSection}>
      <div className={styles.sideSectionHeader}>
        <h3 className={styles.sectionTitle}>🔁 Sidedeck</h3>
        <span
          className={`${styles.sideCountBadge} ${totalSideCount > sideMax ? styles.sideCountBadgeOver : totalSideCount === sideMax ? styles.sideCountBadgeFull : ''}`}
        >
          {totalSideCount} / {sideMax}
        </span>
      </div>
      <p className={styles.coverHint}>
        Cartas de cambio (cualquier tipo). No cuentan en las estadísticas de construcción.
      </p>
      {totalSideCount > sideMax && (
        <div className={styles.validationError}>
          ✕ El sidedeck supera el máximo de {sideMax} cartas
        </div>
      )}
      {typeKeys.length === 0 ? (
        <p className={styles.deckEmpty}>
          Selecciona «Sidedeck» arriba y agrega cartas desde la grilla
        </p>
      ) : (
        typeKeys.map((type) => {
          const items = sideByType[type];
          const groupCount = items.reduce((s, i) => s + i.count, 0);
          return (
            <div key={type} className={styles.deckTypeGroup}>
              <div className={styles.deckTypeHeader}>
                <span>{TYPE_DISPLAY[type] ?? type}</span>
                <span className={styles.deckTypeCount}>{groupCount}</span>
              </div>
              {items.map(({ card, count }) => (
                <DeckCardRow
                  key={card.id}
                  card={card}
                  count={count}
                  onSelect={onSelectCard}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  addDisabled={!canAdd(card)}
                />
              ))}
            </div>
          );
        })
      )}
    </section>
  );
}
