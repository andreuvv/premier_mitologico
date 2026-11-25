import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fixtureAPI, type APIFixtureResponse, type APIPlayer } from '../../services/fixtureAPI';
import { fetchActiveTournament, fetchRaces, fetchSubformats, fetchVenues, type SubformatRow, type VenueRow } from '../../services/tournamentQueries';
import { fullCycleLength } from '../../utils/roundRobin';
import type { RoundRobinRound } from '../../utils/roundRobin';
import {
  emptyForm,
  raceComplete,
  rosterRaces,
  sameForm,
  tournamentSteps,
  type PairingMode,
  type RaceDraft,
  type ScoreDraft,
  type TournamentForm,
} from './adminUtils';

export type Toast = { id: number; kind: 'success' | 'error'; text: string };

/**
 * All state of the tournament admin. Server data (`savedForm`, `fixture`,
 * `savedRaces`) is kept apart from the admin's unsaved edits (`form`,
 * `scoreDrafts`, `raceDrafts`), so saving one thing and reloading never
 * throws away edits made somewhere else.
 */
export function useTournamentAdmin(allowed: boolean | null) {
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [subformats, setSubformats] = useState<SubformatRow[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);

  const [savedForm, setSavedForm] = useState<TournamentForm | null>(null);
  const [form, setForm] = useState<TournamentForm>(() => emptyForm());
  const formEdited = useRef(false);
  // Round count isn't stored in the database: default it to a full cycle once.
  const roundCountSet = useRef(false);

  const [roundCount, setRoundCountState] = useState(7);
  const [pairingMode, setPairingMode] = useState<PairingMode>('fixed');
  const [includeExtra, setIncludeExtra] = useState(true);
  const [preview, setPreview] = useState<RoundRobinRound[]>([]);
  const [extraPairs, setExtraPairs] = useState<Array<[number, number]>>([]);

  const [fixture, setFixture] = useState<APIFixtureResponse>({ rounds: [] });
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, ScoreDraft>>({});
  const [savedRaces, setSavedRaces] = useState<Record<number, RaceDraft>>({});
  const [raceDrafts, setRaceDrafts] = useState<Record<number, RaceDraft>>({});

  const load = useCallback(async () => {
    const [roster, formats, liveFixture, livePlayers, active, savedVenues] = await Promise.all([
      fixtureAPI.getPremierPlayers(),
      fetchSubformats(),
      fixtureAPI.getFixture(),
      fixtureAPI.getPlayers(),
      fetchActiveTournament(),
      fetchVenues(),
    ]);
    setPlayers(roster);
    setSubformats(formats);
    setVenues(savedVenues);
    setFixture(liveFixture);
    if (active) {
      const next: TournamentForm = {
        name: active.name,
        month: active.month,
        year: active.year,
        startDate: active.start_date?.slice(0, 10) ?? '',
        endDate: active.end_date?.slice(0, 10) ?? '',
        locationName: active.location_name ?? '',
        locationAddress: active.location_address ?? '',
        format: active.format,
        subformat1Id: active.subformat1_id ?? 2,
        subformat2Id: active.subformat2_id ?? 4,
        tournamentType: active.tournament_type,
        playerIds: livePlayers.map((player) => player.id),
      };
      setActiveId(active.id);
      setSavedForm(next);
      if (!formEdited.current) setForm(next);
      if (!roundCountSet.current) {
        roundCountSet.current = true;
        setRoundCount(fullCycleLength(livePlayers.length));
      }
      setPairingMode(active.pairing_mode === 'progressive' ? 'progressive' : 'fixed');
      // Only this tournament's rows: each player also has rows from past tournaments.
      const raceRows = livePlayers.length > 0 ? await fetchRaces(active.id) : [];
      setSavedRaces(rosterRaces(raceRows, active.id, livePlayers.map((player) => player.id)));
    } else {
      setActiveId(null);
      setSavedForm(null);
      setSavedRaces({});
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (allowed) {
      load().catch((loadError: Error) => setToast({ id: Date.now(), kind: 'error', text: loadError.message }));
    }
  }, [allowed, load]);

  const dismissToast = useCallback(() => setToast(null), []);

  const notify = useCallback((kind: Toast['kind'], text: string) => {
    setToast({ id: Date.now(), kind, text });
  }, []);

  /** Runs an admin write, shows the result and reloads everything. Returns whether it worked. */
  const run = useCallback(async (action: () => Promise<void>, success: string): Promise<boolean> => {
    setBusy(true);
    try {
      await action();
      notify('success', success);
      await load();
      return true;
    } catch (actionError) {
      notify('error', actionError instanceof Error ? actionError.message : 'No se pudo completar la acción');
      return false;
    } finally {
      setBusy(false);
    }
  }, [load, notify]);

  const setRoundCount = (value: number) => {
    roundCountSet.current = true;
    setRoundCountState(value);
  };

  // ── Tournament form ────────────────────────────────────────────────────────
  const updateForm = (patch: Partial<TournamentForm>) => {
    formEdited.current = true;
    setForm((current) => ({ ...current, ...patch }));
  };
  const formDirty = savedForm ? !sameForm(form, savedForm) : false;
  const discardForm = () => {
    formEdited.current = false;
    setForm(savedForm ?? emptyForm());
  };
  /** Call before a save that should replace the form with what the server returns. */
  const acceptFormFromServer = () => {
    formEdited.current = false;
  };

  // ── Races ──────────────────────────────────────────────────────────────────
  const raceFor = (playerId: number): RaceDraft => raceDrafts[playerId] ?? savedRaces[playerId] ?? { race1: '', race2: '' };
  const setRace = (playerId: number, patch: Partial<RaceDraft>) => {
    setRaceDrafts((current) => {
      const next = { ...(current[playerId] ?? savedRaces[playerId] ?? { race1: '', race2: '' }), ...patch };
      const saved = savedRaces[playerId];
      const copy = { ...current };
      if (saved && saved.race1 === next.race1 && saved.race2 === next.race2) delete copy[playerId];
      else copy[playerId] = next;
      return copy;
    });
  };
  const changedRaceIds = Object.keys(raceDrafts).map(Number);
  const discardRaces = () => setRaceDrafts({});
  const rosterIds = savedForm?.playerIds ?? [];

  // ── Scores ─────────────────────────────────────────────────────────────────
  const matchById = useMemo(() => {
    const map = new Map<number, APIFixtureResponse['rounds'][number]['matches'][number]>();
    fixture.rounds.forEach((round) => round.matches.forEach((match) => map.set(match.id, match)));
    return map;
  }, [fixture]);
  const scoreFor = (matchId: number): ScoreDraft => {
    if (scoreDrafts[matchId]) return scoreDrafts[matchId];
    const match = matchById.get(matchId);
    return match?.completed ? { score1: match.score1 ?? 0, score2: match.score2 ?? 0 } : { score1: null, score2: null };
  };
  const setScore = (matchId: number, side: 'score1' | 'score2', value: number) => {
    setScoreDrafts((current) => {
      const next = { ...scoreFor(matchId), ...current[matchId], [side]: value };
      const match = matchById.get(matchId);
      const copy = { ...current };
      if (match?.completed && match.score1 === next.score1 && match.score2 === next.score2) delete copy[matchId];
      else copy[matchId] = next;
      return copy;
    });
  };
  /** A draft is ready to save when every player in the match has a score. */
  const draftReady = (matchId: number) => {
    const draft = scoreDrafts[matchId];
    const match = matchById.get(matchId);
    if (!draft || !match) return false;
    return draft.score1 !== null && (match.player2_id === null || draft.score2 !== null);
  };
  const discardScores = (matchIds?: number[]) => {
    if (!matchIds) {
      setScoreDrafts({});
      return;
    }
    setScoreDrafts((current) => {
      const copy = { ...current };
      matchIds.forEach((id) => delete copy[id]);
      return copy;
    });
  };

  // ── Progress ───────────────────────────────────────────────────────────────
  const regularRoundsSaved = fixture.rounds.filter((round) => !round.is_extra_round).length;
  const hasFinalRound = fixture.rounds.some((round) => round.is_extra_round);
  const allMatches = fixture.rounds.flatMap((round) => round.matches);
  const steps = tournamentSteps({
    hasTournament: activeId !== null,
    playerCount: rosterIds.length,
    racesComplete: rosterIds.filter((id) => raceComplete(savedRaces[id])).length,
    pairingMode,
    roundCount,
    includeExtra,
    regularRoundsSaved,
    hasFinalRound,
    matchesDone: allMatches.filter((match) => match.completed).length,
    matchesTotal: allMatches.length,
  });

  const unsaved = {
    torneo: formDirty || (!activeId && formEdited.current),
    razas: changedRaceIds.length > 0,
    rondas: preview.length > 0,
    marcadores: Object.keys(scoreDrafts).length > 0,
    cerrar: false,
  };

  // Warn before leaving the page with unsaved edits.
  const hasUnsaved = unsaved.torneo || unsaved.razas || unsaved.rondas || unsaved.marcadores;
  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsaved]);

  const playerName = useMemo(() => {
    const names = new Map(players.map((player) => [player.id, player.name]));
    return (playerId: number | null) => (playerId === null ? 'BYE' : names.get(playerId) ?? String(playerId));
  }, [players]);

  const subformatName = (id: number | null | undefined) =>
    subformats.find((item) => item.subformat_id === id)?.subformat_name;

  return {
    loaded, busy, toast, dismissToast, notify, run,
    activeId, players, subformats, venues, subformatName, playerName,
    savedForm, form, updateForm, formDirty, discardForm, acceptFormFromServer,
    rosterIds, savedRaces, raceFor, setRace, changedRaceIds, raceDrafts, discardRaces,
    roundCount, setRoundCount, pairingMode, setPairingMode, includeExtra, setIncludeExtra,
    preview, setPreview, extraPairs, setExtraPairs,
    fixture, regularRoundsSaved, hasFinalRound,
    scoreFor, setScore, scoreDrafts, draftReady, discardScores,
    steps, unsaved,
  };
}

export type TournamentAdminState = ReturnType<typeof useTournamentAdmin>;
