import { Link } from 'react-router-dom';
import { FaIdCard, FaTrophy } from 'react-icons/fa';
import styles from '../PlayersPage.module.css';
import type { PlayerSummary } from './playerStats';

interface PlayerHeaderProps {
  name: string;
  avatarUrl: string | null;
  profileUsername: string | null;
  summary: PlayerSummary;
  hasTournaments: boolean;
}

/** Avatar, link to the profile, trophies and overall record of a player. */
export default function PlayerHeader({ name, avatarUrl, profileUsername, summary, hasTournaments }: PlayerHeaderProps) {
  return (
    <div className={styles.playerHeader}>
      <div className={styles.playerInfoColumn}>
        <div className={styles.playerProfilePicture}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name} profile`}
              className={styles.playerImage}
            />
          ) : (
            <span>{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className={styles.playerName}>{name}</h1>
        {profileUsername && (
          <Link
            to={`/perfil/${encodeURIComponent(profileUsername)}`}
            className={styles.profileLinkBtn}
          >
            <FaIdCard />
            Ver perfil
          </Link>
        )}
        {hasTournaments && (
          <div className={styles.trophySection}>
            <div>
              <h3 className={styles.trophySectionTitle}>Récord de Trofeos</h3>
              <div className={styles.trophyContainer}>
                <div className={styles.trophy}>
                  <FaTrophy className={`${styles.trophyIcon} ${styles.goldTrophy}`} />
                  <span className={styles.trophyCount}>{summary.firstPlaceCount}</span>
                </div>
                <div className={styles.trophy}>
                  <FaTrophy className={`${styles.trophyIcon} ${styles.silverTrophy}`} />
                  <span className={styles.trophyCount}>{summary.secondPlaceCount}</span>
                </div>
                <div className={styles.trophy}>
                  <FaTrophy className={`${styles.trophyIcon} ${styles.bronzeTrophy}`} />
                  <span className={styles.trophyCount}>{summary.thirdPlaceCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasTournaments && (
        <div className={styles.playerSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Récord Global:</span>
            <span className={styles.summaryValue}>
              {summary.totalWins}G - {summary.totalTies}E - {summary.totalLosses}P
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Torneos Participados:</span>
            <span className={styles.summaryValue}>{summary.tournamentsPlayed}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Raza más jugada PB:</span>
            <span className={styles.summaryValue}>
              {summary.mostPlayedRacePB ? `${summary.mostPlayedRacePB} (${summary.mostPlayedRacePBPercentage}%)` : '-'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>WinRate Global en PB:</span>
            <span className={styles.summaryValue}>{summary.winRatePB}%</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Raza más jugada FX:</span>
            <span className={styles.summaryValue}>
              {summary.mostPlayedRaceBF ? `${summary.mostPlayedRaceBF} (${summary.mostPlayedRaceBFPercentage}%)` : '-'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>WinRate Global en FX:</span>
            <span className={styles.summaryValue}>{summary.winRateBF}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
