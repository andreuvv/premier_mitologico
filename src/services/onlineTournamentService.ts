import { API_BASE_URL, API_KEY } from '../config/api';

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

const onlineTournamentService = {
  async getActiveTournaments(): Promise<OnlineTournament[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/active`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active tournaments: ${response.status}`);
      }

      const tournaments = await response.json();
      // Filter to only online tournaments
      return tournaments.filter((t: OnlineTournament) => t.type === 'ONLINE');
    } catch (error) {
      console.error('Error fetching active tournaments:', error);
      return [];
    }
  },

  async getTournamentStandings(tournamentId: number): Promise<OnlineStanding[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tournaments/online/${tournamentId}/standings`,
        {
          headers: {
            'X-API-Key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  },

  async getTournamentMatches(tournamentId: number): Promise<OnlineMatch[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tournaments/online/${tournamentId}/matches`,
        {
          headers: {
            'X-API-Key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  },

  async getTournamentInfo(tournamentId: number): Promise<OnlineTournament | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tournaments/online/${tournamentId}/info`,
        {
          headers: {
            'X-API-Key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tournament info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tournament info:', error);
      return null;
    }
  },
};

export default onlineTournamentService;
