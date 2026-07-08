import { useCallback, useEffect, useRef, useState } from 'react';
import { ReworkGroup } from '../hooks/useReworkGroups';
import { CollectionCard } from '../types/collection';
import ReworkComparisonRow from './ReworkComparisonRow';
import styles from './ReworkComparisonList.module.css';

const BATCH_SIZE = 12;

function getScrollStorageKey(): string | null {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (idx === undefined) return null;
  return `myl_scroll_${window.location.pathname}_${idx}`;
}

interface ReworkComparisonListProps {
  groups: ReworkGroup[];
  onViewCard?: (card: CollectionCard) => void;
  onDisplayCountChange?: (visible: number, total: number) => void;
}

export default function ReworkComparisonList({
  groups,
  onViewCard,
  onDisplayCountChange,
}: ReworkComparisonListProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreLockRef = useRef(false);

  const visibleGroups = groups.slice(0, visibleCount);
  const hasMore = visibleCount < groups.length;

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [groups]);

  useEffect(() => {
    onDisplayCountChange?.(visibleGroups.length, groups.length);
  }, [visibleGroups.length, groups.length, onDisplayCountChange]);

  const loadMore = useCallback(() => {
    if (loadMoreLockRef.current) return;
    loadMoreLockRef.current = true;
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, groups.length));
    requestAnimationFrame(() => {
      loadMoreLockRef.current = false;
    });
  }, [groups.length]);

  // Infinite scroll via intersection observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  // Load enough rows for scroll restoration after back-navigation
  useEffect(() => {
    if (visibleCount >= groups.length) return;

    const storageKey = getScrollStorageKey();
    if (!storageKey) return;

    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;

    const scrollY = parseInt(raw, 10);
    if (isNaN(scrollY) || scrollY <= 0) return;

    const neededHeight = scrollY + window.innerHeight;
    if (document.documentElement.scrollHeight < neededHeight) {
      loadMore();
    }
  }, [visibleCount, groups.length, loadMore]);

  if (groups.length === 0) {
    return (
      <div className={styles.empty}>
        No se encontraron cartas con rework para los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {visibleGroups.map((group) => (
          <ReworkComparisonRow
            key={group.key}
            group={group}
            onViewCard={onViewCard}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true">
          <span className={styles.loadingMore}>Cargando más reworks...</span>
        </div>
      )}
    </div>
  );
}
