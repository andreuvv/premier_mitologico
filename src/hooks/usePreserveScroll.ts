import { useRef, useCallback } from 'react';

/**
 * Hook que proporciona métodos para preservar la posición del scroll durante actualizaciones
 * Útil para refrescos automáticos de datos que no deben saltar el scroll
 */
export const usePreserveScroll = () => {
  const scrollPositionRef = useRef(0);

  const withScrollPreservation = useCallback(async (asyncFn: () => Promise<void>) => {
    scrollPositionRef.current = window.scrollY;
    await asyncFn();
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  }, []);

  return { withScrollPreservation };
};
