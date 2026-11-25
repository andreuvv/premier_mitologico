import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveTournamentCard } from '../hooks/useActiveTournamentCard';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { nextStep, type StepId } from './tournament-admin/adminUtils';
import { useTournamentAdmin } from './tournament-admin/useTournamentAdmin';
import AdminNav from './tournament-admin/AdminNav';
import StatusHeader from './tournament-admin/StatusHeader';
import TournamentTab from './tournament-admin/TournamentTab';
import RacesTab from './tournament-admin/RacesTab';
import FixtureTab from './tournament-admin/FixtureTab';
import ScoresTab from './tournament-admin/ScoresTab';
import ArchiveTab from './tournament-admin/ArchiveTab';
import { ToastView } from './tournament-admin/ui';
import styles from './TournamentAdminPage.module.css';

const TournamentAdminPage = () => {
  const navigate = useNavigate();
  const { reload: reloadPublicCard } = useActiveTournamentCard();
  const { isAdmin, checking: checkingAdmin } = useIsAdmin();
  const allowed: boolean | null = checkingAdmin ? null : isAdmin;
  const admin = useTournamentAdmin(allowed);
  // The chosen step belongs to one tournament: after archiving or creating, start over.
  const [chosen, setChosen] = useState<{ tournamentId: number | null; step: StepId } | null>(null);

  // The page has its own bottom bar on phones: move the site's floating buttons above it.
  useEffect(() => {
    document.body.classList.add('has-admin-bottom-nav');
    return () => document.body.classList.remove('has-admin-bottom-nav');
  }, []);

  if (allowed === null || (allowed && !admin.loaded)) {
    return <main className={styles.page}><p className={styles.loading}>Cargando torneo…</p></main>;
  }
  if (!allowed) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.cardTitle}>Admin de torneos</h1>
          <p className={styles.hint}>Esta sección es solo para el administrador.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => navigate('/mitoxicos')}>Volver</button>
          </div>
        </div>
      </main>
    );
  }

  const suggested = nextStep(admin.steps);
  // Open on the suggested step once per tournament, then stay where the admin is
  // (saving shouldn't move them). Without a tournament only "Torneo" is available.
  if (admin.activeId !== null && chosen?.tournamentId !== admin.activeId) {
    setChosen({ tournamentId: admin.activeId, step: suggested });
  }
  const step: StepId = admin.activeId === null
    ? 'torneo'
    : chosen?.tournamentId === admin.activeId ? chosen.step : suggested;
  const go = (target: StepId) => {
    setChosen({ tournamentId: admin.activeId, step: target });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className={styles.page}>
      <StatusHeader admin={admin} next={suggested} current={step} steps={admin.steps} onGo={go} />
      <AdminNav steps={admin.steps} current={step} unsaved={admin.unsaved} onSelect={go} />

      <div className={styles.content}>
        {step === 'torneo' && <TournamentTab admin={admin} reloadPublicCard={reloadPublicCard} />}
        {step === 'razas' && <RacesTab admin={admin} />}
        {step === 'rondas' && <FixtureTab admin={admin} onGo={go} />}
        {step === 'marcadores' && <ScoresTab admin={admin} onGo={go} />}
        {step === 'cerrar' && <ArchiveTab admin={admin} onGo={go} />}
      </div>

      <ToastView toast={admin.toast} onClose={admin.dismissToast} />
    </main>
  );
};

export default TournamentAdminPage;
