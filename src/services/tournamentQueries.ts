import { supabase } from '../config/supabase';
import { API_BASE_URL } from '../config/api';

export async function supabaseHasTournaments(): Promise<boolean> {
  const { count, error } = await supabase
    .from('tournaments')
    .select('id', { count: 'exact', head: true });
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function legacyGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  return response.json() as Promise<T>;
}


export interface PremierPlayerRow {
  premier_id: number;
  display_name: string;
}

export interface TournamentRow {
  id: number;
  name: string;
  month: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  format: 'PB' | 'FX' | 'PBFX';
  subformat1_id: number | null;
  subformat2_id: number | null;
  tournament_type: 'premier_mitoxico' | 'special_event';
  location_name: string | null;
  location_address: string | null;
  pairing_mode: 'fixed' | 'progressive';
  created_at: string;
  archived_at: string | null;
}

export interface RoundRow {
  id: number;
  tournament_id: number;
  round_number: number;
  format: 'PB' | 'FX';
  subformat_id: number | null;
  is_extra_round: boolean;
}

export interface MatchRow {
  id: number;
  tournament_id: number;
  round_id: number;
  player1_id: number;
  player2_id: number | null;
  score1: number | null;
  score2: number | null;
  completed: boolean;
  updated_at?: string;
}

export interface StandingRow {
  id: number;
  tournament_id: number;
  player_id: number;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  total_points_scored: number;
  total_matches: number;
  final_position: number | null;
}

export interface RaceRow {
  tournament_id: number;
  player_id: number;
  race_format1: string | null;
  race_format2: string | null;
}

export interface SubformatRow {
  subformat_id: number;
  subformat_name: string;
}

export interface ActiveStandingRow {
  tournament_id: number;
  player_id: number;
  display_name: string;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  total_points_scored: number;
  total_matches: number;
}

export interface ActivePlayerRow {
  player_id: number;
  confirmed: boolean;
  created_at: string;
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, label: string): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data as T;
}

export async function fetchPremierPlayers(): Promise<PremierPlayerRow[]> {
  const result = await supabase
    .from('premier_players')
    .select('premier_id, display_name')
    .order('premier_id');
  return unwrap(result, 'premier_players');
}

export async function fetchSubformats(): Promise<SubformatRow[]> {
  const result = await supabase
    .from('game_subformats')
    .select('subformat_id, subformat_name')
    .order('subformat_id');
  return unwrap(result, 'game_subformats');
}

export async function fetchActiveTournament(): Promise<TournamentRow | null> {
  const result = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  if (result.error) throw new Error(`tournaments: ${result.error.message}`);
  return result.data;
}

export async function fetchTournaments(): Promise<TournamentRow[]> {
  const result = await supabase
    .from('tournaments')
    .select('*')
    .order('year', { ascending: false });
  return unwrap(result, 'tournaments');
}

export async function fetchActivePlayers(tournamentId: number): Promise<ActivePlayerRow[]> {
  const result = await supabase
    .from('active_tournament_player')
    .select('player_id, confirmed, created_at')
    .eq('tournament_id', tournamentId)
    .order('player_id');
  return unwrap(result, 'active_tournament_player');
}

export async function fetchRounds(table: 'active_tournaments_rounds' | 'archived_tournaments_rounds', tournamentId: number): Promise<RoundRow[]> {
  const result = await supabase
    .from(table)
    .select('id, tournament_id, round_number, format, subformat_id, is_extra_round')
    .eq('tournament_id', tournamentId)
    .order('round_number');
  return unwrap(result, table);
}

export async function fetchMatches(table: 'active_tournaments_matches' | 'archived_tournaments_matches', tournamentId: number): Promise<MatchRow[]> {
  const result = await supabase
    .from(table)
    .select('id, tournament_id, round_id, player1_id, player2_id, score1, score2, completed')
    .eq('tournament_id', tournamentId);
  return unwrap(result, table);
}

export async function fetchActiveStandings(): Promise<ActiveStandingRow[]> {
  const result = await supabase.from('active_tournament_standings').select('*');
  return unwrap(result, 'active_tournament_standings');
}

export async function fetchArchivedStandings(tournamentId?: number): Promise<StandingRow[]> {
  let query = supabase.from('archived_tournaments_standings').select('*');
  if (tournamentId !== undefined) query = query.eq('tournament_id', tournamentId);
  const result = await query;
  return unwrap(result, 'archived_tournaments_standings');
}

export async function fetchRaces(tournamentId?: number): Promise<RaceRow[]> {
  let query = supabase
    .from('tournament_player_races')
    .select('tournament_id, player_id, race_format1, race_format2');
  if (tournamentId !== undefined) query = query.eq('tournament_id', tournamentId);
  const result = await query;
  return unwrap(result, 'tournament_player_races');
}

export async function fetchArchivedRoundsAll(): Promise<RoundRow[]> {
  const result = await supabase
    .from('archived_tournaments_rounds')
    .select('id, tournament_id, round_number, format, subformat_id, is_extra_round');
  return unwrap(result, 'archived_tournaments_rounds');
}

export async function fetchArchivedMatchesAll(): Promise<MatchRow[]> {
  const result = await supabase
    .from('archived_tournaments_matches')
    .select('id, tournament_id, round_id, player1_id, player2_id, score1, score2, completed');
  return unwrap(result, 'archived_tournaments_matches');
}

export function playerName(players: PremierPlayerRow[], playerId: number | null): string {
  if (playerId === null) return 'BYE';
  return players.find((player) => player.premier_id === playerId)?.display_name ?? `Jugador ${playerId}`;
}

export function subformatName(subformats: SubformatRow[], subformatId: number | null): string | null {
  if (subformatId === null) return null;
  return subformats.find((subformat) => subformat.subformat_id === subformatId)?.subformat_name ?? null;
}
