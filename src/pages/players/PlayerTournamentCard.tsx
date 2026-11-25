import { FaChevronDown } from 'react-icons/fa';
import styles from '../PlayersPage.module.css';
import { getFormatBadges, getRaceRows, type PlayerTournamentData } from './playerStats';

interface PlayerTournamentCardProps {
  tournament: PlayerTournamentData;
  expanded: boolean;
  onToggle: () => void;
}

/** One tournament of the player's history: header with position, details when expanded. */
export default function PlayerTournamentCard({ tournament, expanded, onToggle }: PlayerTournamentCardProps) {
  const pos = tournament.standing?.final_position;
  const podiumClass = pos === 1 ? styles.cardGold : pos === 2 ? styles.cardSilver : pos === 3 ? styles.cardBronze : '';

  return (
    <div className={`${styles.tournamentCard} ${podiumClass}`}>
      <button
        className={styles.accordionHeader}
        onClick={onToggle}
      >
        <div className={styles.headerContent}>
          <h3>{tournament.tournamentName}</h3>
          <div className={styles.headerMeta}>
            <span className={styles.tournamentDate}>
              {tournament.month} {tournament.year}
            </span>
            <div className={styles.formatBadges}>
              {getFormatBadges(tournament).map((badge, i) => (
                <span key={i} className={`${styles.formatBadge} ${badge.type === 'pb' ? styles.formatBadgePB : styles.formatBadgeFX}`}>{badge.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {pos && (
            <span className={`${styles.positionBadge} ${pos === 1 ? styles.posGold : pos === 2 ? styles.posSilver : pos === 3 ? styles.posBronze : ''}`}>
              {pos}°
            </span>
          )}
          <FaChevronDown
            className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className={styles.tournamentInfo}>
          {tournament.standing && (
            <div className={styles.standingInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Posición:</span>
                <span className={styles.value}>{tournament.standing.final_position}°</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Récord (Rondas):</span>
                <span className={styles.value}>
                  {tournament.standing.wins}G - {tournament.standing.ties}E - {tournament.standing.losses}P
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Puntos:</span>
                <span className={styles.value}>{tournament.standing.points}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Partidas Individuales Ganadas:</span>
                <span className={styles.value}>{tournament.standing.total_points_scored}</span>
              </div>
            </div>
          )}

          {tournament.races && (
            <div className={styles.racesInfo}>
              {getRaceRows(tournament).map((row, i) => (
                <div key={i} className={styles.infoRow}>
                  <span className={styles.label}>{row.label}:</span>
                  <span className={styles.value}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
