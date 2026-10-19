import { useState } from 'react';
import { useActiveTournamentCard } from '../hooks/useActiveTournamentCard';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';
import styles from './MapCard.module.css';

export default function MapCard() {
  const { loading, tournament } = useActiveTournamentCard();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const hasLocation = Boolean(tournament?.locationAddress);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapUrl = hasLocation
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(tournament?.locationAddress ?? '')}&zoom=16`
    : '';

  const placeName = loading
    ? 'Cargando…'
    : !tournament
      ? 'Aún no se ha creado un nuevo torneo.'
      : hasLocation
        ? (user ? (tournament.locationName || tournament.locationAddress) : '???')
        : 'TBD';
  const address = !tournament || !hasLocation
    ? (tournament ? 'Ubicación aún no definida' : '')
    : (user ? tournament.locationAddress : '???');

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>🗺️</span>
          <h2>UBICACIÓN DEL TORNEO PREMIER</h2>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.locationInfo}>
          <p className={styles.locationName}>{placeName}</p>
          <p className={styles.address}>{address}</p>
        </div>
      </div>
      <div className={styles.mapContainer}>
        {hasLocation && user ? (
          <iframe
            src={mapUrl}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación del torneo"
          ></iframe>
        ) : !hasLocation ? (
          <div className={styles.noMapMessage}>
            <p className={styles.noMapText}>
              {tournament ? 'Ubicación aún no definida' : 'Aún no se ha creado un nuevo torneo.'}
            </p>
          </div>
        ) : null}
      </div>
      {hasLocation && !user && (
        <div className={styles.authOverlay}>
          <p className={styles.authOverlayText}>Inicia sesión para ver la ubicación del torneo</p>
          <button className={styles.authOverlayButton} onClick={() => setAuthModalOpen(true)}>
            Iniciar Sesión
          </button>
        </div>
      )}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}
