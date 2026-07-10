import { MITOXICOS_LOADER_BW, MITOXICOS_LOADER_COLOR } from '../../config/loadingAssets';
import styles from './MitoxicosLoader.module.css';

interface MitoxicosLoaderProps {
  progress?: number;
  indeterminate?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MitoxicosLoader = ({
  progress,
  indeterminate = false,
  message,
  size = 'md',
}: MitoxicosLoaderProps) => {
  const fillPercent = indeterminate
    ? undefined
    : Math.min(100, Math.max(0, progress ?? 0));

  const colorRevealStyle = fillPercent !== undefined
    ? { clipPath: `inset(${100 - fillPercent}% 0 0 0)` }
    : undefined;

  return (
    <div className={`${styles.wrapper} ${styles[size]}`}>
      <div className={styles.frame}>
        <img
          src={MITOXICOS_LOADER_BW}
          alt=""
          className={styles.base}
          draggable={false}
        />
        <div
          className={`${styles.colorReveal} ${indeterminate ? styles.indeterminate : ''}`}
          style={colorRevealStyle}
        >
          <img
            src={MITOXICOS_LOADER_COLOR}
            alt=""
            className={styles.color}
            draggable={false}
          />
        </div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default MitoxicosLoader;
