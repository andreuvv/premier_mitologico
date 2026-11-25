import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';

const EMPTY = new Map<number, string>();

/** Avatar URL by premier player id, for players with a public profile. Cached and shared. */
export function usePlayerAvatars(): Map<number, string> {
  const { data } = useQuery({
    queryKey: ['profiles', 'premier-avatars'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('profiles')
        .select('premier_player_id, avatar_url')
        .eq('is_public', true)
        .not('premier_player_id', 'is', null);
      if (error) throw error;
      const avatars = new Map<number, string>();
      (rows ?? []).forEach((row) => {
        if (row.premier_player_id && row.avatar_url) avatars.set(row.premier_player_id, row.avatar_url);
      });
      return avatars;
    },
    staleTime: 10 * 60_000,
  });
  return data ?? EMPTY;
}
