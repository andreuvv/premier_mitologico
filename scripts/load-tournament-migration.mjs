/**
 * Inserta scripts/data/tournament-migration.json en Supabase.
 *
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 * No usa la anon key: la carga reescribe ids y tiene que saltarse RLS.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/load-tournament-migration.mjs
 *
 * El torneo en vivo no se inserta solo. Si el JSON trae `active`, pasá:
 *   LIVE_NAME="Premier Octubre" LIVE_MONTH=Octubre LIVE_YEAR=2026
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'tournament-migration.json');
const payload = JSON.parse(await readFile(file, 'utf8'));
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { count } = await supabase.from('tournaments').select('id', { count: 'exact', head: true });
if ((count ?? 0) > 0) {
  console.error('Supabase ya tiene torneos. No se vuelve a cargar.');
  process.exit(1);
}

const { error: tournamentError } = await supabase.from('tournaments').insert(payload.tournaments);
if (tournamentError) throw tournamentError;

const { error: roundError } = await supabase.from('archived_tournaments_rounds').insert(payload.rounds);
if (roundError) throw roundError;

const matches = payload.matches.map(({ tournament_id, round_id, player1_id, player2_id, score1, score2, completed }) => ({
  tournament_id, round_id, player1_id, player2_id, score1, score2, completed,
}));
const { error: matchError } = await supabase.from('archived_tournaments_matches').insert(matches);
if (matchError) throw matchError;

const { error: standingError } = await supabase.from('archived_tournaments_standings').insert(payload.standings);
if (standingError) throw standingError;

const { error: raceError } = await supabase.from('tournament_player_races').insert(payload.races);
if (raceError) throw raceError;

if (payload.active && process.env.LIVE_NAME) {
  const { data: created, error: activeError } = await supabase.from('tournaments').insert({
    name: process.env.LIVE_NAME,
    month: process.env.LIVE_MONTH ?? '',
    year: Number(process.env.LIVE_YEAR),
    is_active: true,
    format: payload.active.format,
    subformat1_id: payload.active.subformat1_id,
    subformat2_id: payload.active.subformat2_id,
    tournament_type: 'premier_mitoxico',
  }).select('id').single();
  if (activeError) throw activeError;

  const { error: rosterError } = await supabase.from('active_tournament_player').insert(
    payload.active.players.map((player) => ({
      tournament_id: created.id,
      player_id: player.player_id,
      confirmed: true,
    })),
  );
  if (rosterError) throw rosterError;

  const roundIdBySource = new Map();
  for (const round of payload.active.rounds) {
    const { data, error } = await supabase.from('active_tournaments_rounds').insert({
      tournament_id: created.id,
      round_number: round.round_number,
      format: round.format,
      subformat_id: round.subformat_id,
      is_extra_round: round.is_extra_round,
    }).select('id').single();
    if (error) throw error;
    roundIdBySource.set(round.source_id, data.id);
  }

  const activeMatches = payload.active.matches.map((match) => ({
    tournament_id: created.id,
    round_id: roundIdBySource.get(match.round_source_id),
    player1_id: match.player1_id,
    player2_id: match.player2_id,
    score1: match.score1,
    score2: match.score2,
    completed: match.completed,
  }));
  const { error: activeMatchError } = await supabase.from('active_tournaments_matches').insert(activeMatches);
  if (activeMatchError) throw activeMatchError;
}

const { error: sequenceError } = await supabase.rpc('sync_tournament_sequences');
if (sequenceError) throw sequenceError;

console.log(JSON.stringify({
  tournaments: payload.tournaments.length,
  standings: payload.standings.length,
  rounds: payload.rounds.length,
  matches: payload.matches.length,
  races: payload.races.length,
  activeLoaded: Boolean(payload.active && process.env.LIVE_NAME),
}, null, 2));
