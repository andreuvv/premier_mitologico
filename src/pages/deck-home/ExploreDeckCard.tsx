import type { PublicDeck } from '../../hooks/useUserDecks';
import { getSubformatLabel } from '../../utils/deckSubformatLabel';
import { editionLabelForDeck, formatLabelFor } from './deckHomeUtils';
import { DeckCover, DeckDates } from './DeckCardParts';
import styles from '../DeckBuilderHomePage.module.css';

/** A deck in "Explorar": author, tags and a link to the viewer when public. */
export default function ExploreDeckCard({ deck, onView }: { deck: PublicDeck; onView: () => void }) {
  const formatTagClass = deck.format === 'fx' ? styles.deckCardTagFormatFx : styles.deckCardTagFormatPb;
  const editionLabel = editionLabelForDeck(deck);
  return (
    <div className={styles.deckCard}>
      <DeckCover deck={deck} />
      <div className={styles.deckCardHeader}>
        <h3 className={styles.deckCardName}>{deck.name}</h3>
        <span className={styles.exploreAuthor}>@{deck.authorName}</span>
      </div>
      <div className={styles.deckCardMeta}>
        <span className={`${styles.deckCardTag} ${formatTagClass}`}>{formatLabelFor(deck)}</span>
        <span className={`${styles.deckCardTag} ${formatTagClass}`}>{getSubformatLabel(deck.subformat)}</span>
        {deck.is_draft && (
          <span className={`${styles.deckCardTag} ${styles.deckCardTagDraft}`}>
            Borrador
          </span>
        )}
        {deck.race && <span className={`${styles.deckCardTag} ${styles.deckCardTagRace}`}>{deck.race}</span>}
        {editionLabel && (
          <span className={`${styles.deckCardTag} ${styles.deckCardTagEdition}`}>
            {editionLabel}
          </span>
        )}
      </div>
      <div className={styles.deckCardActions}>
        {deck.is_public ? (
          <button className={styles.deckViewBtn} onClick={onView}>
            👁 Ver Mazo
          </button>
        ) : (
          <span className={styles.privateDeckLabel}>Mazo Privado</span>
        )}
      </div>
      <DeckDates deck={deck} />
    </div>
  );
}
