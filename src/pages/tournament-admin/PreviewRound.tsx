import { standingPoints, type SwissHistoryMatch } from '../../utils/swissPairing';
import type { RoundRobinRound } from '../../utils/roundRobin';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

interface PreviewRoundProps {
  admin: TournamentAdminState;
  round: RoundRobinRound;
  swissHistory: SwissHistoryMatch[];
}

/** One previewed round: its subformat, and either its pairings or the manual final pairs. */
export default function PreviewRound({ admin, round, swissHistory }: PreviewRoundProps) {
  const { savedForm, subformats, pairingMode, setPreview, extraPairs, setExtraPairs, playerName } = admin;
  if (!savedForm) return null;
  const { format, subformat1Id, subformat2Id, playerIds } = savedForm;
  const subformatName = subformats.find((item) => item.subformat_id === round.subformat_id)?.subformat_name;
  const extraChoices = [
    { id: subformat1Id, side: format === 'FX' ? 'FX' as const : 'PB' as const },
    { id: subformat2Id, side: format === 'PB' ? 'PB' as const : 'FX' as const },
  ].filter((choice, index, list) => choice.id && list.findIndex((item) => item.id === choice.id) === index);
  const canPickSubformat = round.is_extra_round || pairingMode === 'progressive';

  const setExtraPlayer = (index: number, slot: 0 | 1, value: number) => {
    const next = [...extraPairs] as Array<[number, number]>;
    const current = next[index] ?? [0, 0];
    next[index] = slot === 0 ? [value, current[1]] : [current[0], value];
    setExtraPairs(next);
  };

  const label = (playerId: number) => (
    pairingMode === 'progressive' ? `${playerName(playerId)} · ${standingPoints(playerId, swissHistory)} pts` : playerName(playerId)
  );

  return (
    <article className={styles.card}>
      <div className={styles.roundHead}>
        <strong>{round.is_extra_round ? 'Final' : `Ronda ${round.round_number}`}</strong>
        <span className={round.format === 'FX' ? styles.chipFx : styles.chipPb}>{round.format}</span>
        {!canPickSubformat && subformatName && <span className={styles.muted}>{subformatName}</span>}
      </div>
      {canPickSubformat && (
        <label className={styles.inlineField}>
          <span>Subformato</span>
          <select
            value={round.subformat_id ?? ''}
            onChange={(event) => {
              const nextId = Number(event.target.value);
              const chosen = extraChoices.find((choice) => choice.id === nextId);
              setPreview((current) => current.map((item) => (
                item.round_number === round.round_number
                  ? { ...item, subformat_id: nextId, format: chosen?.side ?? item.format }
                  : item
              )));
            }}
          >
            {extraChoices.map((choice) => {
              const name = subformats.find((item) => item.subformat_id === choice.id)?.subformat_name ?? 'Subformato';
              return <option key={choice.id} value={choice.id}>{format === 'PBFX' ? `${choice.side} · ${name}` : name}</option>;
            })}
          </select>
        </label>
      )}
      {round.is_extra_round ? (
        <div className={styles.pairList}>
          {[0, 1].map((index) => (
            <div key={index} className={styles.extraPair}>
              <span className={styles.tableNo}>{index + 1}</span>
              <select value={extraPairs[index]?.[0] ?? ''} onChange={(event) => setExtraPlayer(index, 0, Number(event.target.value))} aria-label={`Cruce ${index + 1}, jugador 1`}>
                <option value="">Jugador</option>
                {playerIds.map((id) => <option key={id} value={id}>{playerName(id)}</option>)}
              </select>
              <span className={styles.vs}>vs</span>
              <select value={extraPairs[index]?.[1] ?? ''} onChange={(event) => setExtraPlayer(index, 1, Number(event.target.value))} aria-label={`Cruce ${index + 1}, jugador 2`}>
                <option value="">Jugador</option>
                {playerIds.map((id) => <option key={id} value={id}>{playerName(id)}</option>)}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <ol className={styles.pairList}>
          {round.matches.map((match, index) => (
            <li key={`${round.round_number}-${index}`} className={styles.pair}>
              <span className={styles.tableNo}>{index + 1}</span>
              {match.player2_id === null ? (
                <span>{label(match.player1_id)} <em className={styles.muted}>descansa (BYE)</em></span>
              ) : (
                <span>{label(match.player1_id)} <span className={styles.vs}>vs</span> {label(match.player2_id)}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
