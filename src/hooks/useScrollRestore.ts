import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Disable the browser's native scroll restoration so it doesn't fire spurious
// scroll events (and overwrite our sessionStorage values) on back navigation.
// We take full control of scroll restoration in this hook.
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
}

/**
 * Saves and restores window scroll position when navigating back to a list page.
 *
 * Key insight: uses window.history.state.idx (the history stack index) as the
 * storage key instead of location.key.
 *
 * Why idx and not location.key:
 * - Every setSearchParams({ replace: true }) call creates a NEW location.key,
 *   even though it's the same history entry. This made tracking unreliable.
 * - history.replaceState (used by replace navigation) does NOT change the history
 *   index — only pushState increments it.
 * - On back navigation the browser restores the exact same idx, so the storage
 *   key is always found regardless of how many filter/page replaces happened.
 *
 * @param ready - True once the card grid content is fully rendered and ready.
 */
export function useScrollRestore(ready: boolean) {
  const location = useLocation();

  // Compute a stable storage key once at mount time.
  // Combining pathname + idx avoids collisions between different routes.
  const storageKey = useRef(
    (() => {
      const idx = (window.history.state as { idx?: number } | null)?.idx;
      return idx !== undefined ? `myl_scroll_${location.pathname}_${idx}` : null;
    })()
  ).current;

  const hasRestoredRef = useRef(false);
  // Keep a ref to the pathname so the save closure doesn't need it in deps.
  const pathnameRef = useRef(location.pathname);

  // Save scroll position on every scroll event.
  // Reads window.history.state.idx dynamically so the key is always correct
  // even if a push navigation happened while on this page (e.g. format tab).
  useEffect(() => {
    const save = () => {
      const idx = (window.history.state as { idx?: number } | null)?.idx;
      if (idx === undefined) return;
      sessionStorage.setItem(`myl_scroll_${pathnameRef.current}_${idx}`, window.scrollY.toString());
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll once content is ready.
  useEffect(() => {
    if (!ready || hasRestoredRef.current || !storageKey) return;
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;
    const scrollY = parseInt(raw, 10);
    if (isNaN(scrollY) || scrollY <= 0) return;
    hasRestoredRef.current = true;
    setTimeout(() => window.scrollTo(0, scrollY), 150);
  }, [ready, storageKey]);
}
