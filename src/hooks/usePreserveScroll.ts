import { useRef } from 'react';

/**
 * Hook que proporciona métodos para preservar la posición del scroll durante actualizaciones
 * Útil para refrescos automáticos de datos que no deben saltar el scroll
 */
export const usePreserveScroll = () => {
  const scrollPositionRef = useRef(0);

  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const restoreScrollPosition = () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  };

  const withScrollPreservation = async (asyncFn: () => Promise<void>) => {
    saveScrollPosition();
    await asyncFn();
    restoreScrollPosition();
  };

  return { saveScrollPosition, restoreScrollPosition, withScrollPreservation };
};
