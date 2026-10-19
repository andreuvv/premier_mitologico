import type { RoundRobinMatch, RoundRobinRound } from './roundRobin';

export interface SwissHistoryMatch {
  player1_id: number;
  player2_id: number | null;
  score1: number | null;
  score2: number | null;
  completed: boolean;
}

interface PlayerRank {
  id: number;
  points: number;
  wins: number;
  byes: number;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function standingPoints(playerId: number, matches: SwissHistoryMatch[]): number {
  return rankPlayer(playerId, matches).points;
}

function rankPlayer(playerId: number, matches: SwissHistoryMatch[]): PlayerRank {
  let points = 0;
  let wins = 0;
  let byes = 0;

  matches.forEach((match) => {
    const isPlayer1 = match.player1_id === playerId;
    const isPlayer2 = match.player2_id === playerId;
    if (!isPlayer1 && !isPlayer2) return;

    if (match.player2_id === null) {
      byes += 1;
      points += 3;
      wins += 1;
      return;
    }

    if (!match.completed || match.score1 === null || match.score2 === null) return;
    const own = isPlayer1 ? match.score1 : match.score2;
    const other = isPlayer1 ? match.score2 : match.score1;
    if (own > other) {
      points += 3;
      wins += 1;
    } else if (own === other) {
      points += 1;
    }
  });

  return { id: playerId, points, wins, byes };
}

function alreadyPlayed(left: number, right: number, matches: SwissHistoryMatch[]): boolean {
  return matches.some((match) => (
    (match.player1_id === left && match.player2_id === right)
    || (match.player1_id === right && match.player2_id === left)
  ));
}

export function previousRoundsReady(matches: SwissHistoryMatch[]): boolean {
  return matches.every((match) => match.player2_id === null || match.completed);
}

export function finalsPairs(playerIds: number[], history: SwissHistoryMatch[]): Array<[number, number]> {
  const ranked = playerIds
    .map((id) => rankPlayer(id, history))
    .sort((left, right) => right.points - left.points || right.wins - left.wins || left.id - right.id);
  const pairs: Array<[number, number]> = [];
  for (let index = 0; index + 1 < ranked.length && pairs.length < 2; index += 2) {
    pairs.push([ranked[index].id, ranked[index + 1].id]);
  }
  return pairs;
}

export function generateSwissRound(options: {
  playerIds: number[];
  history: SwissHistoryMatch[];
  roundNumber: number;
  format: 'PB' | 'FX' | 'PBFX';
  subformat1Id: number;
  subformat2Id: number | null;
}): RoundRobinRound | null {
  const { playerIds, history, roundNumber, format, subformat1Id, subformat2Id } = options;
  if (playerIds.length < 2 || roundNumber < 1) return null;

  const roundIndex = roundNumber - 1;
  const roundFormat: 'PB' | 'FX' = format === 'FX'
    ? 'FX'
    : format === 'PB'
      ? 'PB'
      : roundIndex % 2 === 0 ? 'PB' : 'FX';
  const subformatId = format === 'PBFX'
    ? (roundFormat === 'FX' ? subformat2Id : subformat1Id)
    : (roundIndex % 2 === 0 ? subformat1Id : (subformat2Id ?? subformat1Id));

  const ranked = shuffle(playerIds.map((id) => rankPlayer(id, history)))
    .sort((left, right) => right.points - left.points || right.wins - left.wins);
  const waiting = [...ranked];
  const matches: RoundRobinMatch[] = [];
  let bye: RoundRobinMatch | null = null;

  if (waiting.length % 2 === 1) {
    let byeIndex = waiting.length - 1;
    for (let index = waiting.length - 1; index >= 0; index -= 1) {
      if (waiting[index].byes === 0) {
        byeIndex = index;
        break;
      }
    }
    const sitting = waiting.splice(byeIndex, 1)[0];
    bye = { player1_id: sitting.id, player2_id: null };
  }

  while (waiting.length > 1) {
    const home = waiting.shift();
    if (!home) break;
    const opponentIndex = waiting.findIndex((player) => !alreadyPlayed(home.id, player.id, history));
    const away = waiting.splice(opponentIndex >= 0 ? opponentIndex : 0, 1)[0];
    matches.push({ player1_id: home.id, player2_id: away.id });
  }

  if (bye) matches.push(bye);

  return {
    round_number: roundNumber,
    format: roundFormat,
    subformat_id: subformatId,
    is_extra_round: false,
    matches,
  };
}
