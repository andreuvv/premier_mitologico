-- ============================================================
-- MYL App Web - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 0. Email whitelist (managed manually in Supabase dashboard)
CREATE TABLE public.allowed_emails (
  email       TEXT PRIMARY KEY,
  note        TEXT,                -- optional: e.g. "jugador torneo premier"
  added_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only authenticated admins (service role) can manage this table.
-- Anonymous users can only check if their email exists (SELECT).
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check if their email is whitelisted"
  ON public.allowed_emails FOR SELECT
  USING (true);

-- To add emails, use the Supabase dashboard Table Editor or:
-- INSERT INTO public.allowed_emails (email, note) VALUES ('user@example.com', 'Jugador Premier');

-- 1. User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL UNIQUE,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User card collections
CREATE TABLE public.user_collections (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id     INTEGER NOT NULL,
  format      TEXT NOT NULL CHECK (format IN ('primer-bloque', 'furia-extendido')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, card_id, format)
);

-- 3. Indexes
CREATE INDEX idx_user_collections_user_format ON public.user_collections (user_id, format);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read public profiles; only owner can write
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND EXISTS (
      SELECT 1 FROM public.allowed_emails
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Collections: owner can always read/write; others can read if profile is public
CREATE POLICY "Users can manage their own collection"
  ON public.user_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public collections are viewable by everyone"
  ON public.user_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_collections.user_id
        AND profiles.is_public = true
    )
  );

-- ============================================================
-- Auto-update updated_at on profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
