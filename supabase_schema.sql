-- ============================================================
-- MYL App Web - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 0. Email whitelist (managed manually in Supabase dashboard)
CREATE TABLE public.allowed_emails (
  email       TEXT PRIMARY KEY,
  note        TEXT,                -- optional: e.g. "jugador torneo premier"
  premier_id  SMALLINT,            -- ID único del jugador en el torneo premier
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
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT NOT NULL UNIQUE,
  is_public         BOOLEAN NOT NULL DEFAULT true,
  premier_player_id SMALLINT,       -- Copiado automáticamente de allowed_emails.premier_id al crear el perfil
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- ============================================================
-- Auto-assign premier_player_id from allowed_emails on profile insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_profile_premier_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.premier_player_id := (
    SELECT ae.premier_id
    FROM public.allowed_emails ae
    JOIN auth.users u ON u.email = ae.email
    WHERE u.id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_insert_set_premier_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_premier_id();

-- ============================================================
-- Monthly banlists editable in app (admin only)
-- ============================================================
CREATE TABLE public.monthly_banlists (
  id               BIGSERIAL PRIMARY KEY,
  format           TEXT NOT NULL CHECK (format IN ('pb_libre', 'pb_edition', 'bf_libre', 'bf_limited')),
  year             SMALLINT NOT NULL,
  month            SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  banned_cards     JSONB NOT NULL DEFAULT '[]'::jsonb,
  limited_x1_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  limited_x2_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by       UUID DEFAULT auth.uid(),
  updated_by       UUID,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (format, year, month)
);

CREATE INDEX idx_monthly_banlists_format_date
  ON public.monthly_banlists (format, year DESC, month DESC);

ALTER TABLE public.monthly_banlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read monthly banlists"
  ON public.monthly_banlists FOR SELECT
  USING (true);

CREATE POLICY "Only admin can insert monthly banlists"
  ON public.monthly_banlists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  );

CREATE POLICY "Only admin can update monthly banlists"
  ON public.monthly_banlists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  );

CREATE POLICY "Only admin can delete monthly banlists"
  ON public.monthly_banlists FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  );

CREATE TRIGGER on_monthly_banlists_updated
  BEFORE UPDATE ON public.monthly_banlists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
