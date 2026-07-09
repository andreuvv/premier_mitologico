export function preloadImages(
  urls: string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  if (urls.length === 0) {
    onProgress?.(0, 0);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let completed = 0;
    const total = urls.length;

    const checkDone = () => {
      completed += 1;
      onProgress?.(completed, total);
      if (completed >= total) {
        resolve();
      }
    };

    urls.forEach((url) => {
      const img = new Image();
      img.onload = checkDone;
      img.onerror = checkDone;
      img.src = url;
    });
  });
}
