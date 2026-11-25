import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FaHammer } from 'react-icons/fa';
import type { CollectionCard } from '../types/collection';
import CardDetailModal from '../components/CardDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from './profile/useProfileData';
import { useProfileCards } from './profile/useProfileCards';
import ProfileDeckItem from './profile/ProfileDeckItem';
import ProfileHeader from './profile/ProfileHeader';
import ProfileCardsSection from './profile/ProfileCardsSection';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { username: usernameParam } = useParams<{ username?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const {
    profile, setProfile, profileLoading, profileError, decks, premierPlayerName, isOwner,
  } = useProfileData(usernameParam, user, authLoading);
  const cards = useProfileCards(profile?.id ?? null, searchParams, setSearchParams);
  const [decksExpanded, setDecksExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);

  const handleViewCard = (cardId: number) => {
    const card = cards.findCard(cardId);
    if (card) setSelectedCard(card);
  };

  if (authLoading || profileLoading) {
    return <div className={styles.loading}>Cargando perfil...</div>;
  }

  if (!usernameParam && !user) {
    return (
      <div className={styles.emptyState}>
        <h2>Perfil</h2>
        <p>Inicia sesión para ver y editar tu perfil.</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return <div className={styles.errorState}>{profileError ?? 'Perfil no disponible.'}</div>;
  }

  const emptyDecksText = isOwner ? 'Aún no tienes mazos guardados.' : 'No hay mazos públicos.';
  const deckItems = decks.map((deck) => (
    <ProfileDeckItem key={deck.id} deck={deck} onOpen={() => setDecksExpanded(false)} />
  ));

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <h2 className={styles.sidebarTitle}>
            <FaHammer style={{ color: 'var(--sage-green)' }} />
            Mazos
          </h2>
          {decks.length === 0 ? (
            <p className={styles.emptyState} style={{ padding: '1rem 0' }}>
              {emptyDecksText}
            </p>
          ) : (
            <ul className={styles.deckList}>
              {deckItems}
            </ul>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <ProfileHeader
          profile={profile}
          setProfile={setProfile}
          isOwner={isOwner}
          premierPlayerName={premierPlayerName}
        />

        <div className={styles.mobileDecksPanel}>
          <button
            type="button"
            className={styles.mobileDecksToggle}
            onClick={() => setDecksExpanded((open) => !open)}
            aria-expanded={decksExpanded}
          >
            <FaHammer style={{ color: 'var(--sage-green)' }} />
            Mazos ({decks.length})
            <span className={styles.mobileDecksChevron} aria-hidden>
              {decksExpanded ? '▲' : '▼'}
            </span>
          </button>
          {decksExpanded && (
            <div className={styles.mobileDecksContent}>
              {decks.length === 0 ? (
                <p className={styles.mobileDecksEmpty}>
                  {emptyDecksText}
                </p>
              ) : (
                <ul className={`${styles.deckList} ${styles.deckListHorizontal}`}>
                  {deckItems}
                </ul>
              )}
            </div>
          )}
        </div>

        <ProfileCardsSection
          cards={cards}
          searchParams={searchParams}
          isOwner={isOwner}
          onViewCard={handleViewCard}
        />
      </main>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
};

export default ProfilePage;
