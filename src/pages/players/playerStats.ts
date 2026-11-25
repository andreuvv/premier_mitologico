import type { PlayerHistoryItem } from '../../services/tournamentAPI';
import { secondBfSubformatName, usesRagnarokSubformat } from '../../utils/bfSubformatLabel';

export interface PlayerTournamentData {
  tournamentId: number;
  tournamentName: string;
  month: string;
  year: number;
  format?: string | null;
  subformat?: string | null;
  standing?: {
    final_position: number;
    matches_played: number;
    wins: number;
    ties: number;
    losses: number;
    points: number;
    total_points_scored: number;
  };
  races?: {
    race_pb?: string | null;
    race_bf?: string | null;
    race_libre?: string | null;
    race_edition_vcr?: string | null;
  };
  // Actual match data by format from backend
  pbWins?: number;
  pbTies?: number;
  pbMatches?: number;
  bfWins?: number;
  bfTies?: number;
  bfMatches?: number;
}

export interface PlayerSummary {
  tournamentsPlayed: number;
  totalWins: number;
  totalTies: number;
  totalLosses: number;
  mostPlayedRacePB?: string;
  mostPlayedRacePBPercentage: number;
  mostPlayedRaceBF?: string;
  mostPlayedRaceBFPercentage: number;
  winRatePB: number;
  winRateBF: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
}

export type RaceFormat = 'pb' | 'bf';

const MONTH_ORDER: Record<string, number> = {
  'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
  'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
  'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12,
};

/** Maps the player history API rows and sorts them newest first. */
export function toPlayerTournamentData(items: PlayerHistoryItem[]): PlayerTournamentData[] {
  const tournamentData: PlayerTournamentData[] = items.map((item) => ({
    tournamentId: item.tournament_id,
    tournamentName: item.tournament_name,
    month: item.month,
    year: item.year,
    format: item.format,
    subformat: item.subformat,
    standing: {
      final_position: item.final_position,
      matches_played: item.matches_played,
      wins: item.wins,
      ties: item.ties,
      losses: item.losses,
      points: item.points,
      total_points_scored: item.total_points_scored,
    },
    races: {
      race_pb: item.race_pb,
      race_bf: item.race_bf,
      race_libre: item.race_libre,
      race_edition_vcr: item.race_edition_vcr,
    },
    pbWins: item.pb_wins,
    pbTies: item.pb_ties,
    pbMatches: item.pb_matches,
    bfWins: item.bf_wins,
    bfTies: item.bf_ties,
    bfMatches: item.bf_matches,
  }));

  return tournamentData.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (MONTH_ORDER[b.month] || 0) - (MONTH_ORDER[a.month] || 0);
  });
}

// Extract all PB and BF races from a tournament considering format
// - Mixed (format=null or PBFX): race_pb → PB, race_bf → BF
// - format='PB': race_libre → PB, race_edition_vcr → PB
// - format='BF'/'FX': race_libre → BF, race_edition_vcr → BF
export const getRacesForFormat = (tournament: PlayerTournamentData) => {
  const pbRaces: string[] = [];
  const bfRaces: string[] = [];

  if (!tournament.format || tournament.format === 'PBFX') {
    if (tournament.races?.race_pb) pbRaces.push(tournament.races.race_pb);
    if (tournament.races?.race_bf) bfRaces.push(tournament.races.race_bf);
  } else if (tournament.format === 'PB') {
    // PB-only tournament: both subformat races count as PB
    if (tournament.races?.race_libre) pbRaces.push(tournament.races.race_libre);
    if (tournament.races?.race_edition_vcr) pbRaces.push(tournament.races.race_edition_vcr);
  } else if (tournament.format === 'BF' || tournament.format === 'FX') {
    // BF-only tournament: both subformat races count as BF
    if (tournament.races?.race_libre) bfRaces.push(tournament.races.race_libre);
    if (tournament.races?.race_edition_vcr) bfRaces.push(tournament.races.race_edition_vcr);
  }

  return { pbRaces, bfRaces };
};

