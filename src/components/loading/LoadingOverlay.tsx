import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  visible: boolean;
  children: React.ReactNode;
}

const LoadingOverlay = ({ visible, children }: LoadingOverlayProps) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsFadingOut(false);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    setIsFadingOut(true);
    const timer = window.setTimeout(() => {
      setShouldRender(false);
      setIsFadingOut(false);
      document.body.style.overflow = '';
    }, 300);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!shouldRender) {
    return null;
  }

  return createPortal(
    <div
      className={`${styles.overlay} ${isFadingOut ? styles.fadeOut : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={visible}
    >
      <div className={styles.content}>{children}</div>
    </div>,
    document.body,
  );
};

export default LoadingOverlay;
