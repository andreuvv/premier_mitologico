import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Tournament } from '../../services/tournamentAPI';
import { usesRagnarokSubformat } from '../../utils/bfSubformatLabel';
import styles from '../TournamentHistoryPage.module.css';

/** Links to the rules of the formats played in the tournament. */
export default function FormatDescription({ tournament }: { tournament: Tournament | null }) {
  const format = tournament?.format;
  const sub = (tournament?.subformat || '').toLowerCase();

  // Determine which subformats to show
  const isLibre = ['libre', 'pbrl', 'bfrl'].some(v => sub === v) || sub.includes('libre');
  const isEdicion = ['pbre', 'bfvcr', 'vcr', 'edición', 'edicion', 'ragnarok'].some(v => sub === v)
                 || sub.includes('vcr') || sub.includes('edici') || sub.includes('ragnarok');
  const isBoth = !sub || sub === 'both' || (isLibre && isEdicion);
  const showLibre = isBoth || isLibre;
  const showEdicion = isBoth || isEdicion;

  const pbLinks = [];
  if (showLibre) pbLinks.push(<Link key="pbl" to="/game-formats/primerBloque/primerBloqueRacialLibre" className={styles.formatLink}>Primer Bloque Racial Libre</Link>);
  if (showEdicion) pbLinks.push(<Link key="pbe" to="/game-formats/primerBloque/primerBloqueRacialEdicion" className={styles.formatLink}>Primer Bloque Racial Edición</Link>);

  const bfLinks = [];
  if (showLibre) bfLinks.push(<Link key="bfl" to="/game-formats/bloqueFuria/bloqueFuriaRacialLibre" className={styles.formatLink}>Furia Extendido Racial Libre</Link>);
  if (showEdicion) {
    if (usesRagnarokSubformat(tournament)) {
      bfLinks.push(<Link key="bfv" to="/game-formats/formatosEspeciales/ragnarok" className={styles.formatLink}>Furia Extendido Racial Ragnarok</Link>);
    } else {
      bfLinks.push(<Link key="bfv" to="/game-formats/formatosEspeciales/vcr" className={styles.formatLink}>Furia Extendido Racial VCR</Link>);
    }
  }

  let links: ReactNode[] = [];
  if (!format) {
    links = [...pbLinks, ...bfLinks];
  } else if (format === 'PB') {
    links = pbLinks;
  } else if (format === 'BF' || format === 'FX') {
    links = bfLinks;
  }

  if (links.length === 0) return null;

  return (
    <p className={styles.formatSubtitle}>
      {links.map((link, i) => (
        <span key={i}>
          {i > 0 && ' • '}
          {link}
        </span>
      ))}
    </p>
  );
}
