/**
 * Carga torneos de Railway a un JSON listo para Supabase.
 *
 * Los ids de jugadores de Railway se reescriben al premier_id de Supabase.
 * David y Dexxter son el 10. Diego y Traukolin son el 8.
 *
 * Uso, desde myl_app_web_react:
 *   RAILWAY_DATABASE_URL=... node scripts/migrate-railway-tournaments.mjs
 *
 * Escribe scripts/data/tournament-migration.json y no imprime credenciales.
 */
import pg from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NAME_TO_ID = {
  troke: 1,
  wesh: 2,
  piter: 3,
  timmy: 4,
  chisco: 5,
  clanso: 6,
  folo: 7,
  folz: 7,
  traukolin: 8,
  diego: 8,
  chester: 9,
  porscheater: 9,
  dexxter: 10,
  david: 10,
  guari: 11,
  guaricleto: 11,
  vinny: 12,
  jano: 13,
  janops: 13,
};

const playerId = (name) => {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (key === 'bye') return null;
  const id = NAME_TO_ID[key];
  if (!id) throw new Error(`Nombre sin player_id de Supabase: ${name}`);
  return id;
};

const mapSubformat = (value) => {
  if (!value) return null;
  const text = value.trim().toLowerCase();
  if (text.includes('libre')) return 2;
  if (text.includes('ragnarok')) return 3;
  if (text.includes('vcr')) return 4;
  if (text.includes('infanter')) return 6;
  if (text === 'full') return 5;
  if (text.includes('edici') || text === 'pbre' || text === 'edition') return 1;
  throw new Error(`Subformato sin id: ${value}`);
};

const mapFormat = (value) => {
  if (!value) return null;
  const text = value.trim().toUpperCase();
  if (text === 'BF') return 'FX';
  if (text === 'PB' || text === 'FX' || text === 'PBFX') return text;
  throw new Error(`Formato sin mapear: ${value}`);
};

const dominant = (values) => {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  let best = null;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
};

