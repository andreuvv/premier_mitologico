import {
  fetchArchivedMatchesAll,
  fetchArchivedRoundsAll,
  fetchArchivedStandings,
  fetchMatches,
  fetchPremierPlayers,
  fetchRaces,
  fetchRounds,
  fetchSubformats,
  fetchTournaments,
  legacyGet,
  playerName,
  subformatName,
  supabaseHasTournaments,
  type MatchRow,
  type PremierPlayerRow,
  type RaceRow,
  type RoundRow,
  type StandingRow,
  type SubformatRow,
  type TournamentRow,
} from './tournamentQueries';

export interface Tournament {
  id: number;
  name: string;
  month: string;
  year: number;
  type: string;
  format?: string | null;
  subformat?: string | null;
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
  race_format1: string | null;
  race_format2: string | null;
}

export interface TournamentMatch {
  id: number;
  player1_id: number;
  player2_id: number | null;
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
  tournaments_participated: number;
  most_played_race_pb: string | null;
  most_played_race_bf: string | null;
  winrate_pb: number;
  winrate_bf: number;
}

export interface PlayerHistoryItem {
  tournament_id: number;
  tournament_name: string;
  month: string;
  year: number;
  format: string | null;
  subformat: string | null;
  final_position: number;
  matches_played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  total_points_scored: number;
  race_pb: string | null;
  race_bf: string | null;
  race_libre: string | null;
  race_edition_vcr: string | null;
  pb_wins: number;
  pb_ties: number;
  pb_matches: number;
  bf_wins: number;
  bf_ties: number;
  bf_matches: number;
}

function emptyRaces(): TournamentRacesResponse {
  return {
    pb_races: {},
    bf_races: {},
    libre_races: {},
    vcr_races: {},
    pb_race_winrates: {},
    bf_race_winrates: {},
    libre_race_winrates: {},
    vcr_race_winrates: {},
  };
}

function tournamentSubformat(tournament: TournamentRow, subformats: SubformatRow[]): string | null {
  const first = subformatName(subformats, tournament.subformat1_id);
  const second = subformatName(subformats, tournament.subformat2_id);
  return [first, second].filter(Boolean).join(' / ') || null;
}

function toTournament(row: TournamentRow, subformats: SubformatRow[]): Tournament {
  return {
    id: row.id,
    name: row.name,
    month: row.month,
    year: row.year,
    type: row.tournament_type,
    format: row.format,
    subformat: tournamentSubformat(row, subformats),
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
    created_at: row.created_at,
    archived_at: row.archived_at ?? row.created_at,
  };
}

function legacyRaceFields(format: string, race1: string | null, race2: string | null) {
  if (format === 'PBFX') {
    return { race_pb: race1, race_bf: race2, race_libre: null, race_edition_vcr: null };
  }
  return { race_pb: null, race_bf: null, race_libre: race1, race_edition_vcr: race2 };
}

function resultFor(match: MatchRow, playerId: number): 'win' | 'tie' | 'loss' | null {
  if (!match.completed || match.score1 === null || match.score2 === null) return null;
  const isPlayer1 = match.player1_id === playerId;
  const isPlayer2 = match.player2_id === playerId;
  if (!isPlayer1 && !isPlayer2) return null;
  const mine = isPlayer1 ? match.score1 : match.score2;
  const theirs = isPlayer1 ? match.score2 : match.score1;
  if (mine === theirs) return 'tie';
  return mine > theirs ? 'win' : 'loss';
}

const LIBRE_SUBFORMAT_IDS = new Set([2]);
const EDITION_VCR_SUBFORMAT_IDS = new Set([1, 3, 4]);

function formatRecord(
  matches: MatchRow[],
  rounds: RoundRow[],
  playerId: number,
  format: 'PB' | 'FX',
  subformatIds?: ReadonlySet<number>,
) {
  const roundIds = new Set(
    rounds
      .filter((round) => round.format === format && (subformatIds == null || (round.subformat_id != null && subformatIds.has(round.subformat_id))))
      .map((round) => round.id),
  );
  let wins = 0;
  let ties = 0;
  let played = 0;
  matches.forEach((match) => {
    if (!roundIds.has(match.round_id)) return;
    const result = resultFor(match, playerId);
    if (!result) return;
    played += 1;
    if (result === 'win') wins += 1;
    if (result === 'tie') ties += 1;
  });
  return { wins, ties, played };
}

function bump(map: Record<string, number>, race: string | null) {
  if (!race) return;
  map[race] = (map[race] ?? 0) + 1;
}

function mostPlayed(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((count, race) => {
    if (count > bestCount) {
      best = race;
      bestCount = count;
    }
  });
  return best;
}

