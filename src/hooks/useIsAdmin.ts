import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { isCurrentUserBanlistAdmin } from '../services/monthlyBanlistService';

/**
 * Whether the signed-in user is the site admin. Shared and cached, so pages
 * don't each query the profile again.
 * `checking` is true while the session or the admin check is still loading.
 */
export function useIsAdmin(): { isAdmin: boolean; checking: boolean } {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const query = useQuery({
    queryKey: ['auth', 'is-admin', userId],
    queryFn: () => isCurrentUserBanlistAdmin(userId as string),
    enabled: userId !== null,
    staleTime: 5 * 60_000,
  });

  if (userId === null) return { isAdmin: false, checking: authLoading };
  return { isAdmin: query.data === true, checking: query.isPending };
}