const racesOf = (tournament: PlayerTournamentData, format: RaceFormat) => {
  const { pbRaces, bfRaces } = getRacesForFormat(tournament);
  return format === 'pb' ? pbRaces : bfRaces;
};

export function computePlayerSummary(data: PlayerTournamentData[]): PlayerSummary {
  const summary: PlayerSummary = {
    tournamentsPlayed: data.length,
    totalWins: 0,
    totalTies: 0,
    totalLosses: 0,
    mostPlayedRacePB: undefined,
    mostPlayedRacePBPercentage: 0,
    mostPlayedRaceBF: undefined,
    mostPlayedRaceBFPercentage: 0,
    winRatePB: 0,
    winRateBF: 0,
    firstPlaceCount: 0,
    secondPlaceCount: 0,
    thirdPlaceCount: 0,
  };

  if (data.length === 0) return summary;

  // Win rate = (wins + 0.5*ties) / total_matches, using actual match data by format
  let totalPBWins = 0;
  let totalPBTies = 0;
  let totalPBMatches = 0;
  let totalBFWins = 0;
  let totalBFTies = 0;
  let totalBFMatches = 0;

  data.forEach((tournament) => {
    if (tournament.standing) {
      summary.totalWins += tournament.standing.wins;
      summary.totalTies += tournament.standing.ties;
      summary.totalLosses += tournament.standing.losses;

      if (tournament.standing.final_position === 1) {
        summary.firstPlaceCount += 1;
      } else if (tournament.standing.final_position === 2) {
        summary.secondPlaceCount += 1;
      } else if (tournament.standing.final_position === 3) {
        summary.thirdPlaceCount += 1;
      }
    }

    if (tournament.pbMatches && tournament.pbMatches > 0) {
      totalPBWins += tournament.pbWins || 0;
      totalPBTies += tournament.pbTies || 0;
      totalPBMatches += tournament.pbMatches;
    }
    if (tournament.bfMatches && tournament.bfMatches > 0) {
      totalBFWins += tournament.bfWins || 0;
      totalBFTies += tournament.bfTies || 0;
      totalBFMatches += tournament.bfMatches;
    }
  });

  // Capped at 100% to handle any edge cases
  summary.winRatePB = totalPBMatches > 0 ? Math.min(100, Math.round(((totalPBWins + 0.5 * totalPBTies) / totalPBMatches) * 100)) : 0;
  summary.winRateBF = totalBFMatches > 0 ? Math.min(100, Math.round(((totalBFWins + 0.5 * totalBFTies) / totalBFMatches) * 100)) : 0;

  const racePBCount = raceUsage(data, 'pb');
  const raceBFCount = raceUsage(data, 'bf');
  const totalPBRaces = Object.values(racePBCount).reduce((sum, count) => sum + count, 0);
  const totalBFRaces = Object.values(raceBFCount).reduce((sum, count) => sum + count, 0);

  if (Object.keys(racePBCount).length > 0) {
    const [race, count] = Object.entries(racePBCount).sort((a, b) => b[1] - a[1])[0];
    summary.mostPlayedRacePB = race;
    summary.mostPlayedRacePBPercentage = totalPBRaces > 0 ? Math.round((count / totalPBRaces) * 100) : 0;
  }
  if (Object.keys(raceBFCount).length > 0) {
    const [race, count] = Object.entries(raceBFCount).sort((a, b) => b[1] - a[1])[0];
    summary.mostPlayedRaceBF = race;
    summary.mostPlayedRaceBFPercentage = totalBFRaces > 0 ? Math.round((count / totalBFRaces) * 100) : 0;
  }

  return summary;
}

/** How many tournaments the player used each race in, for one format. */
export function raceUsage(data: PlayerTournamentData[], format: RaceFormat): Record<string, number> {
  const count: Record<string, number> = {};
  data.forEach((tournament) => {
    racesOf(tournament, format).forEach((race) => {
      count[race] = (count[race] || 0) + 1;
    });
  });
  return count;
}

