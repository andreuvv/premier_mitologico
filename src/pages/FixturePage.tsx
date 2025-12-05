import { useState, useEffect } from 'react';
import { fixtureAPI, APIFixtureResponse } from '../services/fixtureAPI';
import { FaDiceOne, FaFire } from 'react-icons/fa';
import styles from './FixturePage.module.css';

const FixturePage = () => {
  const [selectedRound, setSelectedRound] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fixtureData, setFixtureData] = useState<APIFixtureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFixture = async () => {
      try {
        setLoading(true);
        const data = await fixtureAPI.getFixture();
        setFixtureData(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar el fixture. Por favor, intenta de nuevo.');
        console.error('Error fetching fixture:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFixture();
  }, []);

  const currentRound = fixtureData?.rounds.find(r => r.number === selectedRound);

  const handleMenuClick = (roundNum: number) => {
    setSelectedRound(roundNum);
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando fixture...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!fixtureData || fixtureData.rounds.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No hay fixture disponible aún.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
          <nav className={styles.nav}>
            {fixtureData.rounds.map(round => {
              const RoundIcon = round.format === 'PB' ? FaDiceOne : FaFire;
              return (
                <button
                  key={round.number}
                  className={`${styles.menuItem} ${selectedRound === round.number ? styles.active : ''}`}
                  onClick={() => handleMenuClick(round.number)}
                >
                  <RoundIcon className={styles.menuIcon} />
                  <span>Ronda {round.number}</span>
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
            <h1>
              {currentRound && (currentRound.format === 'PB' ? <FaDiceOne className={styles.icon} /> : <FaFire className={styles.icon} />)}
              Ronda {selectedRound} - {currentRound?.format === 'PB' ? 'Primer Bloque' : 'Bloque Furia'}
            </h1>
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
                      <td className={styles.playerName}>{match.player1_name}</td>
                      <td className={styles.score}>{match.score1 ?? '-'}</td>
                      <td className={styles.vs}>vs</td>
                      <td className={styles.score}>{match.score2 ?? '-'}</td>
                      <td className={styles.playerName}>{match.player2_name}</td>
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
    </div>
  );
};

export default FixturePage;