const connectionString = process.env.RAILWAY_DATABASE_URL;
if (!connectionString) {
  console.error('Falta RAILWAY_DATABASE_URL');
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const players = new Map((await client.query('select id, name from players')).rows.map((row) => [row.id, row.name]));
const premier = new Map((await client.query('select id, name from premier_players')).rows.map((row) => [row.id, row.name]));

const resolvePlayersTable = (id) => playerId(players.get(id));
const resolvePremierTable = (id) => playerId(premier.get(id) ?? players.get(id));

const tournaments = (await client.query('select * from tournaments order by id')).rows;
const standings = (await client.query('select * from tournament_standings')).rows;
const rounds = (await client.query('select * from tournament_rounds order by tournament_id, round_number')).rows;
const matches = (await client.query('select * from tournament_matches')).rows;
const races = (await client.query('select * from tournament_player_races')).rows;
const liveRounds = (await client.query('select * from rounds order by round_number')).rows;
const liveMatches = (await client.query('select * from matches')).rows;
let onlineMatches = [];
try {
  onlineMatches = (await client.query('select * from online_tournament_matches')).rows;
} catch {
  onlineMatches = [];
}

const payload = {
  tournaments: [],
  standings: [],
  rounds: [],
  matches: [],
  races: [],
  active: null,
};

for (const tournament of tournaments) {
  const tournamentRounds = rounds.filter((round) => round.tournament_id === tournament.id);
  const formats = new Set(tournamentRounds.map((round) => mapFormat(round.format)));
  const storedFormat = tournament.format ? mapFormat(tournament.format) : null;
  const format = formats.size > 1 ? 'PBFX' : (storedFormat ?? [...formats][0] ?? 'PB');
  const pbSubs = tournamentRounds.filter((round) => mapFormat(round.format) === 'PB').map((round) => mapSubformat(round.subformat));
  const fxSubs = tournamentRounds.filter((round) => mapFormat(round.format) === 'FX').map((round) => mapSubformat(round.subformat));
  const subformat1Id = format === 'FX' ? dominant(fxSubs) : dominant(pbSubs.length ? pbSubs : fxSubs);
  const subformat2Id = format === 'PBFX' ? dominant(fxSubs) : null;

  payload.tournaments.push({
    id: tournament.id,
    name: tournament.name,
    month: tournament.month,
    year: tournament.year,
    start_date: tournament.start_date,
    end_date: tournament.end_date,
    is_active: false,
    format,
    subformat1_id: subformat1Id,
    subformat2_id: subformat2Id,
    tournament_type: 'premier_mitoxico',
    created_at: tournament.created_at,
    archived_at: tournament.archived_at,
  });
}

for (const standing of standings) {
  payload.standings.push({
    tournament_id: standing.tournament_id,
    player_id: playerId(standing.player_name),
    matches_played: standing.matches_played ?? 0,
    wins: standing.wins ?? 0,
    ties: standing.ties ?? 0,
    losses: standing.losses ?? 0,
    points: standing.points ?? 0,
    total_points_scored: standing.total_points_scored ?? 0,
    total_matches: standing.total_matches ?? 0,
    final_position: standing.final_position,
  });
}

for (const round of rounds) {
  payload.rounds.push({
    id: round.id,
    tournament_id: round.tournament_id,
    round_number: round.round_number,
    format: mapFormat(round.format),
    subformat_id: mapSubformat(round.subformat),
    is_extra_round: Boolean(round.is_extra_round),
  });
}

const roundById = new Map(rounds.map((round) => [round.id, round]));
for (const match of matches) {
  const round = roundById.get(match.tournament_round_id);
  if (!round) continue;
  let player1 = playerId(match.player1_name);
  let player2 = playerId(match.player2_name);
  if (player1 === null && player2 !== null) {
    player1 = player2;
    player2 = null;
  }
  if (player1 === null) continue;
  payload.matches.push({
    tournament_id: round.tournament_id,
    round_id: round.id,
    player1_id: player1,
    player2_id: player2,
    score1: match.score1,
    score2: match.score2,
    completed: Boolean(match.completed),
  });
}

for (const online of onlineMatches) {
  const tournamentId = online.tournament_id;
  if (!payload.rounds.some((round) => round.tournament_id === tournamentId)) {
    payload.rounds.push({
      id: 100000 + tournamentId,
      tournament_id: tournamentId,
      round_number: 1,
      format: payload.tournaments.find((tournament) => tournament.id === tournamentId)?.format === 'FX' ? 'FX' : 'PB',
      subformat_id: payload.tournaments.find((tournament) => tournament.id === tournamentId)?.subformat1_id ?? null,
      is_extra_round: false,
    });
  }
  const roundId = payload.rounds.find((round) => round.tournament_id === tournamentId)?.id;
  let player1 = resolvePremierTable(online.player1_id);
  let player2 = resolvePremierTable(online.player2_id);
  if (player1 === null && player2 !== null) {
    player1 = player2;
    player2 = null;
  }
  if (player1 === null || !roundId) continue;
  payload.matches.push({
    tournament_id: tournamentId,
    round_id: roundId,
    player1_id: player1,
    player2_id: player2,
    score1: online.score1,
    score2: online.score2,
    completed: Boolean(online.completed),
  });
}

for (const race of races) {
  const name = race.player_name || players.get(race.player_id) || premier.get(race.player_id);
  payload.races.push({
    tournament_id: race.tournament_id,
    player_id: playerId(name),
    race_format1: race.race_libre || race.race_pb || null,
    race_format2: race.race_edition_vcr || race.race_bf || null,
  });
}

if (liveRounds.length > 0) {
  const formats = new Set(liveRounds.map((round) => mapFormat(round.format)));
  const format = formats.size > 1 ? 'PBFX' : [...formats][0];
  const pbSubs = liveRounds.filter((round) => mapFormat(round.format) === 'PB').map((round) => mapSubformat(round.subformat));
  const fxSubs = liveRounds.filter((round) => mapFormat(round.format) === 'FX').map((round) => mapSubformat(round.subformat));
  payload.active = {
    format,
    subformat1_id: format === 'FX' ? dominant(fxSubs) : dominant(pbSubs.length ? pbSubs : fxSubs),
    subformat2_id: format === 'PBFX' ? dominant(fxSubs) : null,
    players: [...players.entries()]
      .filter(([, name]) => name.toLowerCase() !== 'bye')
      .map(([id, name]) => ({ player_id: playerId(name), source_id: id })),
    rounds: liveRounds.map((round) => ({
      source_id: round.id,
      round_number: round.round_number,
      format: mapFormat(round.format),
      subformat_id: mapSubformat(round.subformat),
      is_extra_round: Boolean(round.is_extra_round),
    })),
    matches: liveMatches.map((match) => {
      let player1 = resolvePlayersTable(match.player1_id);
      let player2 = resolvePlayersTable(match.player2_id);
      if (player1 === null && player2 !== null) {
        player1 = player2;
        player2 = null;
      }
      return {
        round_source_id: match.round_id,
        player1_id: player1,
        player2_id: player2,
        score1: match.score1,
        score2: match.score2,
        completed: Boolean(match.completed),
      };
    }).filter((match) => match.player1_id !== null),
  };
}

await client.end();

for (const tournament of payload.tournaments) {
  if (tournament.format !== 'PBFX') tournament.subformat2_id = null;
}

const dedupe = (rows, keyFn) => {
  const map = new Map();
  rows.forEach((row) => map.set(keyFn(row), row));
  return [...map.values()];
};
payload.standings = dedupe(payload.standings, (row) => `${row.tournament_id}:${row.player_id}`);
payload.races = dedupe(payload.races, (row) => `${row.tournament_id}:${row.player_id}`);

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
await mkdir(directory, { recursive: true });
const output = path.join(directory, 'tournament-migration.json');
await writeFile(output, JSON.stringify(payload));

console.log(JSON.stringify({
  tournaments: payload.tournaments.length,
  standings: payload.standings.length,
  rounds: payload.rounds.length,
  matches: payload.matches.length,
  races: payload.races.length,
  activeRounds: payload.active?.rounds.length ?? 0,
  output,
}, null, 2));
