import type { UserDeck } from '../../hooks/useUserDecks';
import { getCoverImageStyle } from '../deck-editor/deckEditorUtils';
import { getDeckDateLines } from './deckHomeUtils';
import styles from '../DeckBuilderHomePage.module.css';

/** Cover image of a deck card, if the deck has one. */
export function DeckCover({ deck }: { deck: UserDeck }) {
  if (!deck.headerImageUrl) return null;
  return (
    <div className={styles.deckCardCover}>
      <div
        className={styles.deckCardCoverImg}
        style={{
          backgroundImage: `url(${deck.headerImageUrl})`,
          ...getCoverImageStyle(deck.headerZoom, deck.headerPosX, deck.headerPosY),
        }}
        aria-label="portada"
      />
    </div>
  );
}

export function DeckDates({ deck }: { deck: UserDeck }) {
  return (
    <div className={styles.deckDateBlock}>
      {getDeckDateLines(deck.created_at, deck.updated_at).map((line) => (
        <span key={line} className={styles.deckDateLabel}>{line}</span>
      ))}
    </div>
  );
}
