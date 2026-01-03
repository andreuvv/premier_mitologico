import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import ScrollToTop from './components/ScrollToTop';
import styles from './App.module.css';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const TournamentInfoPage = lazy(() => import('./pages/TournamentInfoPage'));
const GameFormatsPage = lazy(() => import('./pages/GameFormatsPage'));
const BanlistPage = lazy(() => import('./pages/BanlistPage'));
const FixturePage = lazy(() => import('./pages/FixturePage'));
const StandingsPage = lazy(() => import('./pages/StandingsPage'));
const TournamentHistoryPage = lazy(() => import('./pages/TournamentHistoryPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div>Cargando...</div>
  </div>
);

function App() {
  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </main>
      <ScrollToTop />
    </div>
  );
}

export default App;

