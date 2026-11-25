import { QueryClient } from '@tanstack/react-query';

// Single cache shared by React components (useQuery) and by plain service
// functions (queryClient.fetchQuery), so the same data is fetched once and reused.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

/** Cache key prefixes. Invalidate a prefix to refetch everything under it. */
export const queryKeys = {
  tournaments: ['tournaments'] as const,
  /** Data of the tournament in progress (changes during the event). */
  live: ['tournaments', 'live'] as const,
  /** Reference data and archived tournaments (rarely changes). */
  reference: ['tournaments', 'reference'] as const,
};
