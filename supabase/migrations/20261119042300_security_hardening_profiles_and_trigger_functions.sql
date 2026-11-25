-- ============================================================
-- Security hardening (P0) — 2026-11-19
-- 1. Users can no longer change profiles.premier_player_id (admin escalation /
--    player impersonation). Admin = premier_player_id = 1.
-- 2. SECURITY DEFINER trigger functions are no longer callable via /rest/v1/rpc
--    and all trigger functions get a fixed search_path.
-- ============================================================

-- 1a. Column-level UPDATE grants: only the columns the web edits.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (username, is_public, avatar_url, favorite_format, favorite_races)
  ON public.profiles TO authenticated;

-- 1b. Defense in depth: block changes to privileged columns from API roles,
--     even if a future GRANT re-opens the column.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.premier_player_id IS DISTINCT FROM OLD.premier_player_id THEN
      RAISE EXCEPTION 'premier_player_id cannot be changed by users'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'id/created_at cannot be changed'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 2a. Fixed search_path (bodies already use schema-qualified names).
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.handle_profile_premier_id() SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';

-- 2b. Trigger-only functions must not be exposed as RPC.
--     (EXECUTE is not checked when a trigger fires, so triggers keep working.)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_profile_premier_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