/**
 * Winrate (%) of each race the player used, for one block (PB or FX).
 * Mixed tournaments (no format or PBFX) count only that block's matches, so a
 * race name shared by both blocks keeps separate PB and FX stats. Single-format
 * tournaments count all their matches (they are all of that block).
 */
export function raceWinrates(data: PlayerTournamentData[], format: RaceFormat): Record<string, number> {
  const winrates: Record<string, number> = {};
  const raceStats: Record<string, { wins: number; ties: number; total: number }> = {};

  data.forEach((tournament) => {
    const ownWins = format === 'pb' ? tournament.pbWins : tournament.bfWins;
    const ownTies = format === 'pb' ? tournament.pbTies : tournament.bfTies;
    const ownMatches = format === 'pb' ? tournament.pbMatches : tournament.bfMatches;
    const isMixed = !tournament.format || tournament.format === 'PBFX';
    const wins = isMixed ? (ownWins || 0) : (tournament.pbWins || 0) + (tournament.bfWins || 0);
    const ties = isMixed ? (ownTies || 0) : (tournament.pbTies || 0) + (tournament.bfTies || 0);
    const total = isMixed ? (ownMatches || 0) : (tournament.pbMatches || 0) + (tournament.bfMatches || 0);

    if (total > 0) {
      racesOf(tournament, format).forEach((race) => {
        if (!raceStats[race]) {
          raceStats[race] = { wins: 0, ties: 0, total: 0 };
        }
        raceStats[race].wins += wins;
        raceStats[race].ties += ties;
        raceStats[race].total += total;
      });
    }
  });

  Object.entries(raceStats).forEach(([race, stats]) => {
    if (stats.total > 0) {
      winrates[race] = Math.round(((stats.wins + 0.5 * stats.ties) / stats.total) * 100);
    }
  });

  return winrates;
}

const PB_RACES = ['Caballero', 'Faerie', 'Dragón', 'Olímpico', 'Titán', 'Héroe', 'Defensor', 'Desafiante', 'Sombra', 'Sacerdote', 'Faraón', 'Eterno', 'Tótem'];
const BF_RACES = ['Caballero', 'Guerrero', 'Eterno', 'Sombra', 'Dragón', 'Bestia', 'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro', 'Tótem'];

/** Rows of the race table: only races that were actually used. */
export const prepareTableData = (raceData: Record<string, number>, winrateData: Record<string, number>, format: RaceFormat) => {
  const total = Object.values(raceData).reduce((sum, count) => sum + count, 0);
  return (format === 'pb' ? PB_RACES : BF_RACES).map(race => ({
    race,
    vecesUsada: raceData[race] || 0,
    porcentaje: total > 0 ? Math.round(((raceData[race] || 0) / total) * 100) : 0,
    winrate: winrateData[race] || 0
  })).filter(item => item.vecesUsada > 0);
};

const subformatFlags = (subformat: string | null | undefined) => {
  const sub = (subformat || '').toLowerCase();
  const isLibre = ['libre', 'pbrl', 'bfrl'].some(v => sub === v) || sub.includes('libre');
  const isEdicion = ['pbre', 'bfvcr', 'vcr', 'edición', 'edicion', 'ragnarok'].some(v => sub === v)
                 || sub.includes('vcr') || sub.includes('edici') || sub.includes('ragnarok');
  const isBoth = !sub || sub === 'both' || (isLibre && isEdicion);
  return { isLibre, isEdicion, isBoth };
};

