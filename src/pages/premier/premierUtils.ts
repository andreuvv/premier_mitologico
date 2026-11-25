import type { APIFixtureResponse, APIStanding } from '../../services/fixtureAPI';
import { orderedStandings, playoffWinnerIds } from '../../utils/finalPositions';

export interface StandingsView {
  standings: APIStanding[];
  playoffWinners: Set<number>;
  hasExtraRound: boolean;
}

export const EMPTY_STANDINGS_VIEW: StandingsView = {
  standings: [],
  playoffWinners: new Set(),
  hasExtraRound: false,
};

// Same ordering the admin uses to archive final positions (utils/finalPositions,
// covered by tests), so the public table always matches the archived result.
export const buildStandingsView = (data: APIStanding[], fixture: APIFixtureResponse): StandingsView => ({
  standings: orderedStandings(data, fixture),
  playoffWinners: playoffWinnerIds(fixture),
  hasExtraRound: fixture.rounds.some((round) => round.is_extra_round),
});

export const pointsBeforeRound = (fixture: APIFixtureResponse, playerId: number, roundNumber: number): number => {
  let points = 0;
  fixture.rounds.forEach((round) => {
    if (round.number >= roundNumber) return;
    round.matches.forEach((match) => {
      if (!match.completed || match.score1 === null || match.score2 === null) return;
      const isPlayer1 = match.player1_id === playerId;
      const isPlayer2 = match.player2_id === playerId;
      if (!isPlayer1 && !isPlayer2) return;
      const own = isPlayer1 ? match.score1 : match.score2;
      const other = isPlayer1 ? match.score2 : match.score1;
      if (own > other) points += 3;
      else if (match.player2_id !== null && own === other) points += 1;
    });
  });
  return points;
};

export const playerInitial = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';

export const companionRecordName = (format: 'PB' | 'FX' | 'PBFX' | undefined): string => {
  if (format === 'PB') return 'Edición';
  if (format === 'FX') return 'Ragnarok';
  return 'Edición/Ragnarok';
};

const isLibreRound = (subformat: string | null | undefined): boolean => {
  const sub = (subformat || '').toLowerCase();
  return sub === 'libre' || sub === 'pbrl' || sub === 'bfrl' || sub.includes('libre');
};

export const getSubformatDisplayName = (subformat: string | undefined | null): string => {
  if (!subformat) return '';
  const subformatMap: Record<string, string> = {
    'BFRL': 'Racial Libre',
    'BFVCR': 'VCR',
    'PBRL': 'Racial Libre',
    'PBRE': 'Racial Edición'
  };
  return subformatMap[subformat] || subformat;
};

export interface RecordByType {
  libre: { wins: number; ties: number; losses: number };
  edicion: { wins: number; ties: number; losses: number };
}

/** Win/tie/loss record of a player split by Racial Libre rounds vs. the other subformat. */
export const recordByRoundType = (fixture: APIFixtureResponse | null, playerName: string): RecordByType => {
  const record: RecordByType = {
    libre: { wins: 0, ties: 0, losses: 0 },
    edicion: { wins: 0, ties: 0, losses: 0 }
  };

  if (!fixture) return record;

  fixture.rounds.forEach(round => {
    const targetRecord = isLibreRound(round.subformat) ? record.libre : record.edicion;

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

export type MatrixOutcome = 'win' | 'lose' | 'tie' | null;

/** Result of rowPlayer against colPlayer, from rowPlayer's point of view. */
export const matrixResult = (
  fixture: APIFixtureResponse,
  rowPlayerId: number,
  colPlayerId: number,
): { text: string; outcome: MatrixOutcome } => {
  for (const round of fixture.rounds) {
    const match = round.matches.find(m =>
      (m.player1_id === rowPlayerId && m.player2_id === colPlayerId) ||
      (m.player1_id === colPlayerId && m.player2_id === rowPlayerId)
    );
    if (!match) continue;

    const rowIsPlayer1 = match.player1_id === rowPlayerId;
    const own = rowIsPlayer1 ? match.score1 : match.score2;
    const other = rowIsPlayer1 ? match.score2 : match.score1;
    const text = `${own ?? '-'}-${other ?? '-'}`;
    if (own === null || other === null) return { text, outcome: null };
    return { text, outcome: own > other ? 'win' : own < other ? 'lose' : 'tie' };
  }
  return { text: '-', outcome: null };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
