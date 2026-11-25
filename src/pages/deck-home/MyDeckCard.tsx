import type { UserDeck } from '../../hooks/useUserDecks';
import { getSubformatLabel } from '../../utils/deckSubformatLabel';
import { formatLabelFor } from './deckHomeUtils';
import { DeckCover, DeckDates } from './DeckCardParts';
import styles from '../DeckBuilderHomePage.module.css';

interface MyDeckCardProps {
  deck: UserDeck;
  deleting: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A deck of the signed-in user: opens the viewer; edit and delete buttons. */
export default function MyDeckCard({ deck, deleting, onView, onEdit, onDelete }: MyDeckCardProps) {
  const cardCount = Object.values(deck.cards).reduce((a, b) => a + b, 0);
  const formatTagClass = deck.format === 'fx' ? styles.deckCardTagFormatFx : styles.deckCardTagFormatPb;
  return (
    <div className={styles.deckCard} onClick={onView} style={{ cursor: 'pointer' }}>
      <DeckCover deck={deck} />
      <div className={styles.deckCardHeader}>
        <h3 className={styles.deckCardName}>{deck.name}</h3>
        <span className={`${styles.deckCardCount} ${cardCount === 50 ? styles.deckCardCountFull : ''}`}>
          {cardCount}/50
        </span>
      </div>
      <div className={styles.deckCardMeta}>
        <span
          className={`${styles.deckCardTag} ${deck.is_public ? styles.deckCardTagPublic : styles.deckCardTagPrivate}`}
        >
          {deck.is_public ? 'Público' : 'Privado'}
        </span>
        {deck.is_draft && (
          <span className={`${styles.deckCardTag} ${styles.deckCardTagDraft}`}>
            Borrador
          </span>
        )}
        <span className={`${styles.deckCardTag} ${formatTagClass}`}>{formatLabelFor(deck)}</span>
        <span className={`${styles.deckCardTag} ${formatTagClass}`}>{getSubformatLabel(deck.subformat)}</span>
        {deck.race && <span className={`${styles.deckCardTag} ${styles.deckCardTagRace}`}>{deck.race}</span>}
      </div>
      <div className={styles.deckCardActions}>
        <button
          className={styles.deckEditBtn}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          ✏️ Editar
        </button>
        <button
          className={styles.deckDeleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={deleting}
        >
          {deleting ? '...' : '🗑'}
        </button>
      </div>
      <DeckDates deck={deck} />
    </div>
  );
}
