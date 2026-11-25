import { useState } from 'react';
import { FaFire, FaListOl } from 'react-icons/fa';
import type { APIFixtureResponse } from '../../services/fixtureAPI';
import styles from '../PremierTournamentPage.module.css';
import { Duelist, MatchReportControl } from './MatchCells';
import type { MatchReport } from './useMatchReport';
import { getSubformatDisplayName } from './premierUtils';

interface FixtureTabProps {
  fixtureData: APIFixtureResponse | null;
  loading: boolean;
  error: string | null;
  selectedRound: number;
  onSelectRound: (round: number) => void;
  avatars: Map<number, string>;
  isAdmin: boolean;
  report: MatchReport;
}

export default function FixtureTab({
  fixtureData,
  loading,
  error,
  selectedRound,
  onSelectRound,
  avatars,
  isAdmin,
  report,
}: FixtureTabProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return <div className={styles.loading}>Cargando emparejamiento...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!fixtureData || fixtureData.rounds.length === 0) {
    return <div className={styles.empty}>No hay emparejamiento disponible aún.</div>;
  }

  const currentRound = fixtureData.rounds.find(r => r.number === selectedRound);

  const handleMenuClick = (roundNum: number) => {
    onSelectRound(roundNum);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <nav className={styles.nav}>
          {fixtureData.rounds.map(round => {
            const RoundIcon = round.format === 'PB' ? FaListOl : FaFire;
            return (
              <button
                key={round.number}
                className={`${styles.menuItem} ${selectedRound === round.number ? styles.active : ''}`}
                onClick={() => handleMenuClick(round.number)}
                title={`Ronda ${round.number} - ${round.format}${round.subformat ? ` (${getSubformatDisplayName(round.subformat)})` : ''}`}
              >
                <RoundIcon className={styles.menuIcon} />
                <span>Ronda {round.number}</span>
                {round.subformat && <span className={styles.subformatBadge}>{getSubformatDisplayName(round.subformat)}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {isMobileMenuOpen && <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />}

      <div className={styles.content}>
        <div className={styles.header}>
          <button className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            ☰
          </button>
          <div>
            <h1>
              {currentRound && (currentRound.format === 'PB' ? <FaListOl className={styles.icon} /> : <FaFire className={styles.icon} />)}
              Ronda {selectedRound} - {currentRound?.format === 'PB' ? 'Primer Bloque' : 'Furia Extendido'}
            </h1>
            {currentRound?.subformat && (
              <p className={styles.subformatText}>{getSubformatDisplayName(currentRound.subformat)}</p>
            )}
          </div>
        </div>

        {currentRound ? (
          <div className={styles.matchesContainer}>
            <table className={styles.matchTable}>
              <thead>
                <tr>
                  <th>Duelista</th>
                  <th>Resultado</th>
                  <th></th>
                  <th>Resultado</th>
                  <th>Duelista</th>
                </tr>
              </thead>
              <tbody>
                {currentRound.matches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <Duelist playerId={match.player1_id} name={match.player1_name} roundNumber={currentRound.number} side="left" fixture={fixtureData} avatars={avatars} />
                    </td>
                    <td className={styles.score}>{match.score1 ?? '-'}</td>
                    <td className={styles.vs}>
                      <div>vs</div>
                      <MatchReportControl match={match} isAdmin={isAdmin} report={report} />
                    </td>
                    <td className={styles.score}>{match.score2 ?? '-'}</td>
                    <td>
                      {match.player2_id === null
                        ? match.player2_name
                        : <Duelist playerId={match.player2_id} name={match.player2_name} roundNumber={currentRound.number} side="right" fixture={fixtureData} avatars={avatars} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay datos disponibles para esta ronda.</p>
        )}
      </div>
    </div>
  );
}
