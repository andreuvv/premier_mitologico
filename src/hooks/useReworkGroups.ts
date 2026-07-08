import { useMemo } from 'react';
import { CollectionCard } from '../types/collection';
import {
  groupKey,
  isReworkCard,
  normalizeName,
  sortVersionsByIdDesc,
} from '../utils/cardGrouping';

export interface ReworkGroup {
  key: string;
  name: string;
  type: string;
  oldVersions: CollectionCard[];
  reworkVersions: CollectionCard[];
}

export interface ReworkFilterParams {
  q: string | null;
  type: string | null;
}

function buildReworkGroups(allCards: CollectionCard[]): ReworkGroup[] {
  const byGroup = new Map<string, CollectionCard[]>();

  for (const card of allCards) {
    const key = groupKey(card.name, card.type);
    const list = byGroup.get(key) ?? [];
    list.push(card);
    byGroup.set(key, list);
  }

  const groups: ReworkGroup[] = [];

  for (const [key, cards] of byGroup.entries()) {
    const reworkVersions = sortVersionsByIdDesc(cards.filter((c) => isReworkCard(c)));
    if (reworkVersions.length === 0) continue;

    const oldVersions = sortVersionsByIdDesc(cards.filter((c) => !isReworkCard(c)));
    const sample = reworkVersions[0];

    groups.push({
      key,
      name: sample.name,
      type: sample.type,
      oldVersions,
      reworkVersions,
    });
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function filterReworkGroups(groups: ReworkGroup[], params: ReworkFilterParams): ReworkGroup[] {
  const normalizedSearch = params.q ? normalizeName(params.q.trim()) : '';
  const typeFilter = params.type?.toUpperCase() ?? '';

  return groups.filter((group) => {
    if (typeFilter && group.type.toUpperCase() !== typeFilter) return false;
    if (!normalizedSearch) return true;

    const matchesName = normalizeName(group.name).includes(normalizedSearch);
    const matchesCode = group.oldVersions.some((c) =>
      c.collectorCode.toLowerCase().includes(normalizedSearch),
    ) || group.reworkVersions.some((c) =>
      c.collectorCode.toLowerCase().includes(normalizedSearch),
    );

    return matchesName || matchesCode;
  });
}

export function useReworkGroups(allCards: CollectionCard[], filters: ReworkFilterParams) {
  const allGroups = useMemo(() => buildReworkGroups(allCards), [allCards]);
  const filteredGroups = useMemo(
    () => filterReworkGroups(allGroups, filters),
    [allGroups, filters],
  );

  return { allGroups, filteredGroups };
}
