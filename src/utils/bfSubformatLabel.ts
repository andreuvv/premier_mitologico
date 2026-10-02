/**
 * From June 2026, Furia Extendido (format BF) plays Racial Ragnarok
 * as its second subformat. Archived rounds still store the old value "VCR".
 */
const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export interface BfSubformatTournament {
  format?: string | null;
  year?: number;
  month?: string;
  start_date?: string | null;
}

export function usesRagnarokSubformat(
  tournament: BfSubformatTournament | null | undefined,
): boolean {
  if (!tournament || tournament.format !== 'BF') return false;

  const start = tournament.start_date?.slice(0, 10);
  if (start) return start >= '2026-06-01';

  const year = tournament.year;
  if (year == null) return false;
  if (year > 2026) return true;
  if (year < 2026) return false;

  const monthIndex = SPANISH_MONTHS.indexOf((tournament.month || '').trim().toLowerCase());
  return monthIndex >= 5;
}

export function secondBfSubformatName(
  tournament: BfSubformatTournament | null | undefined,
): 'Ragnarok' | 'VCR' {
  return usesRagnarokSubformat(tournament) ? 'Ragnarok' : 'VCR';
}

const STORED_VCR_VALUES = new Set(['vcr', 'bfvcr']);

/** Label shown for a round's stored subformat. */
export function displayStoredSubformat(
  subformat: string | null | undefined,
  tournament: BfSubformatTournament | null | undefined,
): string {
  if (!subformat) return '';
  if (usesRagnarokSubformat(tournament) && STORED_VCR_VALUES.has(subformat.toLowerCase())) {
    return 'Ragnarok';
  }
  return subformat;
}
