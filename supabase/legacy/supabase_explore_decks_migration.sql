-- Migration: Allow authenticated users to view all decks (for Explore feature)
-- Run this in your Supabase SQL editor.

CREATE POLICY "Authenticated users can view all decks"
  ON public.user_decks FOR SELECT
  USING (auth.uid() IS NOT NULL);
