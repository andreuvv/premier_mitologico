import MitoxicosLoader from './MitoxicosLoader';
import styles from './SectionLoader.module.css';

interface SectionLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SectionLoader = ({ message, size = 'md' }: SectionLoaderProps) => {
  return (
    <div className={styles.section} role="status" aria-live="polite">
      <MitoxicosLoader indeterminate message={message} size={size} />
    </div>
  );
};

export default SectionLoader;
