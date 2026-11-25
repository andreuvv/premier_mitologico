import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tournamentAPI, Tournament, TournamentStanding, TournamentRound, TournamentRacesResponse, GlobalStanding } from '../services/tournamentAPI';
import onlineTournamentService, { OnlineTournament } from '../services/onlineTournamentService';
import OnlineTournamentPage from './OnlineTournamentPage';
import GlobalStandingsTable from '../components/GlobalStandingsTable';
import styles from './TournamentHistoryPage.module.css';
import GlobalRacesView from './history/GlobalRacesView';
import HistorySidebar from './history/HistorySidebar';
import TournamentRoundsView from './history/TournamentRoundsView';
import TournamentStandingsView from './history/TournamentStandingsView';
import TournamentSummaryView from './history/TournamentSummaryView';
import { compareNewestFirst, playoffWinnerNames } from './history/historyUtils';

const TournamentHistoryPage = () => {
  const { tournamentId, view } = useParams<{ tournamentId: string; view?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewingOnlineTournament = location.pathname.includes('/tournament-history/online/');

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [races, setRaces] = useState<TournamentRacesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [expandedTournament, setExpandedTournament] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [torneosPremierExpanded, setTorneosPremierExpanded] = useState(false);
  const [eventosEspecialesExpanded, setEventosEspecialesExpanded] = useState(false);
  const [globalStandings, setGlobalStandings] = useState<GlobalStanding[]>([]);
  const [globalRaces, setGlobalRaces] = useState<TournamentRacesResponse | null>(null);
  const [onlineTournaments, setOnlineTournaments] = useState<OnlineTournament[]>([]);
  const [expandedSpecialYear, setExpandedSpecialYear] = useState<number | null>(null);
  const [hasExtraRound, setHasExtraRound] = useState(false);
  const [playoffWinners, setPlayoffWinners] = useState<Set<string>>(new Set());

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const onChange = () => setIsNarrow(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (tournamentId && tournamentId !== '0' && !isViewingOnlineTournament) {
      setTorneosPremierExpanded(true);
    }
    if (isViewingOnlineTournament) {
      setEventosEspecialesExpanded(true);
    }
  }, [tournamentId, isViewingOnlineTournament]);

  useEffect(() => {
    loadTournaments();
    loadGlobalData();
    loadOnlineTournaments();

    // Auto-navigate to Ranking Global if no tournamentId/view is provided and not viewing online tournament
    if (!tournamentId || (!view && !isViewingOnlineTournament)) {
      // replace: a pushed entry here sent Back to /tournament-history, which redirected again.
      navigate('/tournament-history/0/global-standings', { replace: true });
    }
    // Initial load and redirect only: later route changes are handled by the effects above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGlobalData = async () => {
    try {
      const standings = await tournamentAPI.getGlobalStandings();
      const races = await tournamentAPI.getGlobalRaces();
      setGlobalStandings(standings);
      setGlobalRaces(races);
    } catch (error) {
      console.error('Error loading global data:', error);
    }
  };

  const loadOnlineTournaments = async () => {
    try {
      const data = await onlineTournamentService.getActiveTournaments();
      setOnlineTournaments(data);
    } catch (error) {
      console.error('Error loading online tournaments:', error);
    }
  };

  useEffect(() => {
    const applyRounds = (tournamentRounds: TournamentRound[]) => {
      setRounds(tournamentRounds);
      if (tournamentRounds.some(round => round.is_extra_round)) {
        setHasExtraRound(true);
        setPlayoffWinners(playoffWinnerNames(tournamentRounds));
      }
    };

    const loadTournamentData = async (id: number, viewType: string) => {
      try {
        setHasExtraRound(false);
        setPlayoffWinners(new Set());

        if (viewType === 'standings') {
          const [standingsData, roundsData] = await Promise.all([
            tournamentAPI.getTournamentStandings(id),
            tournamentAPI.getTournamentRounds(id),
          ]);
          setStandings(standingsData);
          applyRounds(roundsData.rounds);
        } else if (viewType === 'rounds') {
          const data = await tournamentAPI.getTournamentRounds(id);
          applyRounds(data.rounds);
        } else if (viewType === 'resumen') {
          const data = await tournamentAPI.getTournamentRaces(id);
          setRaces(data);
        }
      } catch (error) {
        console.error('Error loading tournament data:', error);
      }
    };

    if (tournamentId && view) {
      // Clear accordion states when viewing global views (tournamentId = '0')
      if (tournamentId === '0') {
        setExpandedTournament(null);
        setExpandedYear(null);
        // globalStandings and globalRaces are already loaded on mount, no need to reload
      } else if (!isViewingOnlineTournament) {
        // Load data for specific traditional tournaments
        loadTournamentData(Number(tournamentId), view);
        // Expand tournament's view options when navigating to it
        setExpandedTournament(Number(tournamentId));
      }
    } else if (isViewingOnlineTournament) {
      // Clear traditional tournament accordion states when viewing online tournaments
      setExpandedTournament(null);
      setExpandedYear(null);
    }
  }, [tournamentId, view, isViewingOnlineTournament]);

  const loadTournaments = async () => {
    try {
      const data = await tournamentAPI.getTournaments();
      setTournaments(data);

      if (tournamentId) {
        const tournament = data.find(t => t.id === Number(tournamentId));
        if (tournament) {
          setSelectedTournament(tournament);
          setExpandedTournament(tournament.id);
          if (tournament.type === 'special_event') {
            setEventosEspecialesExpanded(true);
            setExpandedSpecialYear(tournament.year);
          } else {
            setTorneosPremierExpanded(true);
            setExpandedYear(tournament.year);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const openView = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const premierByYear: Record<number, Tournament[]> = {};
  tournaments
    .filter((tournament) => tournament.type !== 'special_event')
    .forEach((tournament) => {
      premierByYear[tournament.year] = [...(premierByYear[tournament.year] ?? []), tournament];
    });
  Object.values(premierByYear).forEach((list) => list.sort(compareNewestFirst));
  const premierYears = Object.keys(premierByYear).map(Number).sort((a, b) => b - a);

  const specialEvents = tournaments.filter((tournament) => tournament.type === 'special_event');
  const specialByYear = specialEvents.reduce<Record<number, Tournament[]>>((grouped, tournament) => {
    grouped[tournament.year] = [...(grouped[tournament.year] ?? []), tournament];
    return grouped;
  }, {});
  Object.values(specialByYear).forEach((list) => list.sort(compareNewestFirst));
  const specialYears = Object.keys(specialByYear).map(Number).sort((a, b) => b - a);

  const selectedOnline = onlineTournaments.find((tournament) => tournament.id === Number(tournamentId));
  const sectionLabel =
    view === 'resumen'
      ? 'Resumen'
      : view === 'standings'
        ? 'Tabla Final'
        : view === 'rounds'
          ? 'Rondas'
          : null;
  const articleKicker = isViewingOnlineTournament
    ? 'Eventos especiales'
    : view === 'global-standings' || view === 'global-races'
      ? 'Estadísticas'
      : sectionLabel || 'Torneo';
  const articleTitle = isViewingOnlineTournament
    ? selectedOnline?.name || 'Evento especial'
    : view === 'global-standings'
      ? 'Ranking Global'
      : view === 'global-races'
        ? 'Razas Global'
        : selectedTournament?.name || 'Historial';

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Archivo</p>
        <h1>Historial</h1>
        <p className={styles.lede}>
          Rankings, razas y resultados de los torneos premier y los eventos especiales.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={sidebarOpen}
            aria-controls="history-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span className={styles.menuGlyph} aria-hidden="true" />
            Menú
          </button>
          <h2 className={styles.mobileTitle}>{articleTitle}</h2>
        </div>

        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}

        <HistorySidebar
          view={view}
          loading={loading}
          hasTournaments={tournaments.length > 0}
          premierByYear={premierByYear}
          premierYears={premierYears}
          specialByYear={specialByYear}
          specialYears={specialYears}
          hasSpecialEvents={specialEvents.length > 0}
          selectedTournament={selectedTournament}
          expandedTournament={expandedTournament}
          expandedYear={expandedYear}
          onToggleYear={(year) => setExpandedYear(expandedYear === year ? null : year)}
          expandedSpecialYear={expandedSpecialYear}
          onToggleSpecialYear={(year) => setExpandedSpecialYear(expandedSpecialYear === year ? null : year)}
          premierExpanded={torneosPremierExpanded}
          onTogglePremier={() => setTorneosPremierExpanded(!torneosPremierExpanded)}
          specialExpanded={eventosEspecialesExpanded}
          onToggleSpecial={() => setEventosEspecialesExpanded(!eventosEspecialesExpanded)}
          onOpenView={openView}
          onTournamentClick={(tournament) => {
            setSelectedTournament(tournament);
            openView(`/tournament-history/${tournament.id}/resumen`);
          }}
          onSpecialEventClick={(tournament) => {
            setSelectedTournament(tournament);
            openView(`/tournament-history/${tournament.id}/standings`);
          }}
          onViewClick={(tournament, viewType) => openView(`/tournament-history/${tournament.id}/${viewType}`)}
          open={sidebarOpen}
          isNarrow={isNarrow}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className={styles.content}>
          {!isViewingOnlineTournament && (
            <div className={styles.articleBar}>
              <div>
                <p className={styles.articleKicker}>{articleKicker}</p>
                <h2 className={styles.articleTitle}>{articleTitle}</h2>
              </div>
            </div>
          )}
          {isViewingOnlineTournament && tournamentId ? (
            <OnlineTournamentPage key={tournamentId} />
          ) : !tournamentId || !view ? (
            <div className={styles.placeholder}>
              <h2>Selecciona un torneo y vista para ver los resultados</h2>
              <p>Usa el menú lateral para navegar por el historial de torneos</p>
            </div>
          ) : view === 'global-standings' ? (
            <GlobalStandingsTable standings={globalStandings} title="" />
          ) : view === 'global-races' ? (
            <GlobalRacesView globalRaces={globalRaces} />
          ) : view === 'resumen' ? (
            <TournamentSummaryView tournament={selectedTournament} races={races} />
          ) : view === 'standings' ? (
            <TournamentStandingsView
              tournament={selectedTournament}
              standings={standings}
              rounds={rounds}
              hasExtraRound={hasExtraRound}
              playoffWinners={playoffWinners}
            />
          ) : (
            <TournamentRoundsView tournament={selectedTournament} rounds={rounds} />
          )}
        </main>
      </div>
    </div>
  );
};

export default TournamentHistoryPage;
