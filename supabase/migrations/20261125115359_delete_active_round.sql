-- Deletes one round of the active tournament (its matches and score stats go
-- with it through ON DELETE CASCADE) and renumbers the later rounds so the
-- sequence stays 1..n, which append_active_round relies on.
CREATE OR REPLACE FUNCTION public.delete_active_round(p_round_number integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament_id bigint;
  v_round record;
BEGIN
  IF NOT public.is_tournament_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT id INTO v_tournament_id FROM public.tournaments WHERE is_active LIMIT 1;
  IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'no active tournament'; END IF;

  DELETE FROM public.active_tournaments_rounds
  WHERE tournament_id = v_tournament_id AND round_number = p_round_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'round not found'; END IF;

  -- One row at a time, lowest first, so a unique (tournament, round_number) never clashes.
  FOR v_round IN
    SELECT id FROM public.active_tournaments_rounds
    WHERE tournament_id = v_tournament_id AND round_number > p_round_number
    ORDER BY round_number
  LOOP
    UPDATE public.active_tournaments_rounds SET round_number = round_number - 1 WHERE id = v_round.id;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_active_round(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_active_round(integer) TO authenticated;

-- Make the API see the new function right away.
NOTIFY pgrst, 'reload schema';
