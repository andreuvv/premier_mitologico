import { useCallback, useEffect, useRef, useState } from 'react';
import { fixtureAPI, type APIFixtureResponse } from '../../services/fixtureAPI';
import { useLiveTournamentUpdates } from '../../hooks/useLiveTournamentUpdates';
import { buildStandingsView, EMPTY_STANDINGS_VIEW, type StandingsView } from './premierUtils';

const SAFETY_REFRESH_MS = 5 * 60 * 1000;
const FALLBACK_POLL_MS = 90 * 1000;

/**
 * Fixture and standings of the tournament in progress, kept up to date with
 * Supabase Realtime. Polling is only a fallback: every 90 s while Realtime is
 * down, plus a safety refresh every 5 min, and only while the tab is visible.
 */
export function usePremierLiveData() {
  const [fixtureData, setFixtureData] = useState<APIFixtureResponse | null>(null);
  const [fixtureLoading, setFixtureLoading] = useState(true);
  const [fixtureError, setFixtureError] = useState<string | null>(null);
  const [view, setView] = useState<StandingsView>(EMPTY_STANDINGS_VIEW);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Background refreshes (silent) only replace data; they never show loading or errors.
  const loadRef = useRef<(silent: boolean) => Promise<void>>(async () => {});
  const { isConnected: isRealtimeConnected } = useLiveTournamentUpdates(
    useCallback(() => {
      void loadRef.current(true);
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    let lastFetchAt = 0;

    const load = async (silent: boolean) => {
      const [fixtureResult, standingsResult] = await Promise.allSettled([
        fixtureAPI.getFixture(),
        fixtureAPI.getStandings(),
      ]);
      if (cancelled) return;

      if (fixtureResult.status === 'fulfilled') {
        setFixtureData(fixtureResult.value);
        setFixtureError(null);
      } else {
        console.error('Error fetching fixture:', fixtureResult.reason);
        if (!silent) setFixtureError('Error al cargar el emparejamiento. Por favor, intenta de nuevo.');
      }

      if (fixtureResult.status === 'fulfilled' && standingsResult.status === 'fulfilled') {
        setView(buildStandingsView(standingsResult.value, fixtureResult.value));
        setLastUpdated(new Date());
        setStandingsError(null);
        lastFetchAt = Date.now();
      } else {
        if (standingsResult.status === 'rejected') console.error('Error fetching standings:', standingsResult.reason);
        if (!silent) setStandingsError('Error al cargar la tabla de posiciones. Por favor, intenta de nuevo.');
      }

      if (!silent) {
        setFixtureLoading(false);
        setStandingsLoading(false);
      }
    };

    loadRef.current = load;
    void load(false);

    const isVisible = () => document.visibilityState === 'visible';
    const intervalId = setInterval(() => {
      if (!isVisible()) return;
      if (!isRealtimeConnected() || Date.now() - lastFetchAt >= SAFETY_REFRESH_MS) {
        void load(true);
      }
    }, FALLBACK_POLL_MS);
    const handleVisibilityChange = () => {
      if (isVisible()) void load(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      loadRef.current = async () => {};
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRealtimeConnected]);

  /** Reload now (e.g. after the admin reports a result). */
  const refresh = useCallback(() => loadRef.current(true), []);

  return {
    fixtureData,
    fixtureLoading,
    fixtureError,
    standings: view.standings,
    playoffWinners: view.playoffWinners,
    hasExtraRound: view.hasExtraRound,
    standingsLoading,
    standingsError,
    lastUpdated,
    refresh,
  };
}
