import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import TournamentInfoPage from './pages/TournamentInfoPage';
import GameFormatsPage from './pages/GameFormatsPage';
import BanlistPage from './pages/BanlistPage';
import FixturePage from './pages/FixturePage';
import StandingsPage from './pages/StandingsPage';
import TournamentHistoryPage from './pages/TournamentHistoryPage';
import PlayersPage from './pages/PlayersPage';
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
          <Route path="/fixture" element={<FixturePage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/tournament-history" element={<TournamentHistoryPage />} />
          <Route path="/tournament-history/:tournamentId/:view" element={<TournamentHistoryPage />} />
        </Routes>
      </main>
      <ScrollToTop />
    </div>
  );
}

export default App;

