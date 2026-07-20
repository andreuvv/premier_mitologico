import { useState } from 'react';
import {
  Format,
  Subformat,
  PB_RACES,
  PB_SUBFORMATS,
  FX_SUBFORMATS,
  FX_TOTEM_RACE,
  getFxRacesForSubformat,
} from '../config/deckFormats';
import { FORMAT_BANNER_PB_IMAGE, FORMAT_BANNER_FX_IMAGE, FORMAT_BANNER_PB_BG, FORMAT_BANNER_FX_BG } from '../config/loadingAssets';
import styles from './NewDeckModal.module.css';

interface NewDeckModalProps {
  onClose: () => void;
  onSubmit: (format: Format, subformat: Subformat, race: string, name: string) => void;
  title?: string;
  submitLabel?: string;
  initialFormat?: Format;
  initialSubformat?: Subformat;
  initialRace?: string;
  initialName?: string;
}

export default function NewDeckModal({
  onClose,
  onSubmit,
  title = 'Nuevo Mazo',
  submitLabel = 'Crear Mazo',
  initialFormat = 'pb',
  initialSubformat,
  initialRace = '',
  initialName = '',
}: NewDeckModalProps) {
  const [format, setFormat] = useState<Format>(initialFormat);
  const [subformat, setSubformat] = useState<Subformat>(
    initialSubformat ?? (initialFormat === 'pb' ? 'pb-edicion' : 'fx-vcr'),
  );
  const [race, setRace] = useState(initialRace);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const races = format === 'pb' ? PB_RACES : getFxRacesForSubformat(subformat);
  const subformats = format === 'pb' ? PB_SUBFORMATS : FX_SUBFORMATS;

  const handleFormatChange = (f: Format) => {
    setFormat(f);
    setSubformat(f === 'pb' ? 'pb-edicion' : 'fx-vcr');
    setRace('');
  };

  const handleSubformatChange = (sf: Subformat) => {
    setSubformat(sf);
    if (race === FX_TOTEM_RACE && sf === 'fx-vcr') setRace('');
  };

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) { setError('Dale un nombre a tu mazo.'); return; }
    if (!race) { setError('Selecciona una raza.'); return; }
    onSubmit(format, subformat, race, name.trim());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className={styles.modalTitle}>{title}</h2>

        {/* Nombre */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Nombre</label>
          <input
            className={styles.nameInput}
            type="text"
            placeholder="Ej: Mi mazo Caballero"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        {/* Formato */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Formato</label>
          <div className={styles.formatRow}>
            <button
              type="button"
              className={`${styles.formatBtn} ${format === 'pb' ? styles.formatBtnActivePb : ''}`}
              onClick={() => handleFormatChange('pb')}
              aria-pressed={format === 'pb'}
            >
              <span className={styles.formatBtnBackdrop} style={{ backgroundImage: `url(${FORMAT_BANNER_PB_BG})` }} />
              <span className={styles.formatBtnImg} style={{ backgroundImage: `url(${FORMAT_BANNER_PB_IMAGE})` }} />
              <span className={styles.formatBtnOverlay} />
              <span className={styles.formatBtnName}>Primer Bloque</span>
            </button>
            <button
              type="button"
              className={`${styles.formatBtn} ${format === 'fx' ? styles.formatBtnActiveFx : ''}`}
              onClick={() => handleFormatChange('fx')}
              aria-pressed={format === 'fx'}
            >
              <span className={styles.formatBtnBackdrop} style={{ backgroundImage: `url(${FORMAT_BANNER_FX_BG})` }} />
              <span className={styles.formatBtnImg} style={{ backgroundImage: `url(${FORMAT_BANNER_FX_IMAGE})` }} />
              <span className={styles.formatBtnOverlay} />
              <span className={styles.formatBtnName}>Furia Extendido</span>
            </button>
          </div>
        </div>

        {/* Subformato */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Subformato</label>
          <div className={styles.subformatRow}>
            {subformats.map(sf => (
              <button
                key={sf.value}
                type="button"
                className={subformat === sf.value ? styles.subformatBtnActive : styles.subformatBtn}
                onClick={() => handleSubformatChange(sf.value)}
              >
                <span className={styles.subformatName}>{sf.label}</span>
                <span className={styles.subformatDesc}>{sf.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Raza */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Raza</label>
          <div className={styles.raceGrid}>
            {races.map(r => (
              <button
                key={r}
                type="button"
                className={race === r ? styles.raceBtnActive : styles.raceBtn}
                onClick={() => setRace(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.modalError}>{error}</p>}

        <button type="button" className={styles.confirmButton} onClick={handleSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
