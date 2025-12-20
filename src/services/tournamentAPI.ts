import { API_BASE_URL, API_KEY } from '../config/api';

export interface Tournament {
  id: number;
  name: string;
  month: string;
  year: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  archived_at: string;
}

export interface TournamentStanding {
  id: number;
  tournament_id: number;
  player_id: number;
  player_name: string;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  total_points_scored: number;
  total_matches: number;
  final_position: number;
  race_pb: string | null;
  race_bf: string | null;
}

export interface TournamentMatch {
  id: number;
  player1_name: string;
  player2_name: string;
  score1: number | null;
  score2: number | null;
  completed: boolean;
}

export interface TournamentRound {
  number: number;
  format: string;
  matches: TournamentMatch[];
}

export interface TournamentRoundsResponse {
  tournament_name: string;
  rounds: TournamentRound[];
}

export interface TournamentRacesResponse {
  pb_races: { [race: string]: number };
  bf_races: { [race: string]: number };
}

export const tournamentAPI = {
  getTournaments: async (): Promise<Tournament[]> => {
    const response = await fetch(`${API_BASE_URL}/tournaments`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
    }
    return response.json();
  },

  getTournamentStandings: async (tournamentId: number): Promise<TournamentStanding[]> => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/standings`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament standings: ${response.statusText}`);
    }
    return response.json();
  },

  getTournamentRounds: async (tournamentId: number): Promise<TournamentRoundsResponse> => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/rounds`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament rounds: ${response.statusText}`);
    }
    return response.json();
  },

  getTournamentRaces: async (tournamentId: number): Promise<TournamentRacesResponse> => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/races`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament races: ${response.statusText}`);
    }
    return response.json();
  },
};
