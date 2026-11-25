-- ============================================================
-- Realtime for the live tournament (Phase 2) - 2026-11-21
-- The web subscribes to changes on these tables instead of polling.
-- Realtime respects RLS: all of them already allow public SELECT.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.tournaments,
  public.active_tournament_player,
  public.active_tournaments_rounds,
  public.active_tournaments_matches,
  public.tournament_player_races;
