import { supabase } from '../config/supabase';
import { queryClient, queryKeys } from '../lib/queryClient';
import { asJson, nullableArg } from '../lib/supabaseTypes';
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

const rawTournamentAdminAPI = {
  createTournament: async (input: CreateTournamentInput): Promise<number> => {
    const { data, error } = await supabase.rpc('create_tournament', {
      p_name: input.name,
      p_month: input.month,
      p_year: input.year,
      p_start_date: nullableArg(input.startDate),
      p_end_date: nullableArg(input.endDate),
      p_format: input.format,
      p_subformat1_id: input.subformat1Id,
      p_subformat2_id: nullableArg(input.subformat2Id),
      p_tournament_type: input.tournamentType,
      p_player_ids: input.playerIds,
      p_location_name: nullableArg(input.locationName),
      p_location_address: nullableArg(input.locationAddress),
    });
    raise(error, 'No se pudo crear el torneo');
    return Number(data);
  },

  updateTournament: async (input: CreateTournamentInput): Promise<void> => {
    const { error } = await supabase.rpc('update_active_tournament', {
      p_name: input.name,
      p_month: input.month,
      p_year: input.year,
      p_start_date: nullableArg(input.startDate),
      p_end_date: nullableArg(input.endDate),
      p_format: input.format,
      p_subformat1_id: input.subformat1Id,
      p_subformat2_id: nullableArg(input.subformat2Id),
      p_tournament_type: input.tournamentType,
      p_player_ids: input.playerIds,
      p_location_name: nullableArg(input.locationName),
      p_location_address: nullableArg(input.locationAddress),
    });
    raise(error, 'No se pudo actualizar el torneo');
  },

  replaceFixture: async (rounds: RoundRobinRound[]) => {
    const { error } = await supabase.rpc('replace_active_fixture', {
      p_rounds: asJson(rounds),
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
      p_round: asJson(round),
    });
    raise(error, 'No se pudo guardar la ronda');
  },

  /** Saves a place to offer in the tournament form. */
  createVenue: async (name: string, address: string) => {
    const { error } = await supabase.from('tournament_venues').insert({ name: name.trim(), address: address.trim() });
    if (error?.code === '23505') throw new Error(`Ya existe un lugar llamado "${name.trim()}"`);
    raise(error, 'No se pudo guardar el lugar');
  },

  /** Renames a saved place or changes its address. Past tournaments keep their own copy. */
  updateVenue: async (id: number, name: string, address: string) => {
    const { data, error } = await supabase
      .from('tournament_venues')
      .update({ name: name.trim(), address: address.trim() })
      .eq('id', id)
      .select('id');
    if (error?.code === '23505') throw new Error(`Ya existe un lugar llamado "${name.trim()}"`);
    raise(error, 'No se pudo actualizar el lugar');
    // Row-level security turns a forbidden update into "0 rows" instead of an error.
    if (!data?.length) throw new Error('No se pudo actualizar el lugar (¿sesión de admin?)');
  },

  /** Removes a place from the list. Tournaments that used it keep their name and address. */
  deleteVenue: async (id: number) => {
    const { data, error } = await supabase.from('tournament_venues').delete().eq('id', id).select('id');
    raise(error, 'No se pudo borrar el lugar');
    if (!data?.length) throw new Error('No se pudo borrar el lugar (¿sesión de admin?)');
  },

  /** Deletes one saved round (with its matches and scores); later rounds move up one number. */
  deleteRound: async (roundNumber: number) => {
    const { error } = await supabase.rpc('delete_active_round', {
      p_round_number: roundNumber,
    });
    raise(error, 'No se pudo borrar la ronda');
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
      p_standings: asJson(standings),
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

type AdminAPI = typeof rawTournamentAdminAPI;

// Every admin write changes tournament data: after it succeeds, mark the cached
// tournament data stale so the next read (in this tab) gets fresh rows.
// Archiving also changes archived data, so the whole tournaments prefix is invalidated.
export const tournamentAdminAPI = Object.fromEntries(
  Object.entries(rawTournamentAdminAPI).map(([name, method]) => [
    name,
    async (...args: unknown[]) => {
      const result = await (method as (...a: unknown[]) => Promise<unknown>)(...args);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      return result;
    },
  ]),
) as AdminAPI;
