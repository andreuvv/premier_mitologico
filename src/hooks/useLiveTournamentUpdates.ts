import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { queryClient, queryKeys } from '../lib/queryClient';

// Tables of the tournament in progress that are published to Supabase Realtime
// (see supabase_realtime_live_tournament_migration.sql).
const LIVE_TABLES = [
  'tournaments',
  'active_tournament_player',
  'active_tournaments_rounds',
  'active_tournaments_matches',
  'tournament_player_races',
] as const;

/**
 * Subscribes to database changes of the live tournament. On a change (debounced,
 * since one score update touches several rows) the cached live data is
 * invalidated and `onChange` runs so the page can reload it.
 *
 * Returns `isConnected()`, so callers can keep a slower polling fallback that
 * only kicks in when the Realtime connection is down.
 */
export function useLiveTournamentUpdates(onChange: () => void, debounceMs = 800) {
  const onChangeRef = useRef(onChange);
  const connectedRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleChange = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.live });
        onChangeRef.current();
      }, debounceMs);
    };

    const channel = supabase.channel(`live-tournament-${Math.random().toString(36).slice(2)}`);
    LIVE_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, handleChange);
    });
    let hasConnectedBefore = false;
    channel.subscribe((status) => {
      const wasConnected = connectedRef.current;
      connectedRef.current = status === 'SUBSCRIBED';
      if (connectedRef.current && !wasConnected) {
        // On a reconnect (not the first connection), changes made while the
        // connection was down were missed: reload once.
        if (hasConnectedBefore) handleChange();
        hasConnectedBefore = true;
      }
    });

    return () => {
      clearTimeout(timer);
      connectedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [debounceMs]);

  return { isConnected: useCallback(() => connectedRef.current, []) };
}