async function loadCatalog() {
  const [tournaments, players, subformats, standings, races, rounds, matches] = await Promise.all([
    fetchTournaments(),
    fetchPremierPlayers(),
    fetchSubformats(),
    fetchArchivedStandings(),
    fetchRaces(),
    fetchArchivedRoundsAll(),
    fetchArchivedMatchesAll(),
  ]);
  return { tournaments, players, subformats, standings, races, rounds, matches };
}

export const tournamentAPI = {
  getTournaments: async (): Promise<Tournament[]> => {
    if (!(await supabaseHasTournaments())) return legacyGet<Tournament[]>('/tournaments');
    const [tournaments, subformats] = await Promise.all([fetchTournaments(), fetchSubformats()]);
    return tournaments
      .filter((tournament) => !tournament.is_active)
      .map((tournament) => toTournament(tournament, subformats));
  },

  getTournamentStandings: async (tournamentId: number): Promise<TournamentStanding[]> => {
    if (!(await supabaseHasTournaments())) return legacyGet<TournamentStanding[]>(`/tournaments/${tournamentId}/standings`);
    const [standings, races, players, tournaments] = await Promise.all([
      fetchArchivedStandings(tournamentId),
      fetchRaces(tournamentId),
      fetchPremierPlayers(),
      fetchTournaments(),
    ]);
    const tournament = tournaments.find((row) => row.id === tournamentId);
    const format = tournament?.format ?? 'PB';
    return standings
      .map((standing) => {
        const race = races.find((row) => row.player_id === standing.player_id);
        const legacy = legacyRaceFields(format, race?.race_format1 ?? null, race?.race_format2 ?? null);
        return {
          id: standing.id,
          tournament_id: standing.tournament_id,
          player_id: standing.player_id,
          player_name: playerName(players, standing.player_id),
          matches_played: standing.matches_played,
          wins: standing.wins,
          ties: standing.ties,
          losses: standing.losses,
          points: standing.points,
          total_points_scored: standing.total_points_scored,
          total_matches: standing.total_matches,
          final_position: standing.final_position ?? 0,
          race_format1: race?.race_format1 ?? null,
          race_format2: race?.race_format2 ?? null,
          ...legacy,
        };
      })
      .sort((a, b) => a.final_position - b.final_position);
  },

  getTournamentRounds: async (tournamentId: number): Promise<TournamentRoundsResponse> => {
    if (!(await supabaseHasTournaments())) return legacyGet<TournamentRoundsResponse>(`/tournaments/${tournamentId}/rounds`);
    const tournaments = await fetchTournaments();
    const tournament = tournaments.find((row) => row.id === tournamentId);
    const active = tournament?.is_active;
    const [rounds, matches, players, subformats] = await Promise.all([
      fetchRounds(active ? 'active_tournaments_rounds' : 'archived_tournaments_rounds', tournamentId),
      fetchMatches(active ? 'active_tournaments_matches' : 'archived_tournaments_matches', tournamentId),
      fetchPremierPlayers(),
      fetchSubformats(),
    ]);
    return {
      tournament_name: tournament?.name ?? '',
      rounds: rounds.map((round) => ({
        number: round.round_number,
        format: round.format,
        is_extra_round: round.is_extra_round,
        subformat: subformatName(subformats, round.subformat_id),
        matches: matches
          .filter((match) => match.round_id === round.id)
          .map((match) => ({
            id: match.id,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player1_name: playerName(players, match.player1_id),
            player2_name: playerName(players, match.player2_id),
            score1: match.score1,
            score2: match.score2,
            completed: match.completed,
          })),
      })),
    };
  },

  getTournamentRaces: async (tournamentId: number): Promise<TournamentRacesResponse> => {
    if (!(await supabaseHasTournaments())) return legacyGet<TournamentRacesResponse>(`/tournaments/${tournamentId}/races`);
    const catalog = await loadCatalog();
    const tournament = catalog.tournaments.find((row) => row.id === tournamentId);
    if (!tournament) return emptyRaces();
    return summarizeRaces(
      catalog.races.filter((race) => race.tournament_id === tournamentId),
      catalog.standings.filter((standing) => standing.tournament_id === tournamentId),
      catalog.rounds.filter((round) => round.tournament_id === tournamentId),
      catalog.matches.filter((match) => match.tournament_id === tournamentId),
      [tournament],
    );
  },

  getGlobalStandings: async (): Promise<GlobalStanding[]> => {
    if (!(await supabaseHasTournaments())) return legacyGet<GlobalStanding[]>('/global-standings');
    const catalog = await loadCatalog();
    return buildGlobalStandings(catalog);
  },

  getGlobalRaces: async (): Promise<TournamentRacesResponse> => {
    if (!(await supabaseHasTournaments())) return legacyGet<TournamentRacesResponse>('/global-races');
    const catalog = await loadCatalog();
    return summarizeRaces(catalog.races, catalog.standings, catalog.rounds, catalog.matches, premierArchived(catalog.tournaments));
  },

  getPlayerHistory: async (playerId: number): Promise<PlayerHistoryItem[]> => {
    if (!(await supabaseHasTournaments())) return legacyGet<PlayerHistoryItem[]>(`/players/${playerId}/tournaments`);
    const catalog = await loadCatalog();
    return catalog.standings
      .filter((standing) => standing.player_id === playerId)
      .map((standing) => historyItem(standing, catalog))
      .sort((a, b) => b.year - a.year || b.tournament_id - a.tournament_id);
  },
};

