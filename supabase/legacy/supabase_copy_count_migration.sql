-- Add copy count support to existing user collections.
ALTER TABLE public.user_collections
ADD COLUMN IF NOT EXISTS copy_count INTEGER;

UPDATE public.user_collections
SET copy_count = 1
WHERE copy_count IS NULL OR copy_count < 1;

ALTER TABLE public.user_collections
ALTER COLUMN copy_count SET DEFAULT 1;

ALTER TABLE public.user_collections
ALTER COLUMN copy_count SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_collections_copy_count_check'
      AND conrelid = 'public.user_collections'::regclass
  ) THEN
    ALTER TABLE public.user_collections
    ADD CONSTRAINT user_collections_copy_count_check CHECK (copy_count >= 1);
  END IF;
END
$$;
