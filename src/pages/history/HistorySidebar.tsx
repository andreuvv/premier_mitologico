import type { Tournament } from '../../services/tournamentAPI';
import styles from '../TournamentHistoryPage.module.css';

type TournamentView = 'resumen' | 'standings' | 'rounds';

interface HistorySidebarProps {
  view: string | undefined;
  loading: boolean;
  hasTournaments: boolean;
  premierByYear: Record<number, Tournament[]>;
  premierYears: number[];
  specialByYear: Record<number, Tournament[]>;
  specialYears: number[];
  hasSpecialEvents: boolean;
  selectedTournament: Tournament | null;
  expandedTournament: number | null;
  expandedYear: number | null;
  onToggleYear: (year: number) => void;
  expandedSpecialYear: number | null;
  onToggleSpecialYear: (year: number) => void;
  premierExpanded: boolean;
  onTogglePremier: () => void;
  specialExpanded: boolean;
  onToggleSpecial: () => void;
  onOpenView: (path: string) => void;
  onTournamentClick: (tournament: Tournament) => void;
  onSpecialEventClick: (tournament: Tournament) => void;
  onViewClick: (tournament: Tournament, view: TournamentView) => void;
  open: boolean;
  isNarrow: boolean;
  onClose: () => void;
}

/** Navigation of the history: global stats, premier tournaments and special events by year. */
export default function HistorySidebar(props: HistorySidebarProps) {
  const { view, selectedTournament, expandedTournament } = props;

  const viewButton = (tournament: Tournament, target: TournamentView, label: string) => (
    <button
      className={`${styles.viewButton} ${view === target ? styles.activeView : ''}`}
      onClick={() => props.onViewClick(tournament, target)}
    >
      {label}
    </button>
  );

  return (
    <aside
      id="history-sidebar"
      className={`${styles.sidebar} ${props.open ? styles.sidebarOpen : ''}`}
      aria-hidden={props.isNarrow && !props.open}
      inert={props.isNarrow && !props.open ? true : undefined}
    >
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Historial</span>
        <button
          type="button"
          className={styles.closeSidebar}
          onClick={props.onClose}
        >
          Cerrar
        </button>
      </div>
      {props.loading ? (
        <div className={styles.loadingText}>Cargando...</div>
      ) : !props.hasTournaments ? (
        <div className={styles.emptyText}>No hay torneos archivados</div>
      ) : (
        <>
          <div className={styles.globalSection}>
            <h3 className={styles.globalTitle}>Estadísticas Globales</h3>
            <button
              className={`${styles.globalButton} ${view === 'global-standings' ? styles.activeView : ''}`}
              onClick={() => props.onOpenView('/tournament-history/0/global-standings')}
            >
              Ranking Global
            </button>
            <button
              className={`${styles.globalButton} ${view === 'global-races' ? styles.activeView : ''}`}
              onClick={() => props.onOpenView('/tournament-history/0/global-races')}
            >
              Razas Global
            </button>
          </div>
          <div className={styles.divider} />

          {/* Torneos Premier Accordion */}
          <div className={styles.accordionSection}>
            <button
              className={styles.accordionButton}
              onClick={props.onTogglePremier}
            >
              <span>Torneos Premier</span>
              <span className={styles.arrow}>{props.premierExpanded ? '▼' : '▶'}</span>
            </button>
            {props.premierExpanded && (
              <div className={styles.tournamentList}>
                {props.premierYears.map(year => (
                  <div key={year} className={styles.yearGroup}>
                    <button
                      className={`${styles.yearButton} ${props.expandedYear === year ? styles.active : ''}`}
                      onClick={() => props.onToggleYear(year)}
                    >
                      <span>{year}</span>
                      <span className={styles.arrow}>{props.expandedYear === year ? '▼' : '▶'}</span>
                    </button>
                    {props.expandedYear === year && (
                      <div className={styles.yearTournaments}>
                        {props.premierByYear[year].map(tournament => (
                          <div key={tournament.id} className={styles.tournamentItem}>
                            <button
                              className={`${styles.tournamentButton} ${selectedTournament?.id === tournament.id ? styles.active : ''}`}
                              onClick={() => props.onTournamentClick(tournament)}
                            >
                              {tournament.month} - {tournament.name}
                            </button>
                            {expandedTournament === tournament.id && (
                              <div className={styles.viewOptions}>
                                {viewButton(tournament, 'resumen', 'Resumen')}
                                {viewButton(tournament, 'standings', 'Tabla Final')}
                                {viewButton(tournament, 'rounds', 'Rondas')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eventos Especiales Accordion */}
          <div className={styles.accordionSection}>
            <button
              className={styles.accordionButton}
              onClick={props.onToggleSpecial}
            >
              <span>Eventos Especiales</span>
              <span className={styles.arrow}>{props.specialExpanded ? '▼' : '▶'}</span>
            </button>
            {props.specialExpanded && (
              !props.hasSpecialEvents ? (
                <div className={styles.emptySection}>
                  <p>No hay eventos especiales registrados</p>
                </div>
              ) : (
                <div className={styles.tournamentList}>
                  {props.specialYears.map(year => (
                    <div key={year} className={styles.yearGroup}>
                      <button
                        className={`${styles.yearButton} ${props.expandedSpecialYear === year ? styles.active : ''}`}
                        onClick={() => props.onToggleSpecialYear(year)}
                      >
                        <span>{year}</span>
                        <span className={styles.arrow}>{props.expandedSpecialYear === year ? '▼' : '▶'}</span>
                      </button>
                      {props.expandedSpecialYear === year && (
                        <div className={styles.yearTournaments}>
                          {props.specialByYear[year].map(tournament => (
                            <div key={tournament.id} className={styles.tournamentItem}>
                              <button
                                className={`${styles.tournamentButton} ${selectedTournament?.id === tournament.id ? styles.active : ''}`}
                                onClick={() => props.onSpecialEventClick(tournament)}
                              >
                                {tournament.month} - {tournament.name}
                              </button>
                              {expandedTournament === tournament.id && (
                                <div className={styles.viewOptions}>
                                  {viewButton(tournament, 'standings', 'Tabla Final')}
                                  {viewButton(tournament, 'rounds', 'Rondas')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}
    </aside>
  );
}
