import { describe, expect, it } from 'vitest';
import { orderedStandings, playoffWinnerIds } from './finalPositions';
import type { APIFixtureResponse, APIFixtureRound, APIMatchDetail, APIStanding } from '../services/fixtureAPI';

function standing(id: number, points: number, totalPointsScored: number, wins: number): APIStanding {
  return {
    id,
    name: `Jugador ${id}`,
    matches_played: 3,
    wins,
    ties: 0,
    losses: 3 - wins,
    points,
    total_points_scored: totalPointsScored,
    total_matches: 3,
  };
}

let matchId = 1;
function match(player1: number, player2: number | null, score1: number | null, score2: number | null): APIMatchDetail {
  return {
    id: matchId++,
    round_number: 1,
    format: 'PB',
    player1_id: player1,
    player2_id: player2,
    player1_name: `Jugador ${player1}`,
    player2_name: player2 === null ? 'BYE' : `Jugador ${player2}`,
    score1,
    score2,
    completed: score1 !== null && score2 !== null,
    updated_at: '',
  };
}

function round(number: number, matches: APIMatchDetail[], isExtra = false): APIFixtureRound {
  return { number, format: 'PB', is_extra_round: isExtra, matches };
}

const ids = (rows: APIStanding[]) => rows.map((row) => row.id);

describe('orderedStandings', () => {
  it('orders by points, then total points scored, then wins, then id', () => {
    const standings = [
      standing(4, 6, 10, 2),
      standing(1, 3, 5, 1),
      standing(2, 6, 12, 2),
      standing(3, 6, 10, 1),
      standing(5, 3, 5, 1),
    ];
    expect(ids(orderedStandings(standings, { rounds: [] }))).toEqual([2, 4, 3, 1, 5]);
  });

  it('breaks a two-way tie with the head-to-head result', () => {
    const standings = [standing(1, 6, 10, 2), standing(2, 6, 10, 2)];
    const fixture: APIFixtureResponse = { rounds: [round(1, [match(1, 2, 0, 2)])] };
    // Without head-to-head, id 1 would go first; 2 beat 1, so 2 is ahead.
    expect(ids(orderedStandings(standings, fixture))).toEqual([2, 1]);
  });

  it('keeps the table sorted when the final round exists but has not been played', () => {
    // Regression: the public page used to return the rows unsorted in this case.
    const standings = [standing(3, 0, 1, 0), standing(1, 9, 12, 3), standing(2, 6, 8, 2)];
    const fixture: APIFixtureResponse = {
      rounds: [round(1, [match(1, 2, 2, 0)]), round(2, [match(1, 2, null, null)], true)],
    };
    expect(ids(orderedStandings(standings, fixture))).toEqual([1, 2, 3]);
  });

  it('puts the winner of the final first, whatever the totals say', () => {
    // Before the final: 1 (9 pts) seeded first, 2 (6 pts) second. 2 wins the final 2-0,
    // so the stored totals tie them on points; the final decides 1st and 2nd.
    const standings = [
      standing(1, 9, 6, 3),
      standing(2, 9, 8, 3),
      standing(3, 3, 4, 1),
      standing(4, 0, 1, 0),
    ];
    const fixture: APIFixtureResponse = {
      rounds: [round(1, [match(1, 3, 2, 0), match(2, 4, 2, 0)]), round(2, [match(1, 2, 0, 2)], true)],
    };
    expect(ids(orderedStandings(standings, fixture))).toEqual([2, 1, 3, 4]);
  });

  it('also resolves a 3rd-place match played in the final round', () => {
    const standings = [
      standing(1, 12, 10, 4),
      standing(2, 9, 8, 3),
      standing(3, 6, 4, 2), // seeded 3rd before the final round
      standing(4, 6, 6, 2), // seeded 4th, won the 3rd-place match
    ];
    const fixture: APIFixtureResponse = {
      rounds: [round(1, []), round(2, [match(1, 2, 2, 0), match(3, 4, 0, 2)], true)],
    };
    // Without the final-round results: 1 and 2 tie (9 pts, 8 scored) and keep id order;
    // 3 has 6 pts and 4 has 3, so 3 is seeded 3rd. 4 won the 3rd-place match.
    expect(ids(orderedStandings(standings, fixture))).toEqual([1, 2, 4, 3]);
  });
});

describe('playoffWinnerIds', () => {
  it('returns the winners of completed final-round matches only', () => {
    const fixture: APIFixtureResponse = {
      rounds: [
        round(1, [match(5, 6, 2, 0)]),
        round(2, [match(1, 2, 0, 2), match(3, 4, 2, 0), match(7, 8, null, null)], true),
      ],
    };
    expect([...playoffWinnerIds(fixture)].sort()).toEqual([2, 3]);
  });
});
