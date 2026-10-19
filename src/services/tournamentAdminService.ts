import { supabase } from '../config/supabase';
import type { RoundRobinRound } from '../utils/roundRobin';

export interface CreateTournamentInput {
  name: string;
  month: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  format: 'PB' | 'FX' | 'PBFX';
  subformat1Id: number;
  subformat2Id: number | null;
  tournamentType: 'premier_mitoxico' | 'special_event';
  playerIds: number[];
  locationName: string | null;
  locationAddress: string | null;
}

export interface ArchiveStandingInput {
  player_id: number;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  total_points_scored: number;
  total_matches: number;
  final_position: number;
}

function raise(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

export const tournamentAdminAPI = {
  createTournament: async (input: CreateTournamentInput): Promise<number> => {
    const { data, error } = await supabase.rpc('create_tournament', {
      p_name: input.name,
      p_month: input.month,
      p_year: input.year,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_format: input.format,
      p_subformat1_id: input.subformat1Id,
      p_subformat2_id: input.subformat2Id,
      p_tournament_type: input.tournamentType,
      p_player_ids: input.playerIds,
      p_location_name: input.locationName,
      p_location_address: input.locationAddress,
    });
    raise(error, 'No se pudo crear el torneo');
    return Number(data);
  },

  updateTournament: async (input: CreateTournamentInput): Promise<void> => {
    const { error } = await supabase.rpc('update_active_tournament', {
      p_name: input.name,
      p_month: input.month,
      p_year: input.year,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_format: input.format,
      p_subformat1_id: input.subformat1Id,
      p_subformat2_id: input.subformat2Id,
      p_tournament_type: input.tournamentType,
      p_player_ids: input.playerIds,
      p_location_name: input.locationName,
      p_location_address: input.locationAddress,
    });
    raise(error, 'No se pudo actualizar el torneo');
  },

  replaceFixture: async (rounds: RoundRobinRound[]) => {
    const { error } = await supabase.rpc('replace_active_fixture', {
      p_rounds: rounds,
    });
    raise(error, 'No se pudo guardar el fixture');
  },

  setPairingMode: async (mode: 'fixed' | 'progressive') => {
    const { error } = await supabase.rpc('set_active_pairing_mode', {
      p_mode: mode,
    });
    raise(error, 'No se pudo guardar el tipo de rondas');
  },

  appendRound: async (round: RoundRobinRound) => {
    const { error } = await supabase.rpc('append_active_round', {
      p_round: round,
    });
    raise(error, 'No se pudo guardar la ronda');
  },

  updateScore: async (matchId: number, score1: number, score2: number) => {
    const { error } = await supabase.rpc('update_match_score', {
      p_match_id: matchId,
      p_score1: score1,
      p_score2: score2,
    });
    raise(error, 'No se pudo guardar el marcador');
  },

  saveRace: async (playerId: number, raceFormat1: string, raceFormat2: string) => {
    const { error } = await supabase.rpc('upsert_player_race', {
      p_player_id: playerId,
      p_race_format1: raceFormat1,
      p_race_format2: raceFormat2,
    });
    raise(error, 'No se pudo guardar la raza');
  },

  archive: async (standings: ArchiveStandingInput[]) => {
    const { error } = await supabase.rpc('archive_active_tournament', {
      p_standings: standings,
    });
    raise(error, 'No se pudo archivar el torneo');
  },

  clear: async (clearPlayers: boolean) => {
    const { error } = await supabase.rpc('clear_active_tournament', {
      p_clear_players: clearPlayers,
    });
    raise(error, 'No se pudo limpiar el torneo');
  },

  setConfirmed: async (playerId: number, confirmed: boolean) => {
    const { error } = await supabase.rpc('set_active_player_confirmed', {
      p_player_id: playerId,
      p_confirmed: confirmed,
    });
    raise(error, 'No se pudo actualizar la confirmación');
  },
};
