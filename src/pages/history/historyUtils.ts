import type { Tournament, TournamentRound, TournamentStanding } from '../../services/tournamentAPI';
import { secondBfSubformatName, usesRagnarokSubformat } from '../../utils/bfSubformatLabel';

export function compareNewestFirst(a: Tournament, b: Tournament): number {
  const byDate = (b.start_date ?? '').localeCompare(a.start_date ?? '');
  if (byDate !== 0) return byDate;
  return b.id - a.id;
}

/** Names of the players who won a match of the final (extra) round. */
export function playoffWinnerNames(rounds: TournamentRound[]): Set<string> {
  const winners = new Set<string>();
  rounds
    .filter((round) => round.is_extra_round)
    .forEach((round) => {
      round.matches.forEach((match) => {
        if (match.score1 === null || match.score2 === null) return;
        if (match.score1 > match.score2) winners.add(match.player1_name);
        else if (match.score2 > match.score1) winners.add(match.player2_name);
      });
    });
  return winners;
}

export const calculateWinRate = (standing: TournamentStanding) => {
  if (standing.total_matches === 0) return '0.0';
  return ((standing.total_points_scored / standing.total_matches) * 100).toFixed(1);
};

export const calculateRoundWinRate = (standing: TournamentStanding) => {
  const totalRounds = standing.matches_played;
  if (totalRounds === 0) return '0.0';
  const roundPoints = standing.wins + standing.ties * 0.5;
  return ((roundPoints / totalRounds) * 100).toFixed(1);
};

export interface RecordByType {
  libre: { wins: number; ties: number; losses: number };
  edicion: { wins: number; ties: number; losses: number };
}

const LIBRE_VALUES = new Set(['libre', 'pbrl', 'bfrl']);
const EDICION_VALUES = new Set(['pbre', 'bfvcr', 'vcr', 'edición', 'edicion']);

/** Win/tie/loss record of a player split by Libre rounds vs. the other subformat (or PB vs. BF). */
export const recordByRoundType = (rounds: TournamentRound[], playerName: string): RecordByType => {
  const record: RecordByType = {
    libre: { wins: 0, ties: 0, losses: 0 },
    edicion: { wins: 0, ties: 0, losses: 0 }
  };

  if (!rounds || rounds.length === 0) return record;

  rounds.forEach(round => {
    const sub = (round.subformat || '').toLowerCase();
    let isLibre: boolean;
    if (sub) {
      if (LIBRE_VALUES.has(sub) || sub.includes('libre')) {
        isLibre = true;
      } else if (EDICION_VALUES.has(sub) || sub.includes('vcr') || sub.includes('edici') || sub.includes('ragnarok')) {
        isLibre = false;
      } else {
        // Unknown subformat, fallback to format field
        isLibre = round.format === 'PB';
      }
    } else {
      // No subformat: use format field. PB = libre, BF = edición
      isLibre = round.format === 'PB';
    }
    const targetRecord = isLibre ? record.libre : record.edicion;

    round.matches.forEach(match => {
      if (match.score1 === null || match.score2 === null) return;

      if (match.player1_name === playerName) {
        if (match.score1 > match.score2) targetRecord.wins++;
        else if (match.score1 < match.score2) targetRecord.losses++;
        else targetRecord.ties++;
      } else if (match.player2_name === playerName) {
        if (match.score2 > match.score1) targetRecord.wins++;
        else if (match.score2 < match.score1) targetRecord.losses++;
        else targetRecord.ties++;
      }
    });
  });

  return record;
};

/** Which race columns/charts apply to a tournament (mixed PB+FX vs. a single format). */
export function formatFlags(tournament: Tournament | null) {
  const format = tournament?.format;
  return {
    shouldShowPB: !format || format === 'PB' || format === 'PBFX',
    shouldShowBF: !format || format === 'BF' || format === 'FX' || format === 'PBFX',
    isFormatSpecific: format === 'PB' || format === 'FX' || format === 'BF',
  };
}

/** Name of the second subformat of a single-format tournament ("Edición", "VCR", "Ragnarok"). */
export const secondSubformatName = (tournament: Tournament | null) =>
  tournament?.format === 'PB' ? 'Edición' : secondBfSubformatName(tournament);

export const raceColumnLabels = (tournament: Tournament | null) => {
  if (formatFlags(tournament).isFormatSpecific) {
    const format = tournament?.format;
    return {
      libre: `Raza ${format} Libre`,
      edition: `Raza ${format} ${secondSubformatName(tournament)}`,
    };
  }
  return {
    libre: 'Raza PB',
    edition: 'Raza BF',
  };
};

export const recordColumnLabels = (tournament: Tournament | null) => {
  if (formatFlags(tournament).isFormatSpecific) {
    const companion = usesRagnarokSubformat(tournament) ? 'Ragnarok' : 'Edición/VCR';
    return {
      libre: 'Record Libre',
      libreTitle: 'Record en rondas Racial Libre (Victorias-Empates-Derrotas)',
      edicion: `Record ${companion}`,
      edicionTitle: `Record en rondas Racial ${companion} (Victorias-Empates-Derrotas)`,
    };
  }
  return {
    libre: 'Record PB',
    libreTitle: 'Record en rondas de Primer Bloque (Victorias-Empates-Derrotas)',
    edicion: 'Record BF',
    edicionTitle: 'Record en rondas de Furia Extendido (Victorias-Empates-Derrotas)',
  };
};

export type RaceFormat = 'pb' | 'bf';

const PB_RACES = ['Caballero', 'Faerie', 'Dragón', 'Olímpico', 'Titán', 'Héroe', 'Defensor', 'Desafiante', 'Sombra', 'Sacerdote', 'Faraón', 'Eterno', 'Tótem'];
const BF_RACES = ['Caballero', 'Guerrero', 'Eterno', 'Sombra', 'Dragón', 'Bestia', 'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro', 'Tótem'];
const RACE_COLORS = [
  '#6B46C1', '#38A169', '#D69E2E', '#E53E3E', '#3182CE', '#805AD5', '#DD6B20', '#2C5282', '#B83280', '#38B2AC', '#D4AF37', '#C53030', '#2D3748'
];

export const getColorForRace = (race: string, format: RaceFormat) => {
  const index = (format === 'pb' ? PB_RACES : BF_RACES).indexOf(race);
  return index >= 0 ? RACE_COLORS[index % RACE_COLORS.length] : '#6B46C1';
};

export const prepareChartData = (raceData: { [race: string]: number }, format: RaceFormat) =>
  (format === 'pb' ? PB_RACES : BF_RACES).map(race => ({
    name: race,
    value: raceData[race] || 0,
    displayName: `${race}: ${raceData[race] || 0}`
  }));

export const prepareWinrateData = (winrateData: { [race: string]: number }) =>
  Object.entries(winrateData)
    .map(([race, winrate]) => ({
      race,
      winrate: Math.round(winrate * 100) / 100 // round to 2 decimals
    }))
    .sort((a, b) => b.winrate - a.winrate); // sort by winrate descending
