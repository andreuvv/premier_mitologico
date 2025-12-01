import styles from './MapCard.module.css';

export default function MapCard() {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=Las+Tórtolas+3273,+Macul,+Santiago&zoom=16`;
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>🗺️</span>
          <h2>UBICACIÓN DEL TORNEO</h2>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.locationInfo}>
          <p className={styles.locationName}>Donde los Karens</p>
          <p className={styles.address}>Las Tórtolas 3273, Macul, Santiago</p>
        </div>
      </div>
      <div className={styles.mapContainer}>
        <iframe
          src={mapUrl}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}
