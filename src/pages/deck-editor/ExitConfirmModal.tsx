import { DECK_SIZE } from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

interface ExitConfirmModalProps {
  totalDeckCount: number;
  hasUser: boolean;
  saving: boolean;
  onClose: () => void;
  onExitWithoutSaving: () => void;
  onSaveDraftAndExit: () => void;
}

export default function ExitConfirmModal({
  totalDeckCount, hasUser, saving, onClose, onExitWithoutSaving, onSaveDraftAndExit,
}: ExitConfirmModalProps) {
  return (
    <div className={styles.exitConfirmOverlay} onClick={onClose}>
      <div className={styles.exitConfirmModal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.exitConfirmClose}
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          ✕
        </button>
        <h3 className={styles.exitConfirmTitle}>¿Seguro que quieres salir sin guardar?</h3>
        <p className={styles.exitConfirmText}>
          Tienes cambios sin guardar en este mazo.
        </p>
        {totalDeckCount !== DECK_SIZE && (
          <p className={styles.exitConfirmWarning}>
            El mazo no está completo: tienes {totalDeckCount} de {DECK_SIZE} cartas.
            Si guardas al salir, se guardará como borrador privado.
          </p>
        )}
        {!hasUser && (
          <p className={styles.exitConfirmWarning}>
            No hay sesión iniciada. Solo podrás salir sin guardar.
          </p>
        )}
        <div className={styles.exitConfirmActions}>
          <button
            type="button"
            className={styles.exitWithoutSaveButton}
            onClick={onExitWithoutSaving}
            disabled={saving}
          >
            Salir sin Guardar
          </button>
          <button
            type="button"
            className={styles.saveDraftExitButton}
            onClick={onSaveDraftAndExit}
            disabled={saving || !hasUser}
            title={!hasUser ? 'Inicia sesión para guardar como borrador' : undefined}
          >
            Guardar como Borrador y Salir
          </button>
        </div>
      </div>
    </div>
  );
}