function historyItem(
  standing: StandingRow,
  catalog: {
    tournaments: TournamentRow[];
    races: RaceRow[];
    rounds: RoundRow[];
    matches: MatchRow[];
    subformats: SubformatRow[];
  },
): PlayerHistoryItem {
  const tournament = catalog.tournaments.find((row) => row.id === standing.tournament_id);
  const format = tournament?.format ?? 'PB';
  const race = catalog.races.find((row) => row.tournament_id === standing.tournament_id && row.player_id === standing.player_id);
  const legacy = legacyRaceFields(format, race?.race_format1 ?? null, race?.race_format2 ?? null);
  const rounds = catalog.rounds.filter((round) => round.tournament_id === standing.tournament_id);
  const matches = catalog.matches.filter((match) => match.tournament_id === standing.tournament_id);
  const pb = formatRecord(matches, rounds, standing.player_id, 'PB');
  const fx = formatRecord(matches, rounds, standing.player_id, 'FX');
  return {
    tournament_id: standing.tournament_id,
    tournament_name: tournament?.name ?? '',
    month: tournament?.month ?? '',
    year: tournament?.year ?? 0,
    format,
    subformat: tournament ? tournamentSubformat(tournament, catalog.subformats) : null,
    final_position: standing.final_position ?? 0,
    matches_played: standing.matches_played,
    wins: standing.wins,
    ties: standing.ties,
    losses: standing.losses,
    points: standing.points,
    total_points_scored: standing.total_points_scored,
    ...legacy,
    pb_wins: pb.wins,
    pb_ties: pb.ties,
    pb_matches: pb.played,
    bf_wins: fx.wins,
    bf_ties: fx.ties,
    bf_matches: fx.played,
  };
}

function premierArchived(tournaments: TournamentRow[]): TournamentRow[] {
  return tournaments.filter((tournament) => !tournament.is_active && tournament.tournament_type === 'premier_mitoxico');
}

function buildGlobalStandings(catalog: {
  players: PremierPlayerRow[];
  tournaments: TournamentRow[];
  standings: StandingRow[];
  races: RaceRow[];
  rounds: RoundRow[];
  matches: MatchRow[];
}): GlobalStanding[] {
  const archivedIds = new Set(premierArchived(catalog.tournaments).map((tournament) => tournament.id));
  return catalog.players.map((player) => {
    const rows = catalog.standings.filter((standing) => standing.player_id === player.premier_id && archivedIds.has(standing.tournament_id));
    const pbRaces = new Map<string, number>();
    const fxRaces = new Map<string, number>();
    rows.forEach((standing) => {
      const tournament = catalog.tournaments.find((row) => row.id === standing.tournament_id);
      const race = catalog.races.find((row) => row.tournament_id === standing.tournament_id && row.player_id === player.premier_id);
      if (!tournament || !race) return;
      if (tournament.format === 'PB' || tournament.format === 'PBFX') {
        if (race.race_format1) pbRaces.set(race.race_format1, (pbRaces.get(race.race_format1) ?? 0) + 1);
      }
      if (tournament.format === 'FX') {
        if (race.race_format1) fxRaces.set(race.race_format1, (fxRaces.get(race.race_format1) ?? 0) + 1);
      }
      if (tournament.format === 'PBFX' && race.race_format2) {
        fxRaces.set(race.race_format2, (fxRaces.get(race.race_format2) ?? 0) + 1);
      }
    });

    let pbWins = 0;
    let pbTies = 0;
    let pbMatches = 0;
    let fxWins = 0;
    let fxTies = 0;
    let fxMatches = 0;
    archivedIds.forEach((tournamentId) => {
      const rounds = catalog.rounds.filter((round) => round.tournament_id === tournamentId);
      const matches = catalog.matches.filter((match) => match.tournament_id === tournamentId);
      const pb = formatRecord(matches, rounds, player.premier_id, 'PB');
      const fx = formatRecord(matches, rounds, player.premier_id, 'FX');
      pbWins += pb.wins;
      pbTies += pb.ties;
      pbMatches += pb.played;
      fxWins += fx.wins;
      fxTies += fx.ties;
      fxMatches += fx.played;
    });

    return {
      player_id: player.premier_id,
      player_name: player.display_name,
      first_place_count: rows.filter((row) => row.final_position === 1).length,
      second_place_count: rows.filter((row) => row.final_position === 2).length,
      third_place_count: rows.filter((row) => row.final_position === 3).length,
      tournaments_participated: rows.filter((row) => row.matches_played > 0).length,
      most_played_race_pb: mostPlayed(pbRaces),
      most_played_race_bf: mostPlayed(fxRaces),
      winrate_pb: pbMatches > 0 ? ((pbWins + 0.5 * pbTies) / pbMatches) * 100 : 0,
      winrate_bf: fxMatches > 0 ? ((fxWins + 0.5 * fxTies) / fxMatches) * 100 : 0,
    };
  }).sort((a, b) =>
    b.first_place_count - a.first_place_count
    || b.second_place_count - a.second_place_count
    || b.third_place_count - a.third_place_count
    || b.tournaments_participated - a.tournaments_participated,
  );
}

