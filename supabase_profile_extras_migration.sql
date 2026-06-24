-- ============================================================
-- Migration: Profile extras (avatar, favorite format/races)
-- + public read policies for collections/favorites/wishlist
-- + avatars storage bucket
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Extend profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS favorite_format TEXT
    CHECK (favorite_format IS NULL OR favorite_format IN ('pb_edicion', 'pb_libre', 'fx_libre', 'fx_ragnarok')),
  ADD COLUMN IF NOT EXISTS favorite_races JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Public read policies for user data when profile is public
CREATE POLICY "Public profile collections are viewable"
  ON public.user_collections_v2 FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_collections_v2.user_id
        AND p.is_public = true
    )
  );

CREATE POLICY "Public profile favorites are viewable"
  ON public.user_favorites_v2 FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_favorites_v2.user_id
        AND p.is_public = true
    )
  );

CREATE POLICY "Public profile wishlist are viewable"
  ON public.user_wishlist_v2 FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_wishlist_v2.user_id
        AND p.is_public = true
    )
  );

-- 3. Avatars storage bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Storage RLS: anyone can read avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 5. Storage RLS: users can upload/update/delete their own avatar folder
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
