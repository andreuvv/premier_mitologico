import { tournamentConfig, isTournamentPast } from '../config/tournamentConfig';
import styles from './MapCard.module.css';

export default function MapCard() {
  const isPast = isTournamentPast();
  const hasLocation = tournamentConfig.location.name && tournamentConfig.location.address && tournamentConfig.location.googleMapsQuery;
  const showMap = !isPast && hasLocation;
  
  const mapUrl = hasLocation 
    ? `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${tournamentConfig.location.googleMapsQuery}&zoom=16`
    : '';
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>🗺️</span>
          <h2>UBICACIÓN DEL TORNEO</h2>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.locationInfo}>
          <p className={styles.locationName}>
            {showMap ? tournamentConfig.location.name : 'TBD'}
          </p>
          <p className={styles.address}>
            {showMap ? tournamentConfig.location.address : 'Ubicación de Torneo No Definida'}
          </p>
        </div>
      </div>
      <div className={styles.mapContainer}>
        {showMap ? (
          <iframe
            src={mapUrl}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        ) : (
          <div className={styles.noMapMessage}>
            <p className={styles.noMapText}>Ubicación de Torneo No Definida</p>
          </div>
        )}
      </div>
    </div>
  );
}