function summarizeRaces(
  races: RaceRow[],
  standings: StandingRow[],
  rounds: RoundRow[],
  matches: MatchRow[],
  tournaments: TournamentRow[],
): TournamentRacesResponse {
  const summary = emptyRaces();
  const pbPoints = new Map<string, { wins: number; ties: number; played: number }>();
  const fxPoints = new Map<string, { wins: number; ties: number; played: number }>();
  const librePoints = new Map<string, { wins: number; ties: number; played: number }>();
  const editionPoints = new Map<string, { wins: number; ties: number; played: number }>();

  tournaments.forEach((tournament) => {
    races.filter((race) => race.tournament_id === tournament.id).forEach((race) => {
      const standing = standings.find((row) => row.tournament_id === tournament.id && row.player_id === race.player_id);
      if (standing && standing.matches_played === 0) return;
      const tournamentRounds = rounds.filter((round) => round.tournament_id === tournament.id);
      const tournamentMatches = matches.filter((match) => match.tournament_id === tournament.id);
      if (tournament.format === 'PB' || tournament.format === 'PBFX') {
        bump(summary.pb_races, race.race_format1);
        addRaceRecord(pbPoints, race.race_format1, formatRecord(tournamentMatches, tournamentRounds, race.player_id, 'PB'));
      }
      if (tournament.format === 'FX') {
        bump(summary.bf_races, race.race_format1);
        addRaceRecord(fxPoints, race.race_format1, formatRecord(tournamentMatches, tournamentRounds, race.player_id, 'FX'));
      }
      if (tournament.format === 'PBFX') {
        bump(summary.bf_races, race.race_format2);
        addRaceRecord(fxPoints, race.race_format2, formatRecord(tournamentMatches, tournamentRounds, race.player_id, 'FX'));
      }
      if (tournament.format === 'PB' || tournament.format === 'FX') {
        bump(summary.libre_races, race.race_format1);
        bump(summary.vcr_races, race.race_format2);
        addRaceRecord(
          librePoints,
          race.race_format1,
          formatRecord(tournamentMatches, tournamentRounds, race.player_id, tournament.format, LIBRE_SUBFORMAT_IDS),
        );
        addRaceRecord(
          editionPoints,
          race.race_format2,
          formatRecord(tournamentMatches, tournamentRounds, race.player_id, tournament.format, EDITION_VCR_SUBFORMAT_IDS),
        );
      }
    });
  });

  summary.pb_race_winrates = winrateMap(pbPoints);
  summary.bf_race_winrates = winrateMap(fxPoints);
  summary.libre_race_winrates = winrateMap(librePoints);
  summary.vcr_race_winrates = winrateMap(editionPoints);
  return summary;
}

function addRaceRecord(
  bucket: Map<string, { wins: number; ties: number; played: number }>,
  race: string | null,
  record: { wins: number; ties: number; played: number },
) {
  if (!race) return;
  const current = bucket.get(race) ?? { wins: 0, ties: 0, played: 0 };
  current.wins += record.wins;
  current.ties += record.ties;
  current.played += record.played;
  bucket.set(race, current);
}

function winrateMap(bucket: Map<string, { wins: number; ties: number; played: number }>) {
  const rates: Record<string, number> = {};
  bucket.forEach((record, race) => {
    rates[race] = record.played > 0 ? ((record.wins + 0.5 * record.ties) / record.played) * 100 : 0;
  });
  return rates;
}
