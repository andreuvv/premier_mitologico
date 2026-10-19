export interface RoundRobinMatch {
  player1_id: number;
  player2_id: number | null;
}

export interface RoundRobinRound {
  round_number: number;
  format: 'PB' | 'FX';
  subformat_id: number | null;
  is_extra_round: boolean;
  matches: RoundRobinMatch[];
}

const BYE = -1;

function positiveMod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function fullCycleLength(playerCount: number): number {
  if (playerCount < 2) return 1;
  return playerCount % 2 === 0 ? playerCount - 1 : playerCount;
}

export function generateRoundRobin(options: {
  playerIds: number[];
  roundCount: number;
  format: 'PB' | 'FX' | 'PBFX';
  subformat1Id: number;
  subformat2Id: number | null;
  includeExtraRound: boolean;
}): RoundRobinRound[] {
  const { playerIds, roundCount, format, subformat1Id, subformat2Id, includeExtraRound } = options;
  if (playerIds.length < 2 || roundCount < 1) return [];

  const shuffled = shuffle(playerIds);
  const working = shuffled.length % 2 === 0 ? shuffled : [...shuffled, BYE];
  const size = working.length;
  const roundsPerCycle = size - 1;
  const rounds: RoundRobinRound[] = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const cycleRound = roundIndex % roundsPerCycle;
    const roundFormat: 'PB' | 'FX' = format === 'FX'
      ? 'FX'
      : format === 'PB'
        ? 'PB'
        : roundIndex % 2 === 0 ? 'PB' : 'FX';
    const subformatId = format === 'PBFX'
      ? (roundFormat === 'FX' ? subformat2Id : subformat1Id)
      : (roundIndex % 2 === 0 ? subformat1Id : (subformat2Id ?? subformat1Id));

    const matches: RoundRobinMatch[] = [];
    for (let i = 0; i < size / 2; i += 1) {
      let home = i;
      let away = size - 1 - i;
      if (home !== 0) home = positiveMod(home - cycleRound - 1, size - 1) + 1;
      if (away !== 0) away = positiveMod(away - cycleRound - 1, size - 1) + 1;

      let player1 = working[home];
      let player2 = working[away];
      if (player1 === BYE) {
        player1 = player2;
        player2 = BYE;
      }

      matches.push({
        player1_id: player1,
        player2_id: player2 === BYE ? null : player2,
      });
    }

    rounds.push({
      round_number: roundIndex + 1,
      format: roundFormat,
      subformat_id: subformatId,
      is_extra_round: false,
      matches,
    });
  }

  if (includeExtraRound) {
    const lastFormat = rounds.length > 0 ? rounds[rounds.length - 1].format : (format === 'FX' ? 'FX' : 'PB');
    rounds.push({
      round_number: rounds.length + 1,
      format: lastFormat,
      subformat_id: rounds.length > 0 ? rounds[rounds.length - 1].subformat_id : subformat1Id,
      is_extra_round: true,
      matches: [],
    });
  }

  return rounds;
}
