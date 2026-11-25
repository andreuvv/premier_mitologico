import { useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { tournamentAdminAPI } from '../../services/tournamentAdminService';
import { fullCycleLength, generateRoundRobin } from '../../utils/roundRobin';
import { finalsPairs, generateSwissRound, previousRoundsReady, type SwissHistoryMatch } from '../../utils/swissPairing';
import PreviewRound from './PreviewRound';
import type { PairingMode, StepId } from './adminUtils';
import { ConfirmDialog, InfoTip, Progress, Segmented } from './ui';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

interface FixtureTabProps {
  admin: TournamentAdminState;
  onGo: (step: StepId) => void;
}

type Pending = 'mode' | 'replace' | 'clearAll' | { deleteRound: number } | null;

/** "Rondas": pairing mode, number of rounds, preview and saving rounds. */
export default function FixtureTab({ admin, onGo }: FixtureTabProps) {
  const {
    savedForm, roundCount, setRoundCount, pairingMode, setPairingMode, includeExtra, setIncludeExtra,
    preview, setPreview, extraPairs, setExtraPairs, fixture, regularRoundsSaved, hasFinalRound,
    busy, run, notify,
  } = admin;
  const [pending, setPending] = useState<Pending>(null);
  const [pendingMode, setPendingMode] = useState<PairingMode>('fixed');
  if (!savedForm) return null;

  const { format, subformat1Id, subformat2Id, playerIds } = savedForm;
  const minimumRounds = fullCycleLength(playerIds.length);
  const swissHistory: SwissHistoryMatch[] = fixture.rounds.flatMap((round) => round.matches.map((match) => ({
    player1_id: match.player1_id,
    player2_id: match.player2_id,
    score1: match.score1,
    score2: match.score2,
    completed: match.completed,
  })));
  const swissReady = previousRoundsReady(swissHistory);
  const canGenerateFinal = pairingMode === 'progressive' && includeExtra && regularRoundsSaved >= roundCount && !hasFinalRound;
  const progressiveFinished = pairingMode === 'progressive' && regularRoundsSaved >= roundCount && (!includeExtra || hasFinalRound);
  const nextRoundNumber = fixture.rounds.length + 1;
  const hasRounds = fixture.rounds.length > 0;
  const scoredMatches = fixture.rounds.flatMap((round) => round.matches).filter((match) => match.completed).length;
  const roundToDelete = pending && typeof pending === 'object'
    ? fixture.rounds.find((round) => round.number === pending.deleteRound)
    : undefined;

  const deleteRound = async (roundNumber: number) => {
    const label = fixture.rounds.find((round) => round.number === roundNumber)?.is_extra_round ? 'Final borrada' : `Ronda ${roundNumber} borrada`;
    const ok = await run(() => tournamentAdminAPI.deleteRound(roundNumber), label);
    setPending(null);
    if (ok) {
      setPreview([]);
      setExtraPairs([]);
    }
  };

  const clearAll = async () => {
    const ok = await run(() => tournamentAdminAPI.clear(false), 'Rondas y marcadores borrados');
    setPending(null);
    if (ok) {
      setPreview([]);
      setExtraPairs([]);
    }
  };

  const applyMode = (mode: PairingMode) => {
    setPairingMode(mode);
    setPreview([]);
    setExtraPairs([]);
    run(
      () => tournamentAdminAPI.setPairingMode(mode),
      mode === 'fixed' ? 'Rondas fijas' : 'Ronda a ronda',
    );
  };

  const chooseMode = (mode: PairingMode) => {
    if (mode === pairingMode) return;
    if (hasRounds) {
      setPendingMode(mode);
      setPending('mode');
      return;
    }
    applyMode(mode);
  };

  const generate = () => {
    if (playerIds.length < 2) {
      notify('error', 'Se necesitan al menos 2 jugadores.');
      return;
    }
    if (pairingMode === 'progressive') {
      if (!swissReady) {
        notify('error', 'Faltan marcadores de la ronda anterior.');
        return;
      }
      const next = generateSwissRound({ playerIds, history: swissHistory, roundNumber: nextRoundNumber, format, subformat1Id, subformat2Id });
      if (canGenerateFinal) {
        setPreview(next ? [{ ...next, is_extra_round: true, matches: [] }] : []);
        setExtraPairs(finalsPairs(playerIds, swissHistory));
        return;
      }
      setPreview(next ? [next] : []);
      setExtraPairs([]);
      return;
    }
    setPreview(generateRoundRobin({ playerIds, roundCount, format, subformat1Id, subformat2Id, includeExtraRound: includeExtra }));
    setExtraPairs([]);
  };

  const roundsToSave = () => preview.map((round) => (
    round.is_extra_round
      ? {
        ...round,
        matches: extraPairs
          .filter(([player1, player2]) => player1 && player2)
          .map(([player1, player2]) => ({ player1_id: player1, player2_id: player2 })),
      }
      : round
  ));

  const save = async () => {
    const rounds = roundsToSave();
    if (pairingMode === 'progressive') {
      const round = rounds[0];
      if (!round) return;
      if (round.is_extra_round) {
        const ids = round.matches.flatMap((match) => (match.player2_id === null ? [match.player1_id] : [match.player1_id, match.player2_id]));
        if (round.matches.length < 1) {
          notify('error', 'Elige los cruces de la final.');
          return;
        }
        if (new Set(ids).size !== ids.length) {
          notify('error', 'Un jugador no puede estar en los dos cruces de la final.');
          return;
        }
      }
      const ok = await run(() => tournamentAdminAPI.appendRound(round), round.is_extra_round ? 'Final guardada' : `Ronda ${round.round_number} guardada`);
      if (ok) setPreview([]);
      return;
    }
    if (hasRounds && pending !== 'replace') {
      setPending('replace');
      return;
    }
    setPending(null);
    const ok = await run(() => tournamentAdminAPI.replaceFixture(rounds), 'Fixture guardado');
    if (ok) setPreview([]);
  };

  const generateLabel = pairingMode === 'fixed'
    ? (preview.length ? 'Volver a sortear' : 'Generar fixture')
    : canGenerateFinal ? 'Proponer final' : preview.length ? 'Volver a sortear' : `Generar ronda ${nextRoundNumber}`;
  const blockedReason = pairingMode === 'progressive' && !progressiveFinished && !swissReady
    ? 'Carga los marcadores de la ronda anterior para generar la siguiente.'
    : null;

  return (
    <section className={styles.stack} aria-labelledby="rondas-title">
      <div className={styles.card}>
        <h2 id="rondas-title" className={styles.cardTitle}>Cómo se arman las rondas</h2>
        <Segmented<PairingMode>
          label="Tipo de rondas"
          value={pairingMode}
          onChange={chooseMode}
          disabled={busy}
          options={[
            { value: 'fixed', label: 'Todas de una vez' },
            { value: 'progressive', label: 'Ronda a ronda' },
          ]}
        />
        <p className={styles.hint}>
          {pairingMode === 'fixed'
            ? 'Se sortea el fixture completo (todos contra todos) y se guarda de una vez.'
            : 'La primera ronda se sortea; cada siguiente junta a jugadores con puntaje parecido.'}
        </p>

        <div className={styles.settingRow}>
          <div>
            <span className={styles.fieldLabel}>Rondas</span>
            <p className={styles.hintTight}>Todos contra todos: {minimumRounds}</p>
          </div>
          <div className={styles.stepper}>
            <button type="button" aria-label="Menos rondas" onClick={() => setRoundCount(Math.max(1, roundCount - 1))} disabled={roundCount <= 1}>−</button>
            <output aria-live="polite">{roundCount}</output>
            <button type="button" aria-label="Más rondas" onClick={() => setRoundCount(roundCount + 1)}>+</button>
          </div>
        </div>

        <label className={styles.switchRow}>
          <span>
            <span className={styles.fieldLabel}>{pairingMode === 'progressive' ? 'Ronda final' : 'Ronda extra'}</span>
            <span className={styles.hintTight}>
              {pairingMode === 'progressive' ? 'Propone 1º vs 4º y 2º vs 3º al terminar.' : 'Queda vacía para armar los cruces a mano.'}
            </span>
          </span>
          <input type="checkbox" className={styles.switch} checked={includeExtra} onChange={(e) => setIncludeExtra(e.target.checked)} />
        </label>
      </div>

      <div className={styles.card}>
        <Progress
          value={regularRoundsSaved + (hasFinalRound ? 1 : 0)}
          total={pairingMode === 'fixed' && hasRounds ? fixture.rounds.length : roundCount + (includeExtra ? 1 : 0)}
          label="Rondas guardadas"
        />
        {progressiveFinished ? (
          <p className={styles.hint}>Todas las rondas están guardadas.</p>
        ) : blockedReason ? (
          <div className={styles.callout}>
            <span>{blockedReason}</span>
            <button type="button" className={styles.secondary} onClick={() => onGo('marcadores')}>Ir a marcadores</button>
          </div>
        ) : null}
        {!progressiveFinished && (
          <div className={styles.actions}>
            <button type="button" className={preview.length ? styles.secondary : styles.primary} onClick={generate} disabled={busy || Boolean(blockedReason)}>
              {generateLabel}
            </button>
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className={styles.stack}>
          <h3 className={styles.sectionTitle}>Vista previa</h3>
          {preview.map((round) => (
            <PreviewRound key={round.round_number} admin={admin} round={round} swissHistory={swissHistory} />
          ))}
          <div className={styles.saveBar}>
            <span className={styles.saveBarText}>
              {pairingMode === 'fixed' ? `${preview.length} rondas sin guardar` : 'Ronda sin guardar'}
            </span>
            <div className={styles.saveBarActions}>
              <button type="button" className={styles.ghost} onClick={() => { setPreview([]); setExtraPairs([]); }} disabled={busy}>Descartar</button>
              <button type="button" className={styles.primary} onClick={save} disabled={busy}>
                {busy ? 'Guardando…' : pairingMode === 'fixed' ? 'Guardar fixture' : 'Guardar ronda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {hasRounds && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Rondas guardadas</h3>
            <div className={styles.withTip}>
              <button type="button" className={styles.dangerLink} onClick={() => setPending('clearAll')} disabled={busy}>
                <FaTrashAlt aria-hidden /> Borrar todas
              </button>
              <InfoTip label="Qué hace Borrar todas" align="end">
                <strong>Borra:</strong> todas las rondas guardadas, con sus cruces y marcadores.
                <br /><strong>Mantiene:</strong> el torneo, los jugadores inscritos y sus razas.
                <br />Para borrar solo una, usa el basurero de esa ronda. No se puede deshacer.
              </InfoTip>
            </div>
          </div>
          <ul className={styles.roundList}>
            {fixture.rounds.map((round) => {
              const done = round.matches.filter((match) => match.completed).length;
              const name = round.is_extra_round ? 'Final' : `Ronda ${round.number}`;
              return (
                <li key={round.number} className={styles.roundItem}>
                  <button type="button" className={styles.roundRow} onClick={() => onGo('marcadores')}>
                    <strong>{name}</strong>
                    <span className={round.format === 'FX' ? styles.chipFx : styles.chipPb}>{round.format}</span>
                    {round.subformat && <span className={styles.muted}>{round.subformat}</span>}
                    <span className={done === round.matches.length && round.matches.length > 0 ? styles.tagOk : styles.tagPending}>
                      {done}/{round.matches.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.iconDanger}
                    onClick={() => setPending({ deleteRound: round.number })}
                    disabled={busy}
                    aria-label={`Borrar ${name}`}
                    title={`Borrar ${name}`}
                  >
                    <FaTrashAlt aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className={styles.hint}>Toca una ronda para cargar sus marcadores.</p>
        </div>
      )}

      {pending === 'mode' && (
        <ConfirmDialog
          title="¿Cambiar el tipo de rondas?"
          confirmLabel="Cambiar"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={() => { setPending(null); applyMode(pendingMode); }}
        >
          Ya hay {fixture.rounds.length} rondas guardadas. Cambiar el tipo no las borra, pero las próximas se armarán
          {pendingMode === 'fixed' ? ' todas de una vez.' : ' ronda a ronda.'}
        </ConfirmDialog>
      )}
      {roundToDelete && (
        <ConfirmDialog
          title={`¿Borrar ${roundToDelete.is_extra_round ? 'la final' : `la ronda ${roundToDelete.number}`}?`}
          confirmLabel="Borrar ronda"
          tone="danger"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={() => deleteRound(roundToDelete.number)}
        >
          <p>
            Se borrarán sus {roundToDelete.matches.length} cruces
            {roundToDelete.matches.some((match) => match.completed)
              ? ` y ${roundToDelete.matches.filter((match) => match.completed).length} marcadores ya cargados`
              : ''}.
          </p>
          {roundToDelete.number < fixture.rounds.length && (
            <p className={styles.warnText}>
              Las rondas siguientes suben un número (la {roundToDelete.number + 1} pasa a ser la {roundToDelete.number}).
              {pairingMode === 'progressive' && ' Ojo: en ronda a ronda, esos cruces se armaron con los resultados de esta ronda.'}
            </p>
          )}
        </ConfirmDialog>
      )}
      {pending === 'clearAll' && (
        <ConfirmDialog
          title="¿Borrar todas las rondas?"
          confirmLabel="Borrar todas"
          tone="danger"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={clearAll}
        >
          Se borrarán las {fixture.rounds.length} rondas
          {scoredMatches > 0 ? ` y ${scoredMatches} marcadores cargados` : ''}. Los jugadores y sus razas se mantienen.
        </ConfirmDialog>
      )}
      {pending === 'replace' && (
        <ConfirmDialog
          title="¿Reemplazar el fixture?"
          confirmLabel="Reemplazar"
          tone="danger"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={save}
        >
          Se borrarán las {fixture.rounds.length} rondas guardadas y todos sus marcadores, y se guardará el fixture nuevo.
        </ConfirmDialog>
      )}
    </section>
  );
}
