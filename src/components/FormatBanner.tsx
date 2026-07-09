import { useNavigate } from 'react-router-dom';
import { CollectionFormat } from '../types/collection';
import {
  FORMAT_BANNER_FX_BG,
  FORMAT_BANNER_FX_IMAGE,
  FORMAT_BANNER_PB_BG,
  FORMAT_BANNER_PB_IMAGE,
} from '../config/loadingAssets';
import styles from './FormatBanner.module.css';

const PB_IMAGE = FORMAT_BANNER_PB_IMAGE;
const FX_IMAGE = FORMAT_BANNER_FX_IMAGE;
const PB_BG = FORMAT_BANNER_PB_BG;
const FX_BG = FORMAT_BANNER_FX_BG;

interface FormatBannerProps {
  variant?: 'navigate' | 'select';
  selectedFormat?: CollectionFormat;
  onFormatChange?: (format: CollectionFormat) => void;
  smallLabel?: string;
}

const FormatBanner = ({
  variant = 'navigate',
  selectedFormat,
  onFormatChange,
  smallLabel = 'Explorar cartas de',
}: FormatBannerProps) => {
  const navigate = useNavigate();
  const isSelectMode = variant === 'select';

  const isPbActive = isSelectMode && selectedFormat === CollectionFormat.PRIMER_BLOQUE;
  const isFxActive = isSelectMode && selectedFormat === CollectionFormat.FURIA_EXTENDIDO;

  const handleSelect = (format: CollectionFormat) => {
    if (isSelectMode && onFormatChange) {
      onFormatChange(format);
      return;
    }
    navigate(`/coleccion?format=${format}`);
  };

  return (
    <div className={styles.banner}>
      <button
        type="button"
        className={[
          styles.half,
          styles.halfLeft,
          isSelectMode && (isPbActive ? styles.halfActive : styles.halfInactive),
        ].filter(Boolean).join(' ')}
        onClick={() => handleSelect(CollectionFormat.PRIMER_BLOQUE)}
        aria-label="Explorar cartas de Primer Bloque Extendido"
        aria-pressed={isSelectMode ? isPbActive : undefined}
      >
        <div className={styles.halfBackdrop} style={{ backgroundImage: `url(${PB_BG})` }} />
        <div className={`${styles.halfInner} ${styles.halfInnerLeft}`}>
          <div className={styles.halfBg} style={{ backgroundImage: `url(${PB_IMAGE})` }} />
        </div>
        <div className={styles.overlay} />
        <div className={`${styles.content} ${styles.contentLeft}`}>
          <span className={styles.small}>{smallLabel}</span>
          <span className={`${styles.big} ${isPbActive ? styles.bigActiveOcher : ''}`}>Primer Bloque Extendido</span>
        </div>
      </button>

      <button
        type="button"
        className={[
          styles.half,
          styles.halfRight,
          isSelectMode && (isFxActive ? styles.halfActive : styles.halfInactive),
        ].filter(Boolean).join(' ')}
        onClick={() => handleSelect(CollectionFormat.FURIA_EXTENDIDO)}
        aria-label="Explorar cartas de Furia Extendido"
        aria-pressed={isSelectMode ? isFxActive : undefined}
      >
        <div className={styles.halfBackdrop} style={{ backgroundImage: `url(${FX_BG})` }} />
        <div className={`${styles.halfInner} ${styles.halfInnerRight}`}>
          <div className={styles.halfBg} style={{ backgroundImage: `url(${FX_IMAGE})` }} />
        </div>
        <div className={styles.overlay} />
        <div className={`${styles.content} ${styles.contentRight}`}>
          <span className={styles.small}>{smallLabel}</span>
          <span className={`${styles.big} ${isFxActive ? styles.bigActiveBrick : ''}`}>Furia Extendido</span>
        </div>
      </button>

      <div className={styles.divider} aria-hidden="true" />
    </div>
  );
};

export default FormatBanner;
