import { describe, expect, it } from 'vitest';
import { fullCycleLength, generateRoundRobin, type RoundRobinRound } from './roundRobin';

const base = { format: 'PB' as const, subformat1Id: 10, subformat2Id: 20, includeExtraRound: false };

function pairKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function realPairs(rounds: RoundRobinRound[]) {
  return rounds.flatMap((round) =>
    round.matches.filter((m) => m.player2_id !== null).map((m) => pairKey(m.player1_id, m.player2_id as number)),
  );
}

describe('fullCycleLength', () => {
  it('needs n-1 rounds for an even number of players and n for an odd one', () => {
    expect(fullCycleLength(4)).toBe(3);
    expect(fullCycleLength(6)).toBe(5);
    expect(fullCycleLength(5)).toBe(5);
    expect(fullCycleLength(1)).toBe(1);
  });
});

describe('generateRoundRobin', () => {
  it('returns no rounds with fewer than two players', () => {
    expect(generateRoundRobin({ ...base, playerIds: [1], roundCount: 3 })).toEqual([]);
  });

  it('with an even number of players, everyone meets everyone exactly once in a full cycle', () => {
    const players = [1, 2, 3, 4, 5, 6];
    const rounds = generateRoundRobin({ ...base, playerIds: players, roundCount: fullCycleLength(players.length) });

    expect(rounds).toHaveLength(5);
    rounds.forEach((round) => {
      const seen = round.matches.flatMap((m) => [m.player1_id, m.player2_id]);
      expect(new Set(seen).size).toBe(players.length); // nobody plays twice in a round
      expect(seen).not.toContain(null); // no byes
    });
    const pairs = realPairs(rounds);
    expect(pairs).toHaveLength(15); // C(6,2)
    expect(new Set(pairs).size).toBe(15);
  });

  it('with an odd number of players, each player gets exactly one bye per cycle', () => {
    const players = [1, 2, 3, 4, 5];
    const rounds = generateRoundRobin({ ...base, playerIds: players, roundCount: fullCycleLength(players.length) });

    const byes = rounds.flatMap((round) => round.matches.filter((m) => m.player2_id === null).map((m) => m.player1_id));
    expect(byes.sort()).toEqual(players);
    const pairs = realPairs(rounds);
    expect(new Set(pairs).size).toBe(10); // C(5,2), no repeats
    expect(pairs).toHaveLength(10);
  });

  it('alternates PB and FX rounds (with their subformats) in PBFX tournaments', () => {
    const rounds = generateRoundRobin({ ...base, format: 'PBFX', playerIds: [1, 2, 3, 4], roundCount: 3 });
    expect(rounds.map((r) => [r.format, r.subformat_id])).toEqual([
      ['PB', 10],
      ['FX', 20],
      ['PB', 10],
    ]);
  });

  it('appends an empty extra round (final) when requested', () => {
    const rounds = generateRoundRobin({ ...base, includeExtraRound: true, playerIds: [1, 2, 3, 4], roundCount: 3 });
    const last = rounds[rounds.length - 1];
    expect(rounds).toHaveLength(4);
    expect(last).toMatchObject({ round_number: 4, is_extra_round: true, matches: [] });
  });
});