/** Label/value rows with the races the player registered in a tournament. */
export const getRaceRows = (tournament: PlayerTournamentData) => {
  const format = tournament.format;
  const isFormatSpecific = format === 'PB' || format === 'FX' || format === 'BF';
  const { isLibre, isEdicion, isBoth } = subformatFlags(tournament.subformat);

  const showPB = !format || format === 'PB' || format === 'PBFX';
  const showBF = !format || format === 'FX' || format === 'BF' || format === 'PBFX';

  const formatName = format === 'PB' ? 'PB' : 'FX';
  const edicionLabel = format === 'BF' ? secondBfSubformatName(tournament) : 'Edición';
  const rows: { label: string; value: string }[] = [];

  if (isFormatSpecific) {
    // Single format tournament: race_libre and race_edition_vcr hold the subformat races
    if (isBoth) {
      rows.push({ label: `Raza ${formatName} Libre`, value: tournament.races?.race_libre || 'No registrada' });
      rows.push({ label: `Raza ${formatName} ${edicionLabel}`, value: tournament.races?.race_edition_vcr || 'No registrada' });
    } else if (isLibre) {
      rows.push({ label: `Raza ${formatName} Libre`, value: tournament.races?.race_libre || tournament.races?.race_pb || 'No registrada' });
    } else if (isEdicion) {
      rows.push({ label: `Raza ${formatName} ${edicionLabel}`, value: tournament.races?.race_edition_vcr || tournament.races?.race_pb || 'No registrada' });
    } else {
      rows.push({ label: `Raza ${formatName}`, value: tournament.races?.race_pb || tournament.races?.race_bf || 'No registrada' });
    }
  } else {
    // Both formats tournament: race_pb = PB race, race_bf = BF race
    if (isBoth) {
      if (showPB) {
        rows.push({ label: 'Raza PB Libre', value: tournament.races?.race_pb || 'No registrada' });
        rows.push({ label: 'Raza PB Edición', value: tournament.races?.race_libre || 'No registrada' });
      }
      if (showBF) {
        rows.push({ label: 'Raza FX Libre', value: tournament.races?.race_bf || 'No registrada' });
        rows.push({ label: 'Raza FX VCR', value: tournament.races?.race_edition_vcr || 'No registrada' });
      }
    } else if (isLibre) {
      if (showPB) rows.push({ label: 'Raza PB Libre', value: tournament.races?.race_pb || 'No registrada' });
      if (showBF) rows.push({ label: 'Raza FX Libre', value: tournament.races?.race_bf || 'No registrada' });
    } else if (isEdicion) {
      if (showPB) rows.push({ label: 'Raza PB Edición', value: tournament.races?.race_pb || 'No registrada' });
      if (showBF) rows.push({ label: 'Raza FX VCR', value: tournament.races?.race_bf || 'No registrada' });
    } else {
      if (showPB) rows.push({ label: 'Raza PB', value: tournament.races?.race_pb || 'No registrada' });
      if (showBF) rows.push({ label: 'Raza FX', value: tournament.races?.race_bf || 'No registrada' });
    }
  }

  return rows;
};

/** Badges with the formats/subformats played in a tournament. */
export const getFormatBadges = (tournament: PlayerTournamentData): { label: string; type: 'pb' | 'fx' }[] => {
  const format = tournament.format;
  const { isLibre, isEdicion, isBoth } = subformatFlags(tournament.subformat);

  const showPB = !format || format === 'PB' || format === 'PBFX';
  const showBF = !format || format === 'FX' || format === 'BF' || format === 'PBFX';

  const badges: { label: string; type: 'pb' | 'fx' }[] = [];

  if (showPB) {
    if (isBoth || isLibre) badges.push({ label: 'PB Racial Libre', type: 'pb' });
    if (isBoth || isEdicion) badges.push({ label: 'PB Racial Edición', type: 'pb' });
    if (!isBoth && !isLibre && !isEdicion) badges.push({ label: 'PB', type: 'pb' });
  }
  if (showBF) {
    if (isBoth || isLibre) badges.push({ label: 'FX Racial Libre', type: 'fx' });
    if (isBoth || isEdicion) badges.push({ label: usesRagnarokSubformat(tournament) ? 'FX Racial Ragnarok' : 'FX Racial VCR', type: 'fx' });
    if (!isBoth && !isLibre && !isEdicion) badges.push({ label: 'FX', type: 'fx' });
  }

  return badges;
};
