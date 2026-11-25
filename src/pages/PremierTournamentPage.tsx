import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaClock, FaHandRock, FaListOl, FaThLarge } from 'react-icons/fa';
import { useActiveTournamentCard } from '../hooks/useActiveTournamentCard';
import { useIsAdmin } from '../hooks/useIsAdmin';
import styles from './PremierTournamentPage.module.css';
import FixtureTab from './premier/FixtureTab';
import ResultsMatrixTab from './premier/ResultsMatrixTab';
import RoundTimerModal from './premier/RoundTimerModal';
import StandingsTab from './premier/StandingsTab';
import { useMatchReport } from './premier/useMatchReport';
import { usePlayerAvatars } from './premier/usePlayerAvatars';
import { usePremierLiveData } from './premier/usePremierLiveData';
import { useRoundTimer } from './premier/useRoundTimer';

type Tab = 'fixture' | 'standings' | 'matriz';

const PremierTournamentPage = () => {
  const navigate = useNavigate();
  const { loading: activeLoading, tournament: activeTournament } = useActiveTournamentCard();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const { isAdmin } = useIsAdmin();

  const { pathname } = useLocation();
  // The tab comes from the URL, so Back/Forward move between tabs.
  // Legacy /fixture and /standings open their tab; anything else shows the standings.
  const activeTab: Tab = tabParam === 'fixture' || tabParam === 'matriz' || tabParam === 'standings'
    ? tabParam
    : pathname === '/fixture' ? 'fixture' : 'standings';
  const selectTab = (tab: Tab) => {
    if (tab !== activeTab) navigate(`/torneo-premier/${tab}`);
  };
  const [selectedRound, setSelectedRound] = useState(1);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  const live = usePremierLiveData();
  const timer = useRoundTimer();
  const avatars = usePlayerAvatars();
  const report = useMatchReport(live.refresh);

  // Normalize /torneo-premier, /fixture and /standings to /torneo-premier/<tab>
  // without adding a history entry (a pushed entry here trapped the Back button).
  useEffect(() => {
    const target = `/torneo-premier/${activeTab}`;
    if (pathname !== target) navigate(target, { replace: true });
  }, [activeTab, pathname, navigate]);

  return (
    <div className={styles.container}>
      {/* Title and Subtitle */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>
          {activeLoading
            ? 'Cargando…'
            : activeTournament
              ? `${activeTournament.name} ${activeTournament.monthYear}`
              : 'Aún no se ha creado un nuevo torneo.'}
        </h1>
        {activeTournament && (
          <p className={styles.subtitle}>
            {activeTournament.formats.map((format, index) => (
              <span key={format.link + format.name}>
                <Link to={format.link} style={{ color: 'var(--ocher)', textDecoration: 'none', fontWeight: 'bold' }} className={styles.formatLink}>
                  {format.name}
                </Link>
                {index < activeTournament.formats.length - 1 && ' • '}
              </span>
            ))}
          </p>
        )}
        <button
          className={styles.timerButton}
          onClick={() => setIsTimerOpen(true)}
          title="Abre modal con cronómetro y carrusel de rondas"
        >
          <FaClock className={styles.timerIcon} />
          Cronómetro
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'fixture' ? styles.active : ''}`}
          onClick={() => selectTab('fixture')}
        >
          <FaHandRock className={styles.tabIcon} />
          Emparejamiento
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'matriz' ? styles.active : ''}`}
          onClick={() => selectTab('matriz')}
        >
          <FaThLarge className={styles.tabIcon} />
          Matriz de Resultados
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'standings' ? styles.active : ''}`}
          onClick={() => selectTab('standings')}
        >
          <FaListOl className={styles.tabIcon} />
          Tabla de Posiciones
        </button>
      </div>

      {activeTab === 'fixture' && (
        <div className={styles.tabContent}>
          <FixtureTab
            fixtureData={live.fixtureData}
            loading={live.fixtureLoading}
            error={live.fixtureError}
            selectedRound={selectedRound}
            onSelectRound={setSelectedRound}
            avatars={avatars}
            isAdmin={isAdmin}
            report={report}
          />
        </div>
      )}

      {activeTab === 'standings' && (
        <div className={styles.tabContent}>
          <StandingsTab
            standings={live.standings}
            playoffWinners={live.playoffWinners}
            hasExtraRound={live.hasExtraRound}
            loading={live.standingsLoading}
            error={live.standingsError}
            lastUpdated={live.lastUpdated}
            fixtureData={live.fixtureData}
            tournamentFormat={activeTournament?.format}
          />
        </div>
      )}

      {activeTab === 'matriz' && (
        <div className={styles.tabContent}>
          <ResultsMatrixTab
            fixtureData={live.fixtureData}
            standings={live.standings}
            loading={live.fixtureLoading || live.standingsLoading}
            error={live.fixtureError || live.standingsError}
          />
        </div>
      )}

      {isTimerOpen && live.fixtureData && live.fixtureData.rounds.length > 0 && (
        <RoundTimerModal
          fixtureData={live.fixtureData}
          timer={timer}
          avatars={avatars}
          isAdmin={isAdmin}
          report={report}
          onClose={() => setIsTimerOpen(false)}
        />
      )}
    </div>
  );
};

export default PremierTournamentPage;
