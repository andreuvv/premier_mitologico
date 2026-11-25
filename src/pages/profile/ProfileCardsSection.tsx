import { CollectionFormat } from '../../types/collection';
import CardGrid from '../../components/CardGrid';
import CollectionFilters from '../../components/CollectionFilters';
import { CARD_SECTIONS, getFormatLabel, getSectionLabel } from './profileUtils';
import type { ProfileCards } from './useProfileCards';
import styles from '../ProfilePage.module.css';

interface ProfileCardsSectionProps {
  cards: ProfileCards;
  searchParams: URLSearchParams;
  isOwner: boolean;
  onViewCard: (cardId: number) => void;
}

/** Collection / favorites / wishlist tabs, format tabs, filters and the card grid. */
export default function ProfileCardsSection({ cards, searchParams, isOwner, onViewCard }: ProfileCardsSectionProps) {
  const {
    selectedFormat, selectFormat, cardSection, selectSection,
    allCards, cardsLoading, cardsReady, visibleCards, handleFilterChange,
    collection, favorites, wishlist, pageFromUrl, handlePageChange,
  } = cards;
  const isPbFormat = selectedFormat === CollectionFormat.PRIMER_BLOQUE;
  const urlFormat = searchParams.get('format') ?? CollectionFormat.PRIMER_BLOQUE;
  const matchesFormat = urlFormat === selectedFormat;

  return (
    <>
      <div className={styles.sectionTabs}>
        {CARD_SECTIONS.map((section) => (
          <button
            key={section}
            type="button"
            className={`${styles.sectionTab} ${cardSection === section ? styles.sectionTabActive : ''}`}
            onClick={() => selectSection(section)}
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
              onClick={() => selectFormat(format)}
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
              defaultCollapsed
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
                  onViewCard={onViewCard}
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
    </>
  );
}
