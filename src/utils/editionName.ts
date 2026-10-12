const EMOJI_OR_JOINER = /\p{Extended_Pictographic}|\uFE0F|\u200D/gu;

/** Same edition even when the label only differs by emoji or casing. */
export function editionIdentity(name: string): string {
  return name
    .replace(EMOJI_OR_JOINER, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function sameEdition(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const left = editionIdentity(a);
  const right = editionIdentity(b);
  return left.length > 0 && left === right;
}

/** Visible edition name: same spelling, without the emoji prefix. */
export function editionLabel(name: string): string {
  return name.replace(EMOJI_OR_JOINER, '').replace(/\s+/g, ' ').trim();
}

/** One filter label per edition. The most common spelling wins, without emoji. */
export function canonicalEditionNames(names: Iterable<string>): string[] {
  const groups = new Map<string, Map<string, number>>();

  for (const name of names) {
    const key = editionIdentity(name);
    if (!key) continue;
    const variants = groups.get(key) ?? new Map<string, number>();
    variants.set(name, (variants.get(name) ?? 0) + 1);
    groups.set(key, variants);
  }

  const labels: string[] = [];
  for (const variants of groups.values()) {
    let best = '';
    let bestCount = -1;
    for (const [name, count] of variants) {
      if (count > bestCount || (count === bestCount && name.localeCompare(best, 'es') < 0)) {
        best = name;
        bestCount = count;
      }
    }
    const label = editionLabel(best);
    if (label) labels.push(label);
  }

  return labels.sort((a, b) => a.localeCompare(b, 'es'));
}
