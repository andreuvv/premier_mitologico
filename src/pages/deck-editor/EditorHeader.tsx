import { Format } from '../../config/deckFormats';
import { editionLabel } from '../../utils/editionName';
import { getSubformatLabel } from '../../utils/deckSubformatLabel';
import { DECK_SIZE } from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | string;

interface EditorHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  formatParam: Format;
  subformat: string;
  race: string;
  isDraft: boolean;
  onDraftChange: (value: boolean) => void;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
  lockedEdition: string | null;
  onLockedEditionChange: (value: string | null) => void;
  editionLocked: boolean;
  editionOptions: { slug: string; name: string }[];
  saveStatus: SaveStatus;
  saveError: string | null | undefined;
  canSave: boolean;
  hasUser: boolean;
  totalDeckCount: number;
  onChangeSection: () => void;
  onExit: () => void;
  onSave: () => void;
}

export default function EditorHeader({
  name, onNameChange, formatParam, subformat, race,
  isDraft, onDraftChange, isPublic, onPublicChange,
  lockedEdition, onLockedEditionChange, editionLocked, editionOptions,
  saveStatus, saveError, canSave, hasUser, totalDeckCount,
  onChangeSection, onExit, onSave,
}: EditorHeaderProps) {
  const formatLabel = formatParam === 'fx' ? 'Furia Extendido' : 'Primer Bloque';
  const subformatLabel = getSubformatLabel(subformat);

  return (
    <div className={styles.headerBar}>
      <div className={styles.headerLeft}>
        <div className={styles.headerTitleRow}>
          <span className={styles.deckIcon}>✦</span>
          <span className={styles.deckLabel}>NUEVO MAZO</span>
        </div>
        <input
          className={styles.nameInput}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Dale un nombre a tu baraja"
          maxLength={100}
        />
        <div className={styles.tagRow}>
          <span className={`${styles.tag} ${formatParam === 'pb' ? styles.tagPb : styles.tagFx}`}>🎮 <strong>{formatLabel}</strong></span>
          <span className={styles.tag}>📋 <strong>{subformatLabel}</strong></span>
          <span className={styles.tag}>🔖 Raza: <strong>{race}</strong></span>
          {isDraft && <span className={`${styles.tag} ${styles.draftTag}`}>📝 Modo Borrador</span>}
        </div>
        {/* Edition picker for pb-edicion */}
        {subformat === 'pb-edicion' && (
          <div className={styles.editionPickerRow}>
            <span className={styles.editionPickerLabel}>Edición:</span>
            <select
              className={styles.editionPickerSelect}
              value={lockedEdition ?? ''}
              onChange={(e) => onLockedEditionChange(e.target.value || null)}
              disabled={editionLocked}
            >
              <option value="">— Selecciona una edición —</option>
              {editionOptions.map((ed) => (
                <option key={ed.slug} value={ed.slug}>{editionLabel(ed.name)}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className={styles.headerRight}>
        <label className={styles.publicToggle}>
          <input
            type="checkbox"
            checked={!isDraft && isPublic}
            onChange={(e) => onPublicChange(e.target.checked)}
            disabled={saveStatus === 'saving' || isDraft}
          />
          <span className={styles.publicToggleSlider} />
          <span className={styles.publicToggleText}>{!isDraft && isPublic ? 'Público' : 'Privado'}</span>
        </label>
        <label className={styles.draftToggle}>
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => onDraftChange(e.target.checked)}
            disabled={saveStatus === 'saving'}
          />
          <span className={styles.draftToggleSlider} />
          <span className={styles.draftToggleText}>Modo Borrador</span>
        </label>
        <button
          className={styles.changeSectionButton}
          onClick={onChangeSection}
          title="Cambiar formato, subformato o raza"
        >
          ⚙ Cambiar sección
        </button>
        <button
          className={styles.backButton}
          onClick={onExit}
        >
          ← Salir
        </button>
        <button
          className={`${styles.saveButton} ${saveStatus === 'saved' ? styles.saveButtonSaved : saveStatus === 'error' ? styles.saveButtonError : ''}`}
          onClick={onSave}
          disabled={!canSave}
          title={!hasUser ? 'Inicia sesión para guardar' : !isDraft && totalDeckCount !== DECK_SIZE ? 'El mazo debe tener 50 cartas para publicarse' : saveError ?? undefined}
        >
          {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'saved' ? '✓ Guardado' : saveStatus === 'error' ? '✕ Error' : '💾 Guardar'}
        </button>
      </div>
    </div>
  );
}
