import { useEffect, useRef } from 'react';

/**
 * Hook que preserva la posición del scroll durante re-renders
 * Guarda la posición antes de actualizar y la restaura después
 */
export const usePreserveScroll = () => {
  const scrollPositionRef = useRef(0);

  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const restoreScrollPosition = () => {
    window.scrollTo(0, scrollPositionRef.current);
  };

  return { saveScrollPosition, restoreScrollPosition, scrollPositionRef };
};

/**
 * Hook que automáticamente preserva el scroll cuando un estado cambia
 * Se usa envolviendo los setters que causan problemas
 */
export const useScrollPreservingState = (
  initialState: any,
  setStateCallback: (value: any) => void
) => {
  const scrollPositionRef = useRef(0);

  const setStateWithScrollPreservation = (newState: any) => {
    // Salvar posición actual
    scrollPositionRef.current = window.scrollY;

    // Actualizar estado
    setStateCallback(newState);

    // Restaurar posición en el siguiente frame
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  };

  return setStateWithScrollPreservation;
};
