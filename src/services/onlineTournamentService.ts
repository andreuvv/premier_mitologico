import { API_BASE_URL } from '../config/api';
import {
  fetchActiveStandings,
  fetchActiveTournament,
  fetchArchivedStandings,
  fetchMatches,
  fetchPremierPlayers,
  fetchTournaments,
  playerName,
  supabaseHasTournaments,
} from './tournamentQueries';

export interface OnlineTournament {
  id: number;
  name: string;
  month: string;
  year: number;
  type: string;
  format: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface OnlineStanding {
  tournament_id: number;
  player_id: number;
  player_name: string;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
}

export interface OnlineMatch {
  id: number;
  tournament_id: number;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  score1?: number;
  score2?: number;
  completed: boolean;
  match_date?: string;
  created_at: string;
  updated_at: string;
}

function toOnlineTournament(row: {
  id: number;
  name: string;
  month: string;
  year: number;
  tournament_type: string;
  format: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}): OnlineTournament {
  return {
    id: row.id,
    name: row.name,
    month: row.month,
    year: row.year,
    type: row.tournament_type,
    format: row.format,
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
    created_at: row.created_at,
  };
}

const onlineTournamentService = {
  async getActiveTournaments(): Promise<OnlineTournament[]> {
    try {
      if (!(await supabaseHasTournaments())) {
        const response = await fetch(`${API_BASE_URL}/tournaments/active`);
        if (!response.ok) return [];
        const tournaments = await response.json();
        return tournaments.filter((tournament: OnlineTournament) => tournament.type === 'ONLINE');
      }
      const tournament = await fetchActiveTournament();
      if (!tournament || tournament.tournament_type !== 'special_event') return [];
      return [toOnlineTournament(tournament)];
    } catch (error) {
      console.error('Error fetching active tournaments:', error);
      return [];
    }
  },

  async getTournamentStandings(tournamentId: number): Promise<OnlineStanding[]> {
    try {
      if (!(await supabaseHasTournaments())) {
        const response = await fetch(`${API_BASE_URL}/tournaments/online/${tournamentId}/standings`);
        if (!response.ok) return [];
        return response.json();
      }
      const [tournament, players] = await Promise.all([
        fetchTournaments().then((rows) => rows.find((row) => row.id === tournamentId)),
        fetchPremierPlayers(),
      ]);
      if (!tournament) return [];
      if (tournament.is_active) {
        const rows = await fetchActiveStandings();
        return rows
          .filter((row) => row.tournament_id === tournamentId)
          .map((row) => ({
            tournament_id: row.tournament_id,
            player_id: row.player_id,
            player_name: row.display_name,
            matches_played: Number(row.matches_played),
            wins: Number(row.wins),
            ties: Number(row.ties),
            losses: Number(row.losses),
            points: Number(row.points),
          }));
      }
      const rows = await fetchArchivedStandings(tournamentId);
      return rows.map((row) => ({
        tournament_id: row.tournament_id,
        player_id: row.player_id,
        player_name: playerName(players, row.player_id),
        matches_played: row.matches_played,
        wins: row.wins,
        ties: row.ties,
        losses: row.losses,
        points: row.points,
      }));
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  },

  async getTournamentMatches(tournamentId: number): Promise<OnlineMatch[]> {
    try {
      if (!(await supabaseHasTournaments())) {
        const response = await fetch(`${API_BASE_URL}/tournaments/online/${tournamentId}/matches`);
        if (!response.ok) return [];
        return response.json();
      }
      const tournaments = await fetchTournaments();
      const tournament = tournaments.find((row) => row.id === tournamentId);
      if (!tournament) return [];
      const table = tournament.is_active ? 'active_tournaments_matches' : 'archived_tournaments_matches';
      const [matches, players] = await Promise.all([
        fetchMatches(table, tournamentId),
        fetchPremierPlayers(),
      ]);
      return matches
        .filter((match) => match.player2_id !== null)
        .map((match) => ({
          id: match.id,
          tournament_id: match.tournament_id,
          player1_id: match.player1_id,
          player2_id: match.player2_id as number,
          player1_name: playerName(players, match.player1_id),
          player2_name: playerName(players, match.player2_id),
          score1: match.score1 ?? undefined,
          score2: match.score2 ?? undefined,
          completed: match.completed,
          created_at: '',
          updated_at: match.updated_at ?? '',
        }));
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  },

  async getTournamentInfo(tournamentId: number): Promise<OnlineTournament | null> {
    try {
      if (!(await supabaseHasTournaments())) {
        const response = await fetch(`${API_BASE_URL}/tournaments/online/${tournamentId}/info`);
        if (!response.ok) return null;
        return response.json();
      }
      const tournaments = await fetchTournaments();
      const tournament = tournaments.find((row) => row.id === tournamentId);
      return tournament ? toOnlineTournament(tournament) : null;
    } catch (error) {
      console.error('Error fetching tournament info:', error);
      return null;
    }
  },
};

export default onlineTournamentService;
