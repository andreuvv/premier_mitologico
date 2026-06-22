-- ============================================================
-- Migration: Favoritos y Lista de Deseados (JSONB por user+format)
-- Espeja la estructura/RLS de user_collections_v2.
-- Cada fila es (user_id, format); cards es un mapa { "card_id": 1 } (1 = presencia).
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- Favoritos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_favorites_v2 (
  user_id UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format  TEXT  NOT NULL CHECK (format IN ('pb', 'fx')),
  cards   JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, format)
);

ALTER TABLE public.user_favorites_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
  ON public.user_favorites_v2 FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Lista de Deseados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_wishlist_v2 (
  user_id UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format  TEXT  NOT NULL CHECK (format IN ('pb', 'fx')),
  cards   JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, format)
);

ALTER TABLE public.user_wishlist_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist"
  ON public.user_wishlist_v2 FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
