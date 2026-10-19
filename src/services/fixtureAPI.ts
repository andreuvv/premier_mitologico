import {
  fetchActivePlayers,
  fetchActiveStandings,
  fetchActiveTournament,
  fetchMatches,
  fetchPremierPlayers,
  fetchRounds,
  fetchSubformats,
  legacyGet,
  playerName,
  subformatName,
  supabaseHasTournaments,
} from './tournamentQueries';

export interface APIMatchDetail {
  id: number;
  round_number: number;
  format: string;
  subformat?: string | null;
  player1_id: number;
  player2_id: number | null;
  player1_name: string;
  player2_name: string;
  score1: number | null;
  score2: number | null;
  completed: boolean;
  updated_at: string;
}

export interface APIFixtureRound {
  number: number;
  format: string;
  subformat?: string | null;
  is_extra_round: boolean;
  matches: APIMatchDetail[];
}

export interface APIFixtureResponse {
  rounds: APIFixtureRound[];
}

export interface APIStanding {
  id: number;
  name: string;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  total_points_scored: number;
  total_matches: number;
}

export interface APIPlayer {
  id: number;
  name: string;
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

async function loadActiveFixture(): Promise<APIFixtureResponse> {
  const tournament = await fetchActiveTournament();
  if (!tournament) return { rounds: [] };

  const [rounds, matches, players, subformats] = await Promise.all([
    fetchRounds('active_tournaments_rounds', tournament.id),
    fetchMatches('active_tournaments_matches', tournament.id),
    fetchPremierPlayers(),
    fetchSubformats(),
  ]);

  return {
    rounds: rounds.map((round) => ({
      number: round.round_number,
      format: round.format,
      subformat: subformatName(subformats, round.subformat_id),
      is_extra_round: round.is_extra_round,
      matches: matches
        .filter((match) => match.round_id === round.id)
        .map((match) => ({
          id: match.id,
          round_number: round.round_number,
          format: round.format,
          subformat: subformatName(subformats, round.subformat_id),
          player1_id: match.player1_id,
          player2_id: match.player2_id,
          player1_name: playerName(players, match.player1_id),
          player2_name: playerName(players, match.player2_id),
          score1: match.score1,
          score2: match.score2,
          completed: match.completed,
          updated_at: match.updated_at ?? '',
        })),
    })),
  };
}

export const fixtureAPI = {
  getFixture: async (): Promise<APIFixtureResponse> => {
    const tournament = await fetchActiveTournament();
    if (!tournament && !(await supabaseHasTournaments())) return legacyGet<APIFixtureResponse>('/fixture');
    return loadActiveFixture();
  },

  getStandings: async (): Promise<APIStanding[]> => {
    const tournament = await fetchActiveTournament();
    if (!tournament && !(await supabaseHasTournaments())) return legacyGet<APIStanding[]>('/standings');
    const rows = await fetchActiveStandings();
    return rows.map((row) => ({
      id: row.player_id,
      name: row.display_name,
      matches_played: Number(row.matches_played),
      wins: Number(row.wins),
      ties: Number(row.ties),
      losses: Number(row.losses),
      points: Number(row.points),
      total_points_scored: Number(row.total_points_scored),
      total_matches: Number(row.total_matches),
    }));
  },

  getPlayers: async (): Promise<APIPlayer[]> => {
    const tournament = await fetchActiveTournament();
    if (!tournament && !(await supabaseHasTournaments())) return legacyGet<APIPlayer[]>('/players');
    if (!tournament) return [];
    const [roster, players] = await Promise.all([
      fetchActivePlayers(tournament.id),
      fetchPremierPlayers(),
    ]);
    return roster.map((row) => ({
      id: row.player_id,
      name: playerName(players, row.player_id),
      confirmed: row.confirmed,
      created_at: row.created_at,
      updated_at: row.created_at,
    }));
  },

  getPremierPlayers: async (): Promise<APIPlayer[]> => {
    const players = await fetchPremierPlayers();
    return players.map((player) => ({
      id: player.premier_id,
      name: player.display_name,
      confirmed: true,
      created_at: '',
      updated_at: '',
    }));
  },
};
