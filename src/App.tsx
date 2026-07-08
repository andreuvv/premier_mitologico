import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/ScrollToTop';
import styles from './App.module.css';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const MitoxicosHomePage = lazy(() => import('./pages/MitoxicosHomePage'));
const TournamentInfoPage = lazy(() => import('./pages/TournamentInfoPage'));
const GameFormatsPage = lazy(() => import('./pages/GameFormatsPage'));
const BanlistPage = lazy(() => import('./pages/BanlistPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const FolderPage = lazy(() => import('./pages/FolderPage'));
const CardDetailPage = lazy(() => import('./pages/CardDetailPage'));
const PremierTournamentPage = lazy(() => import('./pages/PremierTournamentPage'));
const TournamentHistoryPage = lazy(() => import('./pages/TournamentHistoryPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const OnlineTournamentPage = lazy(() => import('./pages/OnlineTournamentPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DeckBuilderHomePage = lazy(() => import('./pages/DeckBuilderHomePage'));
const DeckBuilderEditorPage = lazy(() => import('./pages/DeckBuilderEditorPage'));
const DeckViewerPage = lazy(() => import('./pages/DeckViewerPage'));
const LocalJsonEditorPage = lazy(() => import('./pages/LocalJsonEditorPage'));
const ReworkPage = lazy(() => import('./pages/ReworkPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

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
            <Route path="/mitoxicos" element={<MitoxicosHomePage />} />
            <Route path="/tournament-info" element={<TournamentInfoPage />} />
            <Route path="/tournament-info/:section" element={<TournamentInfoPage />} />
            <Route path="/tournament-info/:section/:subsection" element={<TournamentInfoPage />} />
            <Route path="/game-formats" element={<GameFormatsPage />} />
            <Route path="/game-formats/:section" element={<GameFormatsPage />} />
            <Route path="/game-formats/:section/:variant" element={<GameFormatsPage />} />
            <Route path="/banlist" element={<BanlistPage />} />
            <Route path="/banlist/:format/:category" element={<BanlistPage />} />
            <Route path="/coleccion" element={<CollectionPage />} />
            <Route path="/reworks" element={<ReworkPage />} />
            <Route path="/carpeta" element={<FolderPage />} />
            <Route path="/coleccion/carta/:format/:id/:slug" element={<CardDetailPage />} />
            <Route path="/torneo-premier" element={<PremierTournamentPage />} />
            <Route path="/torneo-premier/:tab" element={<PremierTournamentPage />} />
            <Route path="/fixture" element={<PremierTournamentPage />} />
            <Route path="/standings" element={<PremierTournamentPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/players/:playerName" element={<PlayersPage />} />
            <Route path="/tournament-history" element={<TournamentHistoryPage />} />
            <Route path="/tournament-history/:tournamentId/:view" element={<TournamentHistoryPage />} />
            <Route path="/tournament-history/online/:tournamentId" element={<TournamentHistoryPage />} />
            <Route path="/online-tournament/:tournamentId" element={<OnlineTournamentPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/deck-builder" element={<Navigate to="/deck-builder/mis-mazos" replace />} />
            <Route path="/deck-builder/mis-mazos" element={<DeckBuilderHomePage />} />
            <Route path="/deck-builder/explorar" element={<DeckBuilderHomePage />} />
            <Route path="/deck-builder/editor" element={<DeckBuilderEditorPage />} />
            <Route path="/deck-builder/viewer" element={<DeckViewerPage />} />
            <Route path="/deck-builder/local-json-editor" element={<LocalJsonEditorPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default App;

