-- ============================================================
-- RLS cleanup (Phase 2) - 2026-11-21
-- Replaces "FOR ALL" policies that overlapped the SELECT policies (Postgres had
-- to evaluate both on every read) with one policy per command.
-- Who can do what does not change:
--   * tournament tables: anyone reads; only the tournament admin writes.
--   * user lists: the owner reads/writes; others read lists of public profiles;
--     decks are readable by any signed-in user (as before).
-- ============================================================

-- Tournament tables ------------------------------------------------------------
DROP POLICY IF EXISTS tournaments_admin_write ON public.tournaments;
CREATE POLICY tournaments_admin_insert ON public.tournaments FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY tournaments_admin_update ON public.tournaments FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY tournaments_admin_delete ON public.tournaments FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS active_players_admin_write ON public.active_tournament_player;
CREATE POLICY active_players_admin_insert ON public.active_tournament_player FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_players_admin_update ON public.active_tournament_player FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_players_admin_delete ON public.active_tournament_player FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS active_stats_admin_write ON public.active_tournament_player_match_stats;
CREATE POLICY active_stats_admin_insert ON public.active_tournament_player_match_stats FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_stats_admin_update ON public.active_tournament_player_match_stats FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_stats_admin_delete ON public.active_tournament_player_match_stats FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS active_rounds_admin_write ON public.active_tournaments_rounds;
CREATE POLICY active_rounds_admin_insert ON public.active_tournaments_rounds FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_rounds_admin_update ON public.active_tournaments_rounds FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_rounds_admin_delete ON public.active_tournaments_rounds FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS active_matches_admin_write ON public.active_tournaments_matches;
CREATE POLICY active_matches_admin_insert ON public.active_tournaments_matches FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_matches_admin_update ON public.active_tournaments_matches FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY active_matches_admin_delete ON public.active_tournaments_matches FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS archived_rounds_admin_write ON public.archived_tournaments_rounds;
CREATE POLICY archived_rounds_admin_insert ON public.archived_tournaments_rounds FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY archived_rounds_admin_update ON public.archived_tournaments_rounds FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY archived_rounds_admin_delete ON public.archived_tournaments_rounds FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS archived_matches_admin_write ON public.archived_tournaments_matches;
CREATE POLICY archived_matches_admin_insert ON public.archived_tournaments_matches FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY archived_matches_admin_update ON public.archived_tournaments_matches FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY archived_matches_admin_delete ON public.archived_tournaments_matches FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS archived_standings_admin_write ON public.archived_tournaments_standings;
CREATE POLICY archived_standings_admin_insert ON public.archived_tournaments_standings FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY archived_standings_admin_update ON public.archived_tournaments_standings FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY archived_standings_admin_delete ON public.archived_tournaments_standings FOR DELETE USING ((select public.is_tournament_admin()));

DROP POLICY IF EXISTS races_admin_write ON public.tournament_player_races;
CREATE POLICY races_admin_insert ON public.tournament_player_races FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY races_admin_update ON public.tournament_player_races FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY races_admin_delete ON public.tournament_player_races FOR DELETE USING ((select public.is_tournament_admin()));

-- User card lists ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own collection" ON public.user_collections_v2;
DROP POLICY IF EXISTS "Public profile collections are viewable" ON public.user_collections_v2;
CREATE POLICY "user_collections_v2_select" ON public.user_collections_v2 FOR SELECT USING (
  (select auth.uid()) = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_collections_v2.user_id AND p.is_public = true)
);
CREATE POLICY "user_collections_v2_insert_own" ON public.user_collections_v2 FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_collections_v2_update_own" ON public.user_collections_v2 FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_collections_v2_delete_own" ON public.user_collections_v2 FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites_v2;
DROP POLICY IF EXISTS "Public profile favorites are viewable" ON public.user_favorites_v2;
CREATE POLICY "user_favorites_v2_select" ON public.user_favorites_v2 FOR SELECT USING (
  (select auth.uid()) = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_favorites_v2.user_id AND p.is_public = true)
);
CREATE POLICY "user_favorites_v2_insert_own" ON public.user_favorites_v2 FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_favorites_v2_update_own" ON public.user_favorites_v2 FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_favorites_v2_delete_own" ON public.user_favorites_v2 FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.user_wishlist_v2;
DROP POLICY IF EXISTS "Public profile wishlist are viewable" ON public.user_wishlist_v2;
CREATE POLICY "user_wishlist_v2_select" ON public.user_wishlist_v2 FOR SELECT USING (
  (select auth.uid()) = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_wishlist_v2.user_id AND p.is_public = true)
);
CREATE POLICY "user_wishlist_v2_insert_own" ON public.user_wishlist_v2 FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_wishlist_v2_update_own" ON public.user_wishlist_v2 FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_wishlist_v2_delete_own" ON public.user_wishlist_v2 FOR DELETE USING ((select auth.uid()) = user_id);

-- Decks: any signed-in user can read (owners are always signed in).
DROP POLICY IF EXISTS "Users can manage their own decks" ON public.user_decks;
DROP POLICY IF EXISTS "Authenticated users can view all decks" ON public.user_decks;
CREATE POLICY "user_decks_select_signed_in" ON public.user_decks FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "user_decks_insert_own" ON public.user_decks FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_decks_update_own" ON public.user_decks FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_decks_delete_own" ON public.user_decks FOR DELETE USING ((select auth.uid()) = user_id);
