import styles from '../DeckViewerPage.module.css';
import type { DeckExport } from './useDeckExport';

interface ExportModalProps {
  exporter: DeckExport;
  hasSideDeck: boolean;
}

/** Options for the exported image: card view, screen format and sidedeck. */
export default function ExportModal({ exporter, hasSideDeck }: ExportModalProps) {
  const { exporting, exportView, exportRatio } = exporter;

  return (
    <div
      className={styles.exportModalOverlay}
      onClick={() => !exporting && exporter.closeExportModal()}
    >
      <div className={styles.exportModal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.exportModalClose}
          onClick={exporter.closeExportModal}
          disabled={exporting}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <h3 className={styles.exportModalTitle}>Exportar imagen</h3>

        <div className={styles.exportField}>
          <span className={styles.exportFieldLabel}>Vista de las cartas</span>
          <div className={styles.optionRow}>
            <button
              type="button"
              className={`${styles.optionBtn} ${exportView === 'grouped' ? styles.optionBtnActive : ''}`}
              onClick={() => exporter.setExportView('grouped')}
              disabled={exporting}
            >
              Agrupado
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${exportView === 'grid' ? styles.optionBtnActive : ''}`}
              onClick={() => exporter.setExportView('grid')}
              disabled={exporting}
            >
              Grilla
            </button>
          </div>
        </div>

        <div className={styles.exportField}>
          <span className={styles.exportFieldLabel}>Formato de pantalla</span>
          <div className={styles.optionRow}>
            <button
              type="button"
              className={`${styles.optionBtn} ${exportRatio === 'desktop' ? styles.optionBtnActive : ''}`}
              onClick={() => exporter.setExportRatio('desktop')}
              disabled={exporting}
            >
              🖥️ Escritorio
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${exportRatio === 'tablet' ? styles.optionBtnActive : ''}`}
              onClick={() => exporter.setExportRatio('tablet')}
              disabled={exporting}
            >
              📔 Tablet
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${exportRatio === 'mobile' ? styles.optionBtnActive : ''}`}
              onClick={() => exporter.setExportRatio('mobile')}
              disabled={exporting}
            >
              📱 Móvil
            </button>
          </div>
        </div>

        {hasSideDeck && (
          <div className={styles.exportField}>
            <div className={styles.switchRow}>
              <span className={styles.exportFieldLabel}>Incluir sidedeck</span>
              <button
                type="button"
                role="switch"
                aria-checked={exporter.exportIncludeSide}
                aria-label="Incluir sidedeck"
                className={`${styles.switch} ${exporter.exportIncludeSide ? styles.switchOn : ''}`}
                onClick={exporter.toggleIncludeSide}
                disabled={exporting}
              >
                <span className={styles.switchKnob} />
              </button>
            </div>
          </div>
        )}

        <div className={styles.exportModalFooter}>
          <button
            type="button"
            className={styles.exportCancelBtn}
            onClick={exporter.closeExportModal}
            disabled={exporting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.exportConfirmBtn}
            onClick={exporter.handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className={styles.btnSpinner} aria-hidden="true" />
                Generando...
              </>
            ) : (
              '📷 Exportar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
