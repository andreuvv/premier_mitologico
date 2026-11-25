import { describe, expect, it } from 'vitest';
import {
  finalsPairs,
  generateSwissRound,
  previousRoundsReady,
  standingPoints,
  type SwissHistoryMatch,
} from './swissPairing';

const played = (p1: number, p2: number | null, s1: number | null, s2: number | null, completed = true): SwissHistoryMatch => ({
  player1_id: p1,
  player2_id: p2,
  score1: s1,
  score2: s2,
  completed,
});

const base = { format: 'FX' as const, subformat1Id: 1, subformat2Id: null };

describe('standingPoints', () => {
  it('gives 3 for a win or a bye, 1 for a tie and 0 for pending matches', () => {
    const history = [
      played(1, 2, 2, 0), // 1 wins
      played(1, 3, 1, 1), // tie
      played(1, null, null, null), // bye
      played(1, 4, null, null, false), // pending
    ];
    expect(standingPoints(1, history)).toBe(7);
    expect(standingPoints(2, history)).toBe(0);
    expect(standingPoints(3, history)).toBe(1);
  });
});

describe('previousRoundsReady', () => {
  it('requires every real match to be completed (byes do not count)', () => {
    expect(previousRoundsReady([played(1, 2, 2, 0), played(3, null, null, null, false)])).toBe(true);
    expect(previousRoundsReady([played(1, 2, null, null, false)])).toBe(false);
  });
});

describe('generateSwissRound', () => {
  it('pairs every player exactly once in the first round', () => {
    const round = generateSwissRound({ ...base, playerIds: [1, 2, 3, 4], history: [], roundNumber: 1 });
    const seen = round!.matches.flatMap((m) => [m.player1_id, m.player2_id]);
    expect(round!.matches).toHaveLength(2);
    expect(new Set(seen)).toEqual(new Set([1, 2, 3, 4]));
  });

  it('pairs winners with winners and avoids rematches', () => {
    const history = [played(1, 2, 2, 0), played(3, 4, 2, 1)];
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const round = generateSwissRound({ ...base, playerIds: [1, 2, 3, 4], history, roundNumber: 2 });
      const pairs = round!.matches.map((m) => [m.player1_id, m.player2_id].sort().join('-')).sort();
      expect(pairs).toEqual(['1-3', '2-4']);
    }
  });

  it('gives the bye to the lowest-ranked player who has not had one yet', () => {
    // Ranking: 3 and 5 (3 pts), 1 and 2 (1 pt), 4 (0 pts). 5 already had a bye,
    // so the bye goes to 4, the lowest-ranked player without one.
    const history = [played(1, 2, 1, 1), played(3, 4, 2, 0), played(5, null, null, null)];
    const round = generateSwissRound({ ...base, playerIds: [1, 2, 3, 4, 5], history, roundNumber: 2 });
    const bye = round!.matches.find((m) => m.player2_id === null);
    expect(bye?.player1_id).toBe(4);
    expect(round!.matches).toHaveLength(3);
  });

  it('returns null with fewer than two players', () => {
    expect(generateSwissRound({ ...base, playerIds: [1], history: [], roundNumber: 1 })).toBeNull();
  });
});

describe('finalsPairs', () => {
  it('pairs 1st vs 2nd and 3rd vs 4th by points, then wins, then id', () => {
    const history = [
      played(1, 2, 2, 0),
      played(3, 4, 2, 0),
      played(1, 3, 2, 0),
      played(2, 4, 2, 0),
      played(5, 6, 1, 1),
    ];
    // points: 1→6, 3→3, 2→3, 4→0, 5→1, 6→1
    expect(finalsPairs([1, 2, 3, 4, 5, 6], history)).toEqual([
      [1, 2],
      [3, 5],
    ]);
  });
});
