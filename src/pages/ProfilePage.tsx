import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FaHammer, FaChartPie, FaEdit, FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import { CollectionCatalog, CollectionCard, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import CardGrid, { type SimpleCard } from '../components/CardGrid';
import CollectionFilters, { type FilterParams } from '../components/CollectionFilters';
import CardDetailModal from '../components/CardDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import { useUserCardList } from '../hooks/useUserCardList';
import { useUserDecks, type UserDeck } from '../hooks/useUserDecks';
import {
  loadProfileById,
  loadProfileByUsername,
  useUserProfile,
  type UserProfile,
} from '../hooks/useUserProfile';
import {
  FAVORITE_FORMATS,
  racesForFormat,
  getFavoriteFormatLabel,
  isPbFavoriteFormat,
  type FavoriteFormatId,
  type FavoriteRacesMap,
} from '../config/profileOptions';
import { fixtureAPI } from '../services/fixtureAPI';
import styles from './ProfilePage.module.css';

type CardSection = 'collection' | 'favorites' | 'wishlist';

const toSimpleCards = (cards: CollectionCard[]): SimpleCard[] =>
  cards.map((card) => ({
    id: card.id,
    slug: card.slug,
    name: card.name,
    imageUrl: card.imageUrl,
    collectorCode: card.collectorCode,
    type: card.type,
    cost: card.cost,
    attack: card.attack,
    effect: card.effect,
    flavor: card.flavor,
    artist: card.artist,
    productName: card.product?.productName ?? card.edition?.name,
  }));

function getSubformatLabel(subformat: string): string {
  if (subformat === 'pb-edicion') return 'Racial Edición';
  if (subformat === 'pb-libre') return 'Racial Libre';
  if (subformat === 'fx-vcr') return 'VCR';
  if (subformat === 'fx-ragnarok') return 'Racial Ragnarok';
  return 'Racial Libre';
}

const ProfilePage = () => {
  const { username: usernameParam } = useParams<{ username?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { updateProfile, uploadAvatar, loading: saving } = useUserProfile();
  const { loadDecks } = useUserDecks();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [premierPlayerName, setPremierPlayerName] = useState<string | null>(null);
  const [deckSidebarOpen, setDeckSidebarOpen] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState<CollectionFormat>(
    searchParams.get('format') === CollectionFormat.FURIA_EXTENDIDO
      ? CollectionFormat.FURIA_EXTENDIDO
      : CollectionFormat.PRIMER_BLOQUE,
  );
  const [cardSection, setCardSection] = useState<CardSection>(
    (searchParams.get('section') as CardSection) || 'collection',
  );
  const [allCards, setAllCards] = useState<CollectionCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<SimpleCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsReady, setCardsReady] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const isInitialFilterApplyRef = useRef(true);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwner = Boolean(user && profile && user.id === profile.id);
  const targetUserId = profile?.id ?? null;

  const collection = useUserCollection(selectedFormat, targetUserId);
  const favorites = useUserCardList('user_favorites_v2', selectedFormat, targetUserId);
  const wishlist = useUserCardList('user_wishlist_v2', selectedFormat, targetUserId);

  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const handlePageChange = (page: number) => {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (page <= 1) next.delete('page');
      else next.set('page', page.toString());
      return next;
    }, { replace: true });
  };

  const loadProfileData = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);

    if (!usernameParam) {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      const own = await loadProfileById(user.id);
      setProfile(own);
      if (!own) setProfileError('No se encontró tu perfil.');
      setProfileLoading(false);
      return;
    }

    const loaded = await loadProfileByUsername(usernameParam);
    if (!loaded) {
      setProfileError('Perfil no encontrado.');
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (!loaded.is_public && loaded.id !== user?.id) {
      setProfileError('Este perfil es privado.');
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfile(loaded);
    setProfileLoading(false);
  }, [usernameParam, user]);

  useEffect(() => {
    if (authLoading) return;
    loadProfileData();
  }, [authLoading, loadProfileData]);

  useEffect(() => {
    if (!profile) {
      setDecks([]);
      setPremierPlayerName(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const allDecks = await loadDecks(profile.id);
      const visible = isOwner
        ? allDecks.filter((d) => !d.is_draft)
        : allDecks.filter((d) => d.is_public && !d.is_draft);
      if (!cancelled) setDecks(visible);

      if (profile.premier_player_id) {
        try {
          const players = await fixtureAPI.getPremierPlayers();
          const player = players.find((p) => p.id === profile.premier_player_id);
          if (!cancelled) setPremierPlayerName(player?.name ?? null);
        } catch {
          if (!cancelled) setPremierPlayerName(null);
        }
      } else if (!cancelled) {
        setPremierPlayerName(null);
      }
    })();

    return () => { cancelled = true; };
  }, [profile, isOwner, loadDecks]);

  useEffect(() => {
    setCardsLoading(true);
    setCardsReady(false);
    setFilteredCards([]);
    isInitialFilterApplyRef.current = true;
    loadCollectionCards(selectedFormat)
      .then((data: CollectionCatalog) => {
        setAllCards(data.data.CardCatalog.cards);
        setFilteredCards(toSimpleCards(data.data.CardCatalog.cards));
        setCardsLoading(false);
      })
      .catch(() => setCardsLoading(false));
  }, [selectedFormat]);

  useEffect(() => {
    if (targetUserId && collection.loadedFormat !== selectedFormat) {
      collection.loadCollection();
    }
  }, [targetUserId, selectedFormat, collection.loadedFormat, collection.loadCollection]);

  useEffect(() => {
    if (targetUserId && favorites.loadedFormat !== selectedFormat) {
      favorites.loadList();
    }
  }, [targetUserId, selectedFormat, favorites.loadedFormat, favorites.loadList]);

  useEffect(() => {
    if (targetUserId && wishlist.loadedFormat !== selectedFormat) {
      wishlist.loadList();
    }
  }, [targetUserId, selectedFormat, wishlist.loadedFormat, wishlist.loadList]);

  const handleFilterChange = (cards: CollectionCard[], params: FilterParams) => {
    setCardsReady(true);
    setFilteredCards(toSimpleCards(cards));
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.set('format', selectedFormat);
      next.set('section', cardSection);
      if (params.edition) next.set('edition', params.edition); else next.delete('edition');
      if (params.product) next.set('product', params.product); else next.delete('product');
      if (params.q) next.set('q', params.q); else next.delete('q');
      if (params.type) next.set('type', params.type); else next.delete('type');
      if (params.race) next.set('race', params.race); else next.delete('race');
      if (params.freq) next.set('freq', params.freq); else next.delete('freq');
      if (!isInitialFilterApplyRef.current) next.delete('page');
      return next;
    }, { replace: true });
    isInitialFilterApplyRef.current = false;
  };

  const visibleCards = useMemo(() => {
    if (cardSection === 'collection') {
      return filteredCards.filter((card) => collection.ownedCardIds.has(card.id));
    }
    if (cardSection === 'favorites') {
      return filteredCards.filter((card) => favorites.cardIds.has(card.id));
    }
    return filteredCards.filter((card) => wishlist.cardIds.has(card.id));
  }, [filteredCards, cardSection, collection.ownedCardIds, favorites.cardIds, wishlist.cardIds]);

  const modalCards = useMemo(() => {
    const cardsById = new Map(allCards.map((card) => [card.id, card]));
    return visibleCards
      .map((card) => cardsById.get(card.id))
      .filter((card): card is CollectionCard => Boolean(card));
  }, [allCards, visibleCards]);

  const handleViewCard = (cardId: number) => {
    const card = modalCards.find((item) => item.id === cardId) ?? allCards.find((item) => item.id === cardId);
    if (card) setSelectedCard(card);
  };

  const handleSaveUsername = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === profile?.username) {
      setEditingName(false);
      return;
    }
    const { error } = await updateProfile({ username: trimmed });
    if (error) {
      setSaveMessage(error);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, username: trimmed } : prev));
    setEditingName(false);
    setSaveMessage('Nombre actualizado');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { url, error } = await uploadAvatar(file);
    setAvatarUploading(false);
    if (error) {
      setSaveMessage(error);
      return;
    }
    if (url) setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev));
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleFavoriteFormatChange = async (formatId: FavoriteFormatId | '') => {
    if (!isOwner) return;
    const value = formatId || null;
    const { error } = await updateProfile({ favorite_format: value });
    if (error) {
      setSaveMessage(error);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, favorite_format: value } : prev));
  };

  const handleFavoriteRaceChange = async (formatId: FavoriteFormatId, race: string) => {
    if (!isOwner || !profile) return;
    const nextRaces: FavoriteRacesMap = { ...profile.favorite_races };
    if (race) nextRaces[formatId] = race;
    else delete nextRaces[formatId];
    const { error } = await updateProfile({ favorite_races: nextRaces });
    if (error) {
      setSaveMessage(error);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, favorite_races: nextRaces } : prev));
  };

  const getFormatLabel = (format: CollectionFormat) =>
    format === CollectionFormat.PRIMER_BLOQUE ? 'Primer Bloque' : 'Furia Extendido';

  const getSectionLabel = (section: CardSection) => {
    if (section === 'collection') return 'Colección';
    if (section === 'favorites') return 'Favoritos';
    return 'Lista de Deseados';
  };

  const isPbFormat = selectedFormat === CollectionFormat.PRIMER_BLOQUE;
  const avatarAccentClass = profile?.favorite_format
    ? (isPbFavoriteFormat(profile.favorite_format) ? styles.avatarWrapperPb : styles.avatarWrapperFx)
    : '';

  const renderDeckItem = (deck: UserDeck) => {
    const isPb = deck.format === 'pb';
    const formatClass = isPb ? styles.deckLinkPb : styles.deckLinkFx;
    const privateClass = isPb ? styles.deckPrivatePb : styles.deckPrivateFx;
    const formatTagClass = isPb ? styles.deckFormatTagPb : styles.deckFormatTagFx;
    const formatLabel = isPb ? 'Primer Bloque' : 'Furia Extendido';

    const meta = (
      <>
        <div className={styles.deckMeta}>
          {getSubformatLabel(deck.subformat)}
          {deck.race ? ` · ${deck.race}` : ''}
        </div>
        <span className={`${styles.deckFormatTag} ${formatTagClass}`}>{formatLabel}</span>
      </>
    );

    if (!deck.is_public) {
      return (
        <li key={deck.id} className={styles.deckItem}>
          <div className={`${styles.deckPrivate} ${privateClass}`} title="Mazo privado">
            <div className={styles.deckNameRow}>
              <span className={styles.deckName}>{deck.name}</span>
              <span className={styles.privateBadge}>
                <FaLock aria-hidden />
                Privado
              </span>
            </div>
            {meta}
          </div>
        </li>
      );
    }

    return (
      <li key={deck.id} className={styles.deckItem}>
        <Link
          to={`/deck-builder/viewer?id=${deck.id}`}
          className={`${styles.deckLink} ${formatClass}`}
          onClick={() => setDeckSidebarOpen(false)}
        >
          <div className={styles.deckNameRow}>
            <span className={styles.deckName}>{deck.name}</span>
          </div>
          {meta}
        </Link>
      </li>
    );
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

  const urlFormat = searchParams.get('format') ?? CollectionFormat.PRIMER_BLOQUE;
  const matchesFormat = urlFormat === selectedFormat;

  return (
    <div className={styles.container}>
      {deckSidebarOpen && (
        <div className={styles.overlay} onClick={() => setDeckSidebarOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${deckSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarContent}>
          <h2 className={styles.sidebarTitle}>
            <FaHammer style={{ color: 'var(--sage-green)' }} />
            Mazos
          </h2>
          {decks.length === 0 ? (
            <p className={styles.emptyState} style={{ padding: '1rem 0' }}>
              {isOwner ? 'Aún no tienes mazos guardados.' : 'No hay mazos públicos.'}
            </p>
          ) : (
            <ul className={styles.deckList}>
              {decks.map(renderDeckItem)}
            </ul>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <button
          type="button"
          className={styles.mobileDeckToggle}
          onClick={() => setDeckSidebarOpen(true)}
        >
          Ver mazos ({decks.length})
        </button>

        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div className={`${styles.avatarWrapper} ${avatarAccentClass}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isOwner && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.avatarInput}
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  className={styles.avatarUploadBtn}
                  disabled={avatarUploading || saving}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarUploading ? 'Subiendo...' : 'Cambiar foto'}
                </button>
              </>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.usernameRow}>
              {editingName && isOwner ? (
                <>
                  <input
                    className={styles.usernameInput}
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    maxLength={50}
                  />
                  <button type="button" className={styles.saveBtn} onClick={handleSaveUsername}>
                    <FaCheck /> Guardar
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setEditingName(false)}
                  >
                    <FaTimes />
                  </button>
                </>
              ) : (
                <>
                  <h1 className={styles.username}>{profile.username}</h1>
                  {isOwner && (
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => {
                        setNameDraft(profile.username);
                        setEditingName(true);
                      }}
                    >
                      <FaEdit /> Editar
                    </button>
                  )}
                </>
              )}
            </div>

            {saveMessage && <p className={styles.saveMessage}>{saveMessage}</p>}

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Formato favorito</span>
              {isOwner ? (
                <select
                  id="favorite-format"
                  className={styles.fieldSelect}
                  value={profile.favorite_format ?? ''}
                  disabled={saving}
                  onChange={(e) => handleFavoriteFormatChange(e.target.value as FavoriteFormatId | '')}
                >
                  <option value="">Sin preferencia</option>
                  {FAVORITE_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              ) : profile.favorite_format ? (
                <span
                  className={`${styles.favoriteFormatBadge} ${
                    isPbFavoriteFormat(profile.favorite_format)
                      ? styles.favoriteFormatBadgePb
                      : styles.favoriteFormatBadgeFx
                  }`}
                >
                  {getFavoriteFormatLabel(profile.favorite_format)}
                </span>
              ) : (
                <span className={styles.readOnlyEmpty}>Sin preferencia</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Raza favorita por formato</span>
              <div className={styles.raceGrid}>
                {FAVORITE_FORMATS.map((formatOpt) => {
                  const isPbFmt = isPbFavoriteFormat(formatOpt.id);
                  const raceValue = profile.favorite_races[formatOpt.id];

                  if (isOwner) {
                    return (
                      <div
                        key={formatOpt.id}
                        className={`${styles.raceCard} ${isPbFmt ? styles.raceCardPb : styles.raceCardFx}`}
                      >
                        <label className={styles.raceCardLabel} htmlFor={`race-${formatOpt.id}`}>
                          {formatOpt.label}
                        </label>
                        <select
                          id={`race-${formatOpt.id}`}
                          className={styles.fieldSelect}
                          value={raceValue ?? ''}
                          disabled={saving}
                          onChange={(e) => handleFavoriteRaceChange(formatOpt.id, e.target.value)}
                        >
                          <option value="">Sin preferencia</option>
                          {racesForFormat(formatOpt.id).map((race) => (
                            <option key={race} value={race}>{race}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={formatOpt.id}
                      className={`${styles.raceCard} ${isPbFmt ? styles.raceCardPb : styles.raceCardFx}`}
                    >
                      <div className={styles.raceCardLabel}>{formatOpt.label}</div>
                      {raceValue ? (
                        <div className={`${styles.raceCardValue} ${isPbFmt ? styles.raceCardValuePb : styles.raceCardValueFx}`}>
                          {raceValue}
                        </div>
                      ) : (
                        <span className={styles.readOnlyEmpty}>Sin preferencia</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {premierPlayerName && (
              <Link
                to={`/players/${encodeURIComponent(premierPlayerName)}`}
                className={styles.playerLinkBtn}
              >
                <FaChartPie />
                Ver página de jugador
              </Link>
            )}
          </div>
        </div>

        <div className={styles.sectionTabs}>
          {(['collection', 'favorites', 'wishlist'] as CardSection[]).map((section) => (
            <button
              key={section}
              type="button"
              className={`${styles.sectionTab} ${cardSection === section ? styles.sectionTabActive : ''}`}
              onClick={() => {
                setCardSection(section);
                setSearchParams((p) => {
                  const next = new URLSearchParams(p);
                  next.set('section', section);
                  next.delete('page');
                  return next;
                }, { replace: true });
              }}
            >
              {getSectionLabel(section)}
            </button>
          ))}
        </div>

        <div className={styles.formatTabs}>
          {Object.values(CollectionFormat).map((format) => {
            const isPb = format === CollectionFormat.PRIMER_BLOQUE;
            const isActive = selectedFormat === format;
            return (
              <button
                key={format}
                type="button"
                className={`${styles.formatTab} ${
                  isActive
                    ? (isPb ? styles.formatTabPbActive : styles.formatTabFxActive)
                    : ''
                }`}
                onClick={() => {
                  setSelectedFormat(format);
                  setSearchParams((p) => {
                    const next = new URLSearchParams(p);
                    next.set('format', format);
                    next.delete('page');
                    return next;
                  }, { replace: true });
                }}
              >
                {getFormatLabel(format)}
              </button>
            );
          })}
        </div>

        <div className={`${styles.cardsArea} ${isPbFormat ? styles.cardsAreaPb : styles.cardsAreaFx}`}>
          {cardsLoading ? (
            <div className={styles.loading}>Cargando cartas...</div>
          ) : (
            <div className={styles.content}>
              <CollectionFilters
                key={`profile-${selectedFormat}-${cardSection}`}
                allCards={allCards}
                format={selectedFormat}
                isOpen={false}
                onClose={() => {}}
                onFilterChange={handleFilterChange}
                initialEdition={matchesFormat ? searchParams.get('edition') : null}
                initialProduct={matchesFormat ? searchParams.get('product') : null}
                initialSearch={matchesFormat ? searchParams.get('q') : null}
                initialType={matchesFormat ? searchParams.get('type') : null}
                initialRace={matchesFormat ? searchParams.get('race') : null}
                initialFreq={matchesFormat ? searchParams.get('freq') : null}
              />
              <div className={styles.gridArea}>
                {!cardsReady ? null : visibleCards.length === 0 ? (
                  <div className={styles.stats}>
                    No hay cartas en {getSectionLabel(cardSection).toLowerCase()} para {getFormatLabel(selectedFormat)}.
                  </div>
                ) : (
                  <CardGrid
                    cards={visibleCards}
                    format={selectedFormat}
                    ownedCardIds={collection.ownedCardIds}
                    cardCopies={collection.cardCopies}
                    favoriteCardIds={favorites.cardIds}
                    wishlistCardIds={wishlist.cardIds}
                    onViewCard={handleViewCard}
                    onAddCopy={isOwner ? collection.addCopy : undefined}
                    onRemoveCopy={isOwner ? collection.removeCopy : undefined}
                    onSetCopies={isOwner ? collection.setCopies : undefined}
                    onToggleFavorite={isOwner ? favorites.toggle : undefined}
                    onToggleWishlist={isOwner ? wishlist.toggle : undefined}
                    showUnownedMuted={cardSection === 'collection'}
                    showCopyCount={isOwner && cardSection === 'collection'}
                    currentPage={pageFromUrl}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </div>
          )}
          <div className={styles.stats}>
            Mostrando {visibleCards.length} cartas en {getSectionLabel(cardSection)} ({getFormatLabel(selectedFormat)})
          </div>
        </div>
      </main>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
};

export default ProfilePage;
