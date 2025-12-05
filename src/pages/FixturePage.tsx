import { useState } from 'react';
import { fixtureRounds } from '../data/fixtureData';
import { FaDiceOne, FaFire } from 'react-icons/fa';
import styles from './FixturePage.module.css';

const FixturePage = () => {
  const [selectedRound, setSelectedRound] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentRound = fixtureRounds.find(r => r.number === selectedRound);

  const handleMenuClick = (roundNum: number) => {
    setSelectedRound(roundNum);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
          <nav className={styles.nav}>
            {fixtureRounds.map(round => {
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
                  {currentRound.matches.map((match, idx) => (
                    <tr key={idx}>
                      <td className={styles.playerName}>{match.player1}</td>
                      <td className={styles.score}>{match.score1 ?? '-'}</td>
                      <td className={styles.vs}>vs</td>
                      <td className={styles.score}>{match.score2 ?? '-'}</td>
                      <td className={styles.playerName}>{match.player2}</td>
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
