import { FX_RACES, PB_RACES } from '../../config/profileOptions';

export type StepId = 'torneo' | 'razas' | 'rondas' | 'marcadores' | 'cerrar';
export type TournamentFormat = 'PB' | 'FX' | 'PBFX';
export type TournamentType = 'premier_mitoxico' | 'special_event';
export type PairingMode = 'fixed' | 'progressive';
export type RaceDraft = { race1: string; race2: string };
export type ScoreDraft = { score1: number | null; score2: number | null };

export interface TournamentForm {
  name: string;
  month: string;
  year: number;
  startDate: string;
  endDate: string;
  locationName: string;
  locationAddress: string;
  format: TournamentFormat;
  subformat1Id: number;
  subformat2Id: number;
  tournamentType: TournamentType;
  playerIds: number[];
}

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  PB: 'Primer Bloque',
  FX: 'Furia Extendido',
  PBFX: 'PB + FX',
};

export function emptyForm(now = new Date()): TournamentForm {
  return {
    name: '',
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
    startDate: '',
    endDate: '',
    locationName: '',
    locationAddress: '',
    format: 'PBFX',
    subformat1Id: 2,
    subformat2Id: 4,
    tournamentType: 'premier_mitoxico',
    playerIds: [],
  };
}

export function sameForm(a: TournamentForm, b: TournamentForm): boolean {
  const ids = (list: number[]) => [...list].sort((x, y) => x - y).join(',');
  return (
    a.name === b.name && a.month === b.month && a.year === b.year
    && a.startDate === b.startDate && a.endDate === b.endDate
    && a.locationName === b.locationName && a.locationAddress === b.locationAddress
    && a.format === b.format && a.subformat1Id === b.subformat1Id && a.subformat2Id === b.subformat2Id
    && a.tournamentType === b.tournamentType && ids(a.playerIds) === ids(b.playerIds)
  );
}

/** Month name and year of a yyyy-mm-dd date, or null if it isn't one. */
export function monthYearOf(date: string): { month: string; year: number } | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(date);
  if (!match) return null;
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return { month: MONTHS[monthIndex], year: Number(match[1]) };
}

/** Scores are 0, 1 or 2 games won. */
export const clampScore = (value: number | null | undefined): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(2, Math.max(0, Math.trunc(parsed)));
};

/** Which block each race column uses: column 1 is PB unless the tournament is FX only. */
export function raceSides(format: TournamentFormat): ['PB' | 'FX', 'PB' | 'FX'] {
  return [format === 'FX' ? 'FX' : 'PB', format === 'PB' ? 'PB' : 'FX'];
}

/** Races of one block sorted for a select, keeping an unknown current value first. */
export function raceChoices(side: 'PB' | 'FX', current: string): string[] {
  const choices = [...(side === 'PB' ? PB_RACES : FX_RACES)].sort((left, right) => left.localeCompare(right, 'es'));
  if (current && !choices.includes(current)) choices.unshift(current);
  return choices;
}

export const raceComplete = (race: RaceDraft | undefined) => Boolean(race?.race1 && race?.race2);

type RaceRowLike = { tournament_id: number; player_id: number; race_format1: string | null; race_format2: string | null };

/**
 * Races of each roster player in one tournament. A player has a race row per
 * tournament they played, so rows from other tournaments must be ignored.
 */
export function rosterRaces(rows: RaceRowLike[], tournamentId: number, playerIds: number[]): Record<number, RaceDraft> {
  const result: Record<number, RaceDraft> = {};
  playerIds.forEach((playerId) => {
    const row = rows.find((item) => item.tournament_id === tournamentId && item.player_id === playerId);
    result[playerId] = { race1: row?.race_format1 ?? '', race2: row?.race_format2 ?? '' };
  });
  return result;
}

export interface ProgressInput {
  hasTournament: boolean;
  playerCount: number;
  racesComplete: number;
  pairingMode: PairingMode;
  roundCount: number;
  includeExtra: boolean;
  regularRoundsSaved: number;
  hasFinalRound: boolean;
  matchesDone: number;
  matchesTotal: number;
}

export interface StepStatus {
  id: StepId;
  label: string;
  done: boolean;
  /** Short progress text shown under the step ("7/9"). */
  detail: string;
  disabled: boolean;
}

/** Status of each step of running a tournament, in order. */
export function tournamentSteps(input: ProgressInput): StepStatus[] {
  const {
    hasTournament, playerCount, racesComplete, pairingMode, roundCount, includeExtra,
    regularRoundsSaved, hasFinalRound, matchesDone, matchesTotal,
  } = input;
  const roundsPlanned = roundCount + (includeExtra ? 1 : 0);
  const roundsSaved = regularRoundsSaved + (hasFinalRound ? 1 : 0);
  const roundsDone = pairingMode === 'fixed'
    ? regularRoundsSaved > 0
    : regularRoundsSaved >= roundCount && (!includeExtra || hasFinalRound);

  return [
    {
      id: 'torneo',
      label: 'Torneo',
      done: hasTournament,
      detail: hasTournament ? `${playerCount} jug.` : 'Crear',
      disabled: false,
    },
    {
      id: 'razas',
      label: 'Razas',
      done: hasTournament && playerCount > 0 && racesComplete >= playerCount,
      detail: `${racesComplete}/${playerCount}`,
      disabled: !hasTournament,
    },
    {
      id: 'rondas',
      label: 'Rondas',
      done: hasTournament && roundsDone,
      detail: pairingMode === 'fixed' && regularRoundsSaved > 0 ? `${roundsSaved}` : `${roundsSaved}/${roundsPlanned}`,
      disabled: !hasTournament,
    },
    {
      id: 'marcadores',
      label: 'Marcadores',
      done: hasTournament && matchesTotal > 0 && matchesDone >= matchesTotal,
      detail: `${matchesDone}/${matchesTotal}`,
      disabled: !hasTournament,
    },
    {
      id: 'cerrar',
      label: 'Cerrar',
      done: false,
      detail: 'Archivar',
      disabled: !hasTournament,
    },
  ];
}

/**
 * Where the admin most likely needs to go next: set up the tournament and races,
 * then load pending scores before generating more rounds (round-by-round mode
 * needs the scores to pair the next round), and finally close it.
 */
export function nextStep(steps: StepStatus[]): StepId {
  const byId = Object.fromEntries(steps.map((step) => [step.id, step])) as Record<StepId, StepStatus>;
  if (!byId.torneo.done) return 'torneo';
  if (!byId.razas.done) return 'razas';
  const [done, total] = byId.marcadores.detail.split('/').map(Number);
  if (total > 0 && done < total) return 'marcadores';
  if (!byId.rondas.done) return 'rondas';
  return 'cerrar';
}
