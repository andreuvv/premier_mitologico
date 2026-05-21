-- ============================================================
-- Migration: user_collections (row-per-card) → user_collections_v2 (JSONB per user+format)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Create new JSONB-based table
CREATE TABLE IF NOT EXISTS public.user_collections_v2 (
  user_id UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format  TEXT    NOT NULL CHECK (format IN ('pb', 'fx')),
  cards   JSONB   NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, format)
);

-- Step 2: Migrate existing data from old table
-- Aggregates all (card_id, copy_count) rows into one JSONB per user+format:
-- { "101": 2, "205": 1, "308": 3 }
INSERT INTO public.user_collections_v2 (user_id, format, cards)
SELECT
  user_id,
  format,
  COALESCE(jsonb_object_agg(card_id::text, copy_count), '{}') AS cards
FROM public.user_collections
GROUP BY user_id, format
ON CONFLICT (user_id, format) DO NOTHING;

-- Step 3: Enable Row Level Security
ALTER TABLE public.user_collections_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own collection"
  ON public.user_collections_v2 FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CLEANUP — Run this ONLY after confirming the frontend works correctly:
-- ============================================================
-- ALTER TABLE public.user_collections RENAME TO user_collections_old;
-- DROP TABLE public.user_collections_old;
