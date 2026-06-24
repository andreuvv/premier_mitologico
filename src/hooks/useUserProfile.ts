import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import type { FavoriteFormatId, FavoriteRacesMap } from '../config/profileOptions';

export interface UserProfile {
  id: string;
  username: string;
  is_public: boolean;
  premier_player_id: number | null;
  avatar_url: string | null;
  favorite_format: FavoriteFormatId | null;
  favorite_races: FavoriteRacesMap;
  created_at: string;
  updated_at: string;
}

function parseProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    username: row.username as string,
    is_public: row.is_public as boolean,
    premier_player_id: (row.premier_player_id as number | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    favorite_format: (row.favorite_format as FavoriteFormatId | null) ?? null,
    favorite_races: ((row.favorite_races as FavoriteRacesMap) ?? {}),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function loadProfileById(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return parseProfile(data as Record<string, unknown>);
}

export async function loadProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error || !data) return null;
  return parseProfile(data as Record<string, unknown>);
}

export async function getProfileUsernameForPlayerId(playerId: number): Promise<string | null> {
  const profile = await loadProfileByPremierPlayerId(playerId);
  return profile?.username ?? null;
}

export async function loadProfileByPremierPlayerId(playerId: number): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('premier_player_id', playerId)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !data) return null;
  return parseProfile(data as Record<string, unknown>);
}

export function useUserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (updates: {
    username?: string;
    avatar_url?: string | null;
    favorite_format?: FavoriteFormatId | null;
    favorite_races?: FavoriteRacesMap;
  }): Promise<{ error: string | null }> => {
    if (!user) return { error: 'No autenticado' };

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return { error: updateError.message };
    }
    return { error: null };
  }, [user]);

  const uploadAvatar = useCallback(async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!user) return { url: null, error: 'No autenticado' };
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: 'La imagen no puede superar 5 MB' };
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return { url: null, error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF.' };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const folder = user.id;
    const path = `${folder}/avatar.${safeExt}`;

    // Remove previous avatar files so re-uploads work reliably (upsert + mobile same-file pick).
    const { data: existing } = await supabase.storage.from('avatars').list(folder);
    if (existing && existing.length > 0) {
      const toRemove = existing.map((f) => `${folder}/${f.name}`);
      await supabase.storage.from('avatars').remove(toRemove);
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await updateProfile({ avatar_url: url });
    if (profileError) return { url: null, error: profileError };

    return { url, error: null };
  }, [user, updateProfile]);

  return {
    updateProfile,
    uploadAvatar,
    loading,
    error,
    loadProfileById,
    loadProfileByUsername,
  };
}
