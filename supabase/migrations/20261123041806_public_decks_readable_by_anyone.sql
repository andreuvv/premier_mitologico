-- Public decks can be viewed without signing in; signed-in users keep seeing all decks as before.
DROP POLICY IF EXISTS "user_decks_select_signed_in" ON public.user_decks;
CREATE POLICY "user_decks_select" ON public.user_decks FOR SELECT
  USING (is_public = true OR (select auth.uid()) IS NOT NULL);
