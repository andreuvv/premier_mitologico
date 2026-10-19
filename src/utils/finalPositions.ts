import type { APIFixtureResponse, APIStanding } from '../services/fixtureAPI';

export function orderedStandings(standings: APIStanding[], fixture: APIFixtureResponse): APIStanding[] {
  const sorted = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.total_points_scored !== b.total_points_scored) return b.total_points_scored - a.total_points_scored;
    if (a.wins !== b.wins) return b.wins - a.wins;
    return a.id - b.id;
  });

  for (let index = 0; index < sorted.length;) {
    let end = index + 1;
    while (
      end < sorted.length
      && sorted[index].points === sorted[end].points
      && sorted[index].total_points_scored === sorted[end].total_points_scored
      && sorted[index].wins === sorted[end].wins
    ) {
      end += 1;
    }
    if (end - index === 2 && headToHeadWinner(fixture, sorted[index].id, sorted[end - 1].id) === sorted[end - 1].id) {
      [sorted[index], sorted[end - 1]] = [sorted[end - 1], sorted[index]];
    }
    index = end;
  }

  return applyPlayoffOrder(sorted, fixture);
}

function headToHeadWinner(fixture: APIFixtureResponse, idA: number, idB: number): number | null {
  let winsA = 0;
  let winsB = 0;
  for (const round of fixture.rounds) {
    if (round.is_extra_round) continue;
    for (const match of round.matches) {
      if (!match.completed || match.score1 === null || match.score2 === null || match.score1 === match.score2) continue;
      const players = [match.player1_id, match.player2_id];
      if (!players.includes(idA) || !players.includes(idB)) continue;
      const winner = match.score1 > match.score2 ? match.player1_id : match.player2_id;
      if (winner === idA) winsA += 1;
      else if (winner === idB) winsB += 1;
    }
  }
  if (winsA > winsB) return idA;
  if (winsB > winsA) return idB;
  return null;
}

function applyPlayoffOrder(standings: APIStanding[], fixture: APIFixtureResponse): APIStanding[] {
  const extraMatches = fixture.rounds
    .filter((round) => round.is_extra_round)
    .flatMap((round) => round.matches)
    .filter((match) => match.completed && match.score1 !== null && match.score2 !== null && match.player2_id !== null);

  if (extraMatches.length === 0) return standings;

  const preExtra = new Map(standings.map((standing) => [standing.id, { ...standing }]));
  extraMatches.forEach((match) => {
    const first = preExtra.get(match.player1_id);
    const second = match.player2_id === null ? undefined : preExtra.get(match.player2_id);
    if (!first || !second || match.score1 === null || match.score2 === null) return;
    first.total_points_scored -= match.score1;
    second.total_points_scored -= match.score2;
    if (match.score1 > match.score2) {
      first.points -= 3;
      first.wins -= 1;
    } else if (match.score2 > match.score1) {
      second.points -= 3;
      second.wins -= 1;
    } else {
      first.points -= 1;
      second.points -= 1;
      first.ties -= 1;
      second.ties -= 1;
    }
  });

  const seeded = orderedStandings(Array.from(preExtra.values()), { rounds: fixture.rounds.filter((round) => !round.is_extra_round) });
  const seed = new Map(seeded.map((standing, index) => [standing.id, index + 1]));
  const overrides = new Map<number, number>();
  extraMatches.forEach((match) => {
    if (match.player2_id === null || match.score1 === null || match.score2 === null || match.score1 === match.score2) return;
    const firstSeed = seed.get(match.player1_id) ?? 999;
    const secondSeed = seed.get(match.player2_id) ?? 999;
    const higher = Math.min(firstSeed, secondSeed);
    const lower = Math.max(firstSeed, secondSeed);
    if (match.score1 > match.score2) {
      overrides.set(match.player1_id, higher);
      overrides.set(match.player2_id, lower);
    } else {
      overrides.set(match.player2_id, higher);
      overrides.set(match.player1_id, lower);
    }
  });

  if (overrides.size === 0) return seeded;

  const rest = seeded.filter((standing) => !overrides.has(standing.id));
  const result: Array<APIStanding | undefined> = new Array(seeded.length);
  overrides.forEach((position, playerId) => {
    const standing = standings.find((row) => row.id === playerId);
    if (standing) result[position - 1] = standing;
  });
  let restIndex = 0;
  for (let index = 0; index < result.length; index += 1) {
    if (!result[index]) result[index] = rest[restIndex++];
  }
  return result.filter((standing): standing is APIStanding => Boolean(standing));
}
