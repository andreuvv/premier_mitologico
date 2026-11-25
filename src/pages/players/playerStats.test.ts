import { describe, expect, it } from 'vitest';
import {
  computePlayerSummary,
  getFormatBadges,
  getRacesForFormat,
  prepareTableData,
  raceUsage,
  raceWinrates,
  type PlayerTournamentData,
} from './playerStats';

function tournament(id: number, extra: Partial<PlayerTournamentData>): PlayerTournamentData {
  return { tournamentId: id, tournamentName: `T${id}`, month: 'Enero', year: 2026, ...extra };
}

const standing = (final_position: number, wins: number, ties: number, losses: number) => ({
  final_position, matches_played: wins + ties + losses, wins, ties, losses, points: wins * 3 + ties, total_points_scored: 0,
});

describe('getRacesForFormat', () => {
  it('in mixed tournaments uses race_pb for PB and race_bf for FX', () => {
    const t = tournament(1, { format: 'PBFX', races: { race_pb: 'Dragón', race_bf: 'Bestia', race_libre: 'X' } });
    expect(getRacesForFormat(t)).toEqual({ pbRaces: ['Dragón'], bfRaces: ['Bestia'] });
  });

  it('in single-format tournaments both subformat races count for that format', () => {
    const pb = tournament(1, { format: 'PB', races: { race_libre: 'Faerie', race_edition_vcr: 'Titán' } });
    const fx = tournament(2, { format: 'FX', races: { race_libre: 'Sombra', race_edition_vcr: 'Eterno' } });
    expect(getRacesForFormat(pb)).toEqual({ pbRaces: ['Faerie', 'Titán'], bfRaces: [] });
    expect(getRacesForFormat(fx)).toEqual({ pbRaces: [], bfRaces: ['Sombra', 'Eterno'] });
  });
});

describe('computePlayerSummary', () => {
  it('adds up the record, podiums, most played races and winrates', () => {
    const data = [
      tournament(1, { format: 'PB', standing: standing(1, 4, 1, 0), races: { race_libre: 'Faerie', race_edition_vcr: 'Faerie' }, pbWins: 8, pbTies: 2, pbMatches: 10 }),
      tournament(2, { format: 'PB', standing: standing(3, 2, 0, 3), races: { race_libre: 'Titán', race_edition_vcr: 'Faerie' }, pbWins: 4, pbTies: 0, pbMatches: 10 }),
      tournament(3, { format: 'FX', standing: standing(5, 1, 1, 3), races: { race_libre: 'Sombra' }, bfWins: 3, bfTies: 1, bfMatches: 10 }),
    ];
    const summary = computePlayerSummary(data);
    expect(summary).toMatchObject({
      tournamentsPlayed: 3,
      totalWins: 7,
      totalTies: 2,
      totalLosses: 6,
      firstPlaceCount: 1,
      secondPlaceCount: 0,
      thirdPlaceCount: 1,
      mostPlayedRacePB: 'Faerie',
      mostPlayedRacePBPercentage: 75, // 3 of 4 PB races
      mostPlayedRaceBF: 'Sombra',
      mostPlayedRaceBFPercentage: 100,
      winRatePB: 65, // (12 + 0.5*2) / 20
      winRateBF: 35, // (3 + 0.5*1) / 10
    });
  });

  it('returns zeros for a player without tournaments', () => {
    expect(computePlayerSummary([])).toMatchObject({ tournamentsPlayed: 0, winRatePB: 0, mostPlayedRacePB: undefined });
  });
});

describe('race table', () => {
  it('lists only used races, with usage share and winrate', () => {
    const data = [
      tournament(1, { format: 'PB', races: { race_libre: 'Faerie', race_edition_vcr: 'Titán' } }),
      tournament(2, { format: 'PB', races: { race_libre: 'Faerie' } }),
    ];
    expect(raceUsage(data, 'pb')).toEqual({ Faerie: 2, Titán: 1 });
    expect(prepareTableData(raceUsage(data, 'pb'), { Faerie: 60 }, 'pb')).toEqual([
      { race: 'Faerie', vecesUsada: 2, porcentaje: 67, winrate: 60 },
      { race: 'Titán', vecesUsada: 1, porcentaje: 33, winrate: 0 },
    ]);
  });
});

describe('getFormatBadges', () => {
  it('shows every subformat of a mixed tournament', () => {
    expect(getFormatBadges(tournament(1, { format: 'PBFX', subformat: null })).map((b) => b.label)).toEqual([
      'PB Racial Libre',
      'PB Racial Edición',
      'FX Racial Libre',
      'FX Racial VCR',
    ]);
  });
});

describe('raceWinrates', () => {
  it('keeps PB and FX separate in PBFX tournaments, even for a race name both blocks share', () => {
    const data = [
      // PB Dragón: 3/4 wins. FX Dragón: 0/4 wins.
      tournament(1, { format: 'PBFX', races: { race_pb: 'Dragón', race_bf: 'Dragón' }, pbWins: 3, pbTies: 0, pbMatches: 4, bfWins: 0, bfTies: 0, bfMatches: 4 }),
    ];
    expect(raceWinrates(data, 'pb')).toEqual({ Dragón: 75 });
    expect(raceWinrates(data, 'bf')).toEqual({ Dragón: 0 });
  });

  it('counts every match of a single-format tournament for that block', () => {
    const data = [
      tournament(1, { format: 'PB', races: { race_libre: 'Faerie' }, pbWins: 1, pbTies: 2, pbMatches: 4 }),
    ];
    expect(raceWinrates(data, 'pb')).toEqual({ Faerie: 50 });
    expect(raceWinrates(data, 'bf')).toEqual({});
  });
});
