import { CollectionCard } from '../types/collection';
import { ReworkGroup } from '../hooks/useReworkGroups';
import ReworkVersionColumn from './ReworkVersionColumn';
import styles from './ReworkComparisonRow.module.css';

interface ReworkComparisonRowProps {
  group: ReworkGroup;
  onViewCard?: (card: CollectionCard) => void;
}

export default function ReworkComparisonRow({ group, onViewCard }: ReworkComparisonRowProps) {
  return (
    <article className={styles.row}>
      <ReworkVersionColumn
        title="Antigua"
        versions={group.oldVersions}
        onViewCard={onViewCard}
      />

      <div className={styles.arrow} aria-hidden="true">
        →
      </div>

      <ReworkVersionColumn
        title="Rework"
        versions={group.reworkVersions}
        onViewCard={onViewCard}
        showNewestBadge
      />
    </article>
  );
}
