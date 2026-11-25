import { Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import type { UserDeck } from '../../hooks/useUserDecks';
import { getSubformatLabel } from './profileUtils';
import styles from '../ProfilePage.module.css';

interface ProfileDeckItemProps {
  deck: UserDeck;
  onOpen: () => void;
}

/** A deck in the profile's deck list: a link to the viewer, or a locked row if private. */
export default function ProfileDeckItem({ deck, onOpen }: ProfileDeckItemProps) {
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
      <li className={styles.deckItem}>
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
    <li className={styles.deckItem}>
      <Link
        to={`/deck-builder/viewer?deckId=${deck.id}`}
        className={`${styles.deckLink} ${formatClass}`}
        onClick={onOpen}
      >
        <div className={styles.deckNameRow}>
          <span className={styles.deckName}>{deck.name}</span>
        </div>
        {meta}
      </Link>
    </li>
  );
}
