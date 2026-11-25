import { supabase } from '../config/supabase';
import { queryClient, queryKeys } from '../lib/queryClient';

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

async function loadPremierPlayers(): Promise<PremierPlayerRow[]> {
  const result = await supabase
    .from('premier_players')
    .select('premier_id, display_name')
    .order('premier_id');
  return unwrap(result, 'premier_players').map((row) => ({
    premier_id: row.premier_id,
    display_name: row.display_name ?? `Jugador ${row.premier_id}`,
  }));
}

async function loadSubformats(): Promise<SubformatRow[]> {
  const result = await supabase
    .from('game_subformats')
    .select('subformat_id, subformat_name')
    .order('subformat_id');
  return unwrap(result, 'game_subformats').map((row) => ({
    subformat_id: row.subformat_id,
    subformat_name: row.subformat_name ?? `Subformato ${row.subformat_id}`,
  }));
}

async function loadActiveTournament(): Promise<TournamentRow | null> {
  const result = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  if (result.error) throw new Error(`tournaments: ${result.error.message}`);
  // format / tournament_type / pairing_mode are restricted by CHECK constraints.
  return result.data as TournamentRow | null;
}

async function loadTournaments(): Promise<TournamentRow[]> {
  const result = await supabase
    .from('tournaments')
    .select('*')
    .order('year', { ascending: false });
  return unwrap(result, 'tournaments') as TournamentRow[];
}

async function loadActivePlayers(tournamentId: number): Promise<ActivePlayerRow[]> {
  const result = await supabase
    .from('active_tournament_player')
    .select('player_id, confirmed, created_at')
    .eq('tournament_id', tournamentId)
    .order('player_id');
  return unwrap(result, 'active_tournament_player');
}

async function loadRounds(table: 'active_tournaments_rounds' | 'archived_tournaments_rounds', tournamentId: number): Promise<RoundRow[]> {
  const result = await supabase
    .from(table)
    .select('id, tournament_id, round_number, format, subformat_id, is_extra_round')
    .eq('tournament_id', tournamentId)
    .order('round_number');
  // format is restricted to 'PB' | 'FX' by a CHECK constraint.
  return unwrap(result, table) as RoundRow[];
}

async function loadMatches(table: 'active_tournaments_matches' | 'archived_tournaments_matches', tournamentId: number): Promise<MatchRow[]> {
  const result = await supabase
    .from(table)
    .select('id, tournament_id, round_id, player1_id, player2_id, score1, score2, completed')
    .eq('tournament_id', tournamentId);
  return unwrap(result, table);
}

async function loadActiveStandings(): Promise<ActiveStandingRow[]> {
  const result = await supabase.from('active_tournament_standings').select('*');
  // View columns are reported as nullable, but every row comes from a confirmed player.
  return unwrap(result, 'active_tournament_standings') as ActiveStandingRow[];
}

async function loadArchivedStandings(tournamentId?: number): Promise<StandingRow[]> {
  let query = supabase.from('archived_tournaments_standings').select('*');
  if (tournamentId !== undefined) query = query.eq('tournament_id', tournamentId);
  const result = await query;
  return unwrap(result, 'archived_tournaments_standings');
}

async function loadRaces(tournamentId?: number): Promise<RaceRow[]> {
  let query = supabase
    .from('tournament_player_races')
    .select('tournament_id, player_id, race_format1, race_format2');
  if (tournamentId !== undefined) query = query.eq('tournament_id', tournamentId);
  const result = await query;
  return unwrap(result, 'tournament_player_races');
}

async function loadArchivedRoundsAll(): Promise<RoundRow[]> {
  const result = await supabase
    .from('archived_tournaments_rounds')
    .select('id, tournament_id, round_number, format, subformat_id, is_extra_round');
  return unwrap(result, 'archived_tournaments_rounds') as RoundRow[];
}

async function loadArchivedMatchesAll(): Promise<MatchRow[]> {
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

// ---------------------------------------------------------------------------
// Cached accessors. Every service goes through the shared TanStack Query cache,
// so concurrent callers share one request and reference data is not refetched
// on every call. Writes (tournamentAdminAPI) and Realtime events invalidate
// queryKeys.live; reference data and archives change rarely.
// ---------------------------------------------------------------------------
const REFERENCE_STALE_MS = 10 * 60_000;
const LIVE_STALE_MS = 5_000;

type RoundsTable = 'active_tournaments_rounds' | 'archived_tournaments_rounds';
type MatchesTable = 'active_tournaments_matches' | 'archived_tournaments_matches';

function cachedReference<T>(key: readonly unknown[], load: () => Promise<T>): Promise<T> {
  return queryClient.fetchQuery({ queryKey: [...queryKeys.reference, ...key], queryFn: load, staleTime: REFERENCE_STALE_MS });
}

function cachedLive<T>(key: readonly unknown[], load: () => Promise<T>): Promise<T> {
  return queryClient.fetchQuery({ queryKey: [...queryKeys.live, ...key], queryFn: load, staleTime: LIVE_STALE_MS });
}

export const fetchPremierPlayers = () => cachedReference(['premier_players'], loadPremierPlayers);
export const fetchSubformats = () => cachedReference(['game_subformats'], loadSubformats);
export const fetchArchivedStandings = (tournamentId?: number) =>
  cachedReference(['archived_standings', tournamentId ?? 'all'], () => loadArchivedStandings(tournamentId));
export const fetchArchivedRoundsAll = () => cachedReference(['archived_rounds', 'all'], loadArchivedRoundsAll);
export const fetchArchivedMatchesAll = () => cachedReference(['archived_matches', 'all'], loadArchivedMatchesAll);

// The tournament list includes is_active, so it changes when a tournament starts or is archived.
export const fetchTournaments = () => cachedLive(['tournaments'], loadTournaments);
export const fetchActiveTournament = () => cachedLive(['active_tournament'], loadActiveTournament);
export const fetchActivePlayers = (tournamentId: number) =>
  cachedLive(['active_players', tournamentId], () => loadActivePlayers(tournamentId));
export const fetchActiveStandings = () => cachedLive(['active_standings'], loadActiveStandings);
// Races are edited during the event, so they are treated as live data.
export const fetchRaces = (tournamentId?: number) =>
  cachedLive(['races', tournamentId ?? 'all'], () => loadRaces(tournamentId));

export const fetchRounds = (table: RoundsTable, tournamentId: number) =>
  table === 'active_tournaments_rounds'
    ? cachedLive(['rounds', tournamentId], () => loadRounds(table, tournamentId))
    : cachedReference(['archived_rounds', tournamentId], () => loadRounds(table, tournamentId));

export const fetchMatches = (table: MatchesTable, tournamentId: number) =>
  table === 'active_tournaments_matches'
    ? cachedLive(['matches', tournamentId], () => loadMatches(table, tournamentId))
    : cachedReference(['archived_matches', tournamentId], () => loadMatches(table, tournamentId));

export interface VenueRow {
  id: number;
  name: string;
  address: string;
}

async function loadVenues(): Promise<VenueRow[]> {
  const result = await supabase.from('tournament_venues').select('id, name, address').order('name');
  return unwrap(result, 'tournament_venues');
}

/** Saved places to play; the admin's write helpers invalidate this cache. */
export const fetchVenues = () => cachedReference(['venues'], loadVenues);
