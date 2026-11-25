import { FaArrowRight, FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { FORMAT_LABELS, type StepId, type StepStatus } from './adminUtils';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

const NEXT_TEXT: Record<StepId, string> = {
  torneo: 'Crear el torneo',
  razas: 'Registrar las razas',
  rondas: 'Generar rondas',
  marcadores: 'Cargar marcadores',
  cerrar: 'Archivar el torneo',
};

function formatDate(date: string) {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

interface StatusHeaderProps {
  admin: TournamentAdminState;
  next: StepId;
  current: StepId;
  steps: StepStatus[];
  onGo: (step: StepId) => void;
}

/** Name and key facts of the active tournament, plus a shortcut to the next step. */
export default function StatusHeader({ admin, next, current, onGo }: StatusHeaderProps) {
  const saved = admin.savedForm;
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>Admin de torneos</p>
      {saved ? (
        <>
          <h1 className={styles.title}>{saved.name || 'Torneo sin nombre'}</h1>
          <ul className={styles.facts}>
            <li className={saved.format === 'FX' ? styles.chipFx : saved.format === 'PB' ? styles.chipPb : styles.chipMixed}>
              {FORMAT_LABELS[saved.format]}
            </li>
            <li className={styles.fact}><FaUsers aria-hidden /> {saved.playerIds.length} jugadores</li>
            {saved.startDate && (
              <li className={styles.fact}>
                <FaCalendarAlt aria-hidden /> {formatDate(saved.startDate)}
                {saved.endDate && saved.endDate !== saved.startDate ? ` – ${formatDate(saved.endDate)}` : ''}
              </li>
            )}
            {saved.locationName && <li className={styles.fact}><FaMapMarkerAlt aria-hidden /> {saved.locationName}</li>}
          </ul>
        </>
      ) : (
        <>
          <h1 className={styles.title}>Nuevo torneo</h1>
          <p className={styles.lede}>No hay un torneo activo. Completa los datos para crearlo.</p>
        </>
      )}
      {saved && next !== current && (
        <button type="button" className={styles.nextButton} onClick={() => onGo(next)}>
          Siguiente: {NEXT_TEXT[next]} <FaArrowRight aria-hidden />
        </button>
      )}
    </header>
  );
}
