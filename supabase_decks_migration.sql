-- ============================================================
-- Migration: Create user_decks table
-- Stores user-built decks. Cards stored as { "card_id": copies }
-- All validation (deck rules) is handled in the frontend.
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Create the decks table
CREATE TABLE IF NOT EXISTS public.user_decks (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  format     TEXT    NOT NULL CHECK (format IN ('pb', 'fx')),
  cards      JSONB   NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- JSONB cards structure (keyed by card_id as string):
-- { "12746": 2, "12745": 3, "12742": 1 }
-- Full card data (name, type, cost, etc.) is read from the local JSON catalog.

-- Step 2: Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_decks_updated_at
  BEFORE UPDATE ON public.user_decks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Step 3: Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_format  ON public.user_decks(user_id, format);

-- Step 4: Row Level Security
ALTER TABLE public.user_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own decks"
  ON public.user_decks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
