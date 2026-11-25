import { FaArchive, FaClipboardCheck, FaDragon, FaRandom, FaTrophy } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import type { StepId, StepStatus } from './adminUtils';
import styles from '../TournamentAdminPage.module.css';

const ICONS: Record<StepId, IconType> = {
  torneo: FaTrophy,
  razas: FaDragon,
  rondas: FaRandom,
  marcadores: FaClipboardCheck,
  cerrar: FaArchive,
};

interface AdminNavProps {
  steps: StepStatus[];
  current: StepId;
  unsaved: Record<StepId, boolean>;
  onSelect: (step: StepId) => void;
}

/** Steps of the tournament: a stepper on desktop, a bottom tab bar on phones. */
export default function AdminNav({ steps, current, unsaved, onSelect }: AdminNavProps) {
  return (
    <nav className={styles.nav} aria-label="Etapas del torneo">
      {steps.map((step, index) => {
        const Icon = ICONS[step.id];
        const isCurrent = step.id === current;
        const className = [
          styles.navItem,
          isCurrent ? styles.navItemCurrent : '',
          step.done ? styles.navItemDone : '',
        ].filter(Boolean).join(' ');
        return (
          <button
            key={step.id}
            type="button"
            className={className}
            aria-current={isCurrent ? 'step' : undefined}
            disabled={step.disabled}
            onClick={() => onSelect(step.id)}
          >
            <span className={styles.navBadge} aria-hidden>
              <Icon className={styles.navIcon} />
              <span className={styles.navNumber}>{step.done ? '✓' : index + 1}</span>
            </span>
            <span className={styles.navText}>
              <span className={styles.navLabel}>{step.label}</span>
              <span className={styles.navDetail}>{step.detail}</span>
            </span>
            {unsaved[step.id] && <span className={styles.navDot} title="Cambios sin guardar" aria-label="Cambios sin guardar" />}
          </button>
        );
      })}
    </nav>
  );
}
