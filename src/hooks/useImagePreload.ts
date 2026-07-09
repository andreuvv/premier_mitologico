import { useEffect, useState } from 'react';
import { preloadImages } from '../utils/preloadImages';

export function useImagePreload(urls: string[]): { isReady: boolean; progress: number } {
  const urlsKey = urls.join('|');
  const [progress, setProgress] = useState(urls.length === 0 ? 100 : 0);
  const [isReady, setIsReady] = useState(urls.length === 0);

  useEffect(() => {
    if (urls.length === 0) {
      setIsReady(true);
      setProgress(100);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    setProgress(0);

    preloadImages(urls, (loaded, total) => {
      if (cancelled) return;
      setProgress(Math.round((loaded / total) * 100));
    }).then(() => {
      if (!cancelled) {
        setIsReady(true);
        setProgress(100);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [urlsKey, urls.length]);

  return { isReady, progress };
}
