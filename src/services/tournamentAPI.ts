import { API_BASE_URL } from '../config/api';

export interface Tournament {
  id: number;
  name: string;
  month: string;
  year: number;
  type: string;
  format?: string | null; // 'PB', 'BF', or null (both formats)
  subformat?: string | null; // e.g. 'Libre', 'VCR', 'Edición', etc.
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
  race_libre: string | null;
  race_edition_vcr: string | null;
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
  is_extra_round: boolean;
  subformat?: string | null;
  matches: TournamentMatch[];
}

export interface TournamentRoundsResponse {
  tournament_name: string;
  rounds: TournamentRound[];
}

export interface TournamentRacesResponse {
  pb_races: { [race: string]: number };
  bf_races: { [race: string]: number };
  libre_races: { [race: string]: number };
  vcr_races: { [race: string]: number };
  pb_race_winrates: { [race: string]: number };
  bf_race_winrates: { [race: string]: number };
  libre_race_winrates?: { [race: string]: number };
  vcr_race_winrates?: { [race: string]: number };
}

export interface GlobalStanding {
  player_id: number;
  player_name: string;
  first_place_count: number;
  second_place_count: number;
  third_place_count: number;
  most_played_race_pb: string | null;
  most_played_race_bf: string | null;
  winrate_pb: number;
  winrate_bf: number;
}

export const tournamentAPI = {
  getTournaments: async (): Promise<Tournament[]> => {
    const response = await fetch(`${API_BASE_URL}/tournaments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
    }
    return response.json();
  },

  getTournamentStandings: async (tournamentId: number): Promise<TournamentStanding[]> => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/standings`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament standings: ${response.statusText}`);
    }
    return response.json();
  },

  getTournamentRounds: async (tournamentId: number): Promise<TournamentRoundsResponse> => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/rounds`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament rounds: ${response.statusText}`);
    }
    return response.json();
  },

  getTournamentRaces: async (tournamentId: number): Promise<TournamentRacesResponse> => {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/races`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament races: ${response.statusText}`);
    }
    return response.json();
  },

  getGlobalStandings: async (): Promise<GlobalStanding[]> => {
    const response = await fetch(`${API_BASE_URL}/global-standings`);
    if (!response.ok) {
      throw new Error(`Failed to fetch global standings: ${response.statusText}`);
    }
    return response.json();
  },

  getGlobalRaces: async (): Promise<TournamentRacesResponse> => {
    const response = await fetch(`${API_BASE_URL}/global-races`);
    if (!response.ok) {
      throw new Error(`Failed to fetch global races: ${response.statusText}`);
    }
    return response.json();
  },
};
