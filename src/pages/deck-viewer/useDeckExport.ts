import { useCallback, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { CARD_WIDTH, STACK_OFFSET, withTimeout } from './deckViewerUtils';

export type ExportView = 'grouped' | 'grid';
export type ExportRatio = 'desktop' | 'tablet' | 'mobile';

/**
 * "Export image" flow: options modal, an off-screen copy of the deck with the
 * chosen options, and the PNG capture/download of that copy.
 */
export function useDeckExport(deckName: string | undefined) {
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportView, setExportView] = useState<ExportView>('grid');
  const [exportRatio, setExportRatio] = useState<ExportRatio>('desktop');
  const [exportIncludeSide, setExportIncludeSide] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);

  // Cards are rendered a bit smaller for the tablet/mobile export formats
  // (resolution is preserved via the pixel ratio used during capture)
  const exportCardWidth = exporting
    ? exportRatio === 'mobile'
      ? 72
      : exportRatio === 'tablet'
        ? 82
        : CARD_WIDTH
    : CARD_WIDTH;
  const exportStackOffset = exporting
    ? exportRatio === 'mobile'
      ? 10
      : exportRatio === 'tablet'
        ? 11
        : STACK_OFFSET
    : STACK_OFFSET;
  const exportCardHeight = Math.round(exportCardWidth / 0.72);

  const openExportModal = (currentView: ExportView) => {
    setExportView(currentView);
    setExportRatio('desktop');
    setExportIncludeSide(true);
    setShowExportModal(true);
  };

  const handleExport = useCallback(async () => {
    if (exporting) return;
    // Setting `exporting` mounts a hidden, off-screen copy with the chosen
    // options (see render), so the visible page is never resized.
    setExporting(true);
    // Wait for React to commit and the browser to paint the off-screen copy
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
    );
    const node = exportRef.current;
    if (!node) {
      setExporting(false);
      setShowExportModal(false);
      return;
    }
    try {
      // Wait until every card image inside the export copy has loaded, otherwise
      // the capture can come out blank on slower / mobile connections.
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              }),
        ),
      );

      // Mobile browsers (iOS Safari especially) cap canvas size (~4096px per
      // side, ~16.7M px total). Scale the pixel ratio down so we stay under
      // that limit while keeping the best quality the device allows.
      const w = node.scrollWidth || node.getBoundingClientRect().width;
      const h = node.scrollHeight || node.getBoundingClientRect().height;
      const MAX_SIDE = 4096;
      const MAX_AREA = 16_777_216;
      let pixelRatio = 3;
      if (w > 0 && h > 0) {
        pixelRatio = Math.min(
          pixelRatio,
          MAX_SIDE / w,
          MAX_SIDE / h,
          Math.sqrt(MAX_AREA / (w * h)),
        );
        pixelRatio = Math.max(1, pixelRatio);
      }

      // skipFonts avoids embedding heavy @font-face data (which produces a huge
      // SVG that low-memory mobile browsers fail to rasterize) and also silences
      // the cross-origin (Google Fonts) CORS errors from stylesheet scanning.
      const options = { cacheBust: true, backgroundColor: '#2D2D2D', skipFonts: true } as const;
      let blob = await withTimeout(toBlob(node, { ...options, pixelRatio }), 30_000);
      // Fallback: if the device still couldn't allocate the canvas, retry at 1x.
      if (!blob && pixelRatio > 1) {
        blob = await withTimeout(toBlob(node, { ...options, pixelRatio: 1 }), 30_000);
      }
      if (!blob) throw new Error('El navegador no pudo generar la imagen.');

      const safeName = (deckName ?? 'mazo').trim().replace(/[^\w-]+/g, '_') || 'mazo';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = url;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      console.error('No se pudo exportar la imagen del mazo', err);
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  }, [exporting, deckName]);

  return {
    exporting,
    showExportModal,
    closeExportModal: () => setShowExportModal(false),
    openExportModal,
    exportView,
    setExportView,
    exportRatio,
    setExportRatio,
    exportIncludeSide,
    toggleIncludeSide: () => setExportIncludeSide((v) => !v),
    exportRef,
    exportCardWidth,
    exportCardHeight,
    exportStackOffset,
    handleExport,
  };
}

export type DeckExport = ReturnType<typeof useDeckExport>;
