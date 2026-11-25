-- Enable bf_ragnarok without rewriting old bf_limited rows.
-- Run this in Supabase SQL editor.
--
-- This keeps historical bf_limited rows valid while allowing new bf_ragnarok inserts.
-- The app already reads/writes bf_ragnarok only.

BEGIN;

DO $$
DECLARE
	rec RECORD;
BEGIN
	FOR rec IN
		SELECT c.conname
		FROM pg_constraint c
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_namespace n ON n.oid = t.relnamespace
		WHERE n.nspname = 'public'
			AND t.relname = 'monthly_banlists'
			AND c.contype = 'c'
			AND pg_get_constraintdef(c.oid) ILIKE '%format%'
	LOOP
		EXECUTE format('ALTER TABLE public.monthly_banlists DROP CONSTRAINT %I', rec.conname);
	END LOOP;
END $$;

ALTER TABLE public.monthly_banlists
ADD CONSTRAINT monthly_banlists_format_check
CHECK (format IN ('pb_libre', 'pb_edition', 'bf_libre', 'bf_limited', 'bf_ragnarok'));

COMMIT;
