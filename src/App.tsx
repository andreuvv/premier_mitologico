import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import TournamentInfoPage from './pages/TournamentInfoPage';
import GameFormatsPage from './pages/GameFormatsPage';
import BanlistPage from './pages/BanlistPage';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournament-info" element={<TournamentInfoPage />} />
          <Route path="/game-formats" element={<GameFormatsPage />} />
          <Route path="/banlist" element={<BanlistPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

