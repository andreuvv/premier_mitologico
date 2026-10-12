import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GlobalStanding } from '../services/tournamentAPI';
import styles from './GlobalStandingsTable.module.css';

interface GlobalStandingsTableProps {
  standings: GlobalStanding[];
  title?: string;
}

interface ColumnHeaderProps {
  label: string;
  full: ReactNode;
  compact: ReactNode;
  className?: string;
}

const ColumnHeader = ({ label, full, compact, className }: ColumnHeaderProps) => (
  <th scope="col" className={className} title={label} aria-label={label}>
    <span className={styles.headerFull} aria-hidden="true">{full}</span>
    <span className={styles.headerCompact} aria-hidden="true">{compact}</span>
  </th>
);

interface RaceCellProps {
  race: string | null;
  winrate: number;
}

const RaceCell = ({ race, winrate }: RaceCellProps) => {
  if (!race) return <>-</>;

  const winrateLabel = `${winrate.toFixed(1)}%`;

  return (
    <>
      <span className={styles.raceInline}>{`${race} (${winrateLabel})`}</span>
      <span className={styles.raceStack}>
        <span className={styles.raceName}>{race}</span>
        <span className={styles.raceWinrate}>{winrateLabel}</span>
      </span>
    </>
  );
};

const GlobalStandingsTable = ({ standings, title = 'Ranking Global' }: GlobalStandingsTableProps) => {
  const navigate = useNavigate();

  return (
    <div className={styles.globalStandingsView}>
      {title && <h1 className={styles.pageTitle}>{title}</h1>}
      {standings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no hay datos de ranking global disponibles.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.globalStandingsTable}>
            <thead>
              <tr>
                <th scope="col" className={styles.positionColumn}>#</th>
                <th scope="col" className={styles.nameColumn}>Jugador</th>
                <ColumnHeader
                  className={styles.placeColumn}
                  label="1eros lugares conseguidos"
                  full="🥇 1eros Lugares conseguidos"
                  compact={<><span aria-hidden="true">🥇</span><span>1º</span></>}
                />
                <ColumnHeader
                  className={styles.placeColumn}
                  label="2dos lugares conseguidos"
                  full="🥈 2dos Lugares conseguidos"
                  compact={<><span aria-hidden="true">🥈</span><span>2º</span></>}
                />
                <ColumnHeader
                  className={styles.placeColumn}
                  label="3eros lugares conseguidos"
                  full="🥉 3eros Lugares conseguidos"
                  compact={<><span aria-hidden="true">🥉</span><span>3º</span></>}
                />
                <ColumnHeader
                  className={styles.tournamentsColumn}
                  label="Torneos participados"
                  full="Torneos Participados"
                  compact="Torneos"
                />
                <ColumnHeader
                  className={styles.raceColumn}
                  label="WinRate de la raza más usada en Primer Bloque"
                  full="Raza más usada PB (Winrate%)"
                  compact={<><span>WinRate</span><span>PB</span></>}
                />
                <ColumnHeader
                  className={styles.raceColumn}
                  label="WinRate de la raza más usada en Furia Extensión"
                  full="Raza más usada FX (Winrate%)"
                  compact={<><span>WinRate</span><span>FX</span></>}
                />
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => {
                let medalClass = '';
                let positionBadge = '';
                if (index === 0) {
                  medalClass = styles.goldMedalRow;
                  positionBadge = '🏆';
                } else if (index === 1) {
                  medalClass = styles.silverMedalRow;
                  positionBadge = '🥈';
                } else if (index === 2) {
                  medalClass = styles.bronzeMedalRow;
                  positionBadge = '🥉';
                }

                return (
                  <tr key={standing.player_id} className={medalClass}>
                    <td className={styles.positionColumn}>{index + 1}</td>
                    <td className={styles.nameColumn}>
                      <button
                        className={styles.playerLink}
                        onClick={() => navigate(`/players/${encodeURIComponent(standing.player_name)}`)}
                      >
                        {positionBadge ? `${positionBadge} ` : ''}{standing.player_name}
                      </button>
                    </td>
                    <td className={`${styles.centerColumn} ${styles.placeColumn}`}>{standing.first_place_count}</td>
                    <td className={`${styles.centerColumn} ${styles.placeColumn}`}>{standing.second_place_count}</td>
                    <td className={`${styles.centerColumn} ${styles.placeColumn}`}>{standing.third_place_count}</td>
                    <td className={`${styles.centerColumn} ${styles.tournamentsColumn}`}>{standing.tournaments_participated}</td>
                    <td className={styles.raceColumn}>
                      <RaceCell race={standing.most_played_race_pb} winrate={standing.winrate_pb} />
                    </td>
                    <td className={styles.raceColumn}>
                      <RaceCell race={standing.most_played_race_bf} winrate={standing.winrate_bf} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GlobalStandingsTable;
