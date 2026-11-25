-- ============================================================
-- Performance (Phase 1) — 2026-11-20
-- 1. RLS: wrap auth.uid() in (select ...) so Postgres evaluates it once per
--    query instead of once per row. Same logic, no behavior change.
-- 2. Covering indexes for foreign keys flagged by the Supabase advisor.
-- ============================================================

-- 1. RLS policies -------------------------------------------------------------
ALTER POLICY "Only admin can insert format documents" ON public.format_documents
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));
ALTER POLICY "Only admin can update format documents" ON public.format_documents
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));

ALTER POLICY "Only admin can insert info documents" ON public.info_documents
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));
ALTER POLICY "Only admin can update info documents" ON public.info_documents
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));

ALTER POLICY "Only admin can insert monthly banlists" ON public.monthly_banlists
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));
ALTER POLICY "Only admin can update monthly banlists" ON public.monthly_banlists
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));
ALTER POLICY "Only admin can delete monthly banlists" ON public.monthly_banlists
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.premier_player_id = 1));

ALTER POLICY "Public profiles are viewable by everyone" ON public.profiles
  USING (is_public = true OR (select auth.uid()) = id);
ALTER POLICY "Users can insert their own profile" ON public.profiles
  WITH CHECK (
    (select auth.uid()) = id
    AND EXISTS (
      SELECT 1 FROM public.allowed_emails
      WHERE allowed_emails.email = (SELECT users.email FROM auth.users WHERE users.id = (select auth.uid()))::text
    )
  );
-- Explicit WITH CHECK (previously implied by USING).
ALTER POLICY "Users can update their own profile" ON public.profiles
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users can manage their own collection" ON public.user_collections
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can manage their own collection" ON public.user_collections_v2
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Authenticated users can view all decks" ON public.user_decks
  USING ((select auth.uid()) IS NOT NULL);
ALTER POLICY "Users can manage their own decks" ON public.user_decks
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can manage their own favorites" ON public.user_favorites_v2
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can manage their own wishlist" ON public.user_wishlist_v2
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- 2. Foreign key indexes ------------------------------------------------------
CREATE INDEX IF NOT EXISTS active_tournament_player_player_id_idx ON public.active_tournament_player (player_id);
CREATE INDEX IF NOT EXISTS active_stats_match_id_idx ON public.active_tournament_player_match_stats (match_id);
CREATE INDEX IF NOT EXISTS active_stats_tournament_id_idx ON public.active_tournament_player_match_stats (tournament_id);
CREATE INDEX IF NOT EXISTS active_matches_player1_id_idx ON public.active_tournaments_matches (player1_id);
CREATE INDEX IF NOT EXISTS active_matches_player2_id_idx ON public.active_tournaments_matches (player2_id);
CREATE INDEX IF NOT EXISTS active_rounds_subformat_id_idx ON public.active_tournaments_rounds (subformat_id);
CREATE INDEX IF NOT EXISTS archived_matches_player1_id_idx ON public.archived_tournaments_matches (player1_id);
CREATE INDEX IF NOT EXISTS archived_matches_player2_id_idx ON public.archived_tournaments_matches (player2_id);
CREATE INDEX IF NOT EXISTS archived_matches_tournament_id_idx ON public.archived_tournaments_matches (tournament_id);
CREATE INDEX IF NOT EXISTS archived_rounds_subformat_id_idx ON public.archived_tournaments_rounds (subformat_id);
CREATE INDEX IF NOT EXISTS archived_standings_player_id_idx ON public.archived_tournaments_standings (player_id);
CREATE INDEX IF NOT EXISTS format_documents_updated_by_idx ON public.format_documents (updated_by);
CREATE INDEX IF NOT EXISTS info_documents_updated_by_idx ON public.info_documents (updated_by);
CREATE INDEX IF NOT EXISTS tournament_player_races_player_id_idx ON public.tournament_player_races (player_id);
CREATE INDEX IF NOT EXISTS tournaments_subformat1_id_idx ON public.tournaments (subformat1_id);
CREATE INDEX IF NOT EXISTS tournaments_subformat2_id_idx ON public.tournaments (subformat2_id);
