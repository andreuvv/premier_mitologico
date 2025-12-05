import { API_BASE_URL } from '../config/api';

// API Response Types
export interface APIMatchDetail {
  id: number;
  round_number: number;
  format: string;
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
  losses: number;
  total_points_scored: number;
  total_points_against: number;
}

export interface APIPlayer {
  id: number;
  name: string;
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

// API Service Functions
export const fixtureAPI = {
  // Get complete fixture
  getFixture: async (): Promise<APIFixtureResponse> => {
    const response = await fetch(`${API_BASE_URL}/fixture`);
    if (!response.ok) {
      throw new Error('Failed to fetch fixture');
    }
    return response.json();
  },

  // Get standings
  getStandings: async (): Promise<APIStanding[]> => {
    const response = await fetch(`${API_BASE_URL}/standings`);
    if (!response.ok) {
      throw new Error('Failed to fetch standings');
    }
    return response.json();
  },

  // Get players
  getPlayers: async (): Promise<APIPlayer[]> => {
    const response = await fetch(`${API_BASE_URL}/players`);
    if (!response.ok) {
      throw new Error('Failed to fetch players');
    }
    return response.json();
  }
};
