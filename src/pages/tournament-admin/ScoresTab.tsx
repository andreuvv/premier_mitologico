import { useState } from 'react';
import { tournamentAdminAPI } from '../../services/tournamentAdminService';
import type { StepId } from './adminUtils';
import { SaveBar } from './ui';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

const SCORE_OPTIONS = [0, 1, 2];

interface ScoreRowProps {
  name: string;
  value: number | null;
  winner: boolean;
  onPick: (value: number) => void;
}

function ScoreRow({ name, value, winner, onPick }: ScoreRowProps) {
  return (
    <div className={styles.scoreRow}>
      <span className={winner ? `${styles.scoreName} ${styles.scoreWinner}` : styles.scoreName}>{name}</span>
      <div className={styles.scorePicks} role="radiogroup" aria-label={`Partidas ganadas por ${name}`}>
        {SCORE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            className={value === option ? styles.scorePickOn : styles.scorePick}
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ScoresTabProps {
  admin: TournamentAdminState;
  onGo: (step: StepId) => void;
}

/** "Marcadores": games won per player (0–2), one round at a time, saved together. */
export default function ScoresTab({ admin, onGo }: ScoresTabProps) {
  const { fixture, scoreFor, setScore, scoreDrafts, draftReady, discardScores, busy, run } = admin;
  const firstPending = fixture.rounds.find((round) => round.matches.some((match) => !match.completed));
  const [chosenRound, setChosenRound] = useState<number | null>(null);
  const roundNumber = chosenRound ?? firstPending?.number ?? fixture.rounds[fixture.rounds.length - 1]?.number ?? null;
  const round = fixture.rounds.find((item) => item.number === roundNumber);

  if (!round) {
    return (
      <section className={styles.stack}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Marcadores</h2>
          <p className={styles.hint}>Todavía no hay rondas guardadas.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onGo('rondas')}>Generar rondas</button>
          </div>
        </div>
      </section>
    );
  }

  const roundMatchIds = round.matches.map((match) => match.id);
  const changedHere = roundMatchIds.filter((id) => id in scoreDrafts);
  const readyHere = changedHere.filter(draftReady);
  const incompleteHere = changedHere.length - readyHere.length;
  const doneHere = round.matches.filter((match) => match.completed).length;
  const otherRoundsChanged = Object.keys(scoreDrafts).length - changedHere.length;

  const save = () => run(async () => {
    for (const matchId of readyHere) {
      const draft = scoreDrafts[matchId];
      await tournamentAdminAPI.updateScore(matchId, draft.score1 ?? 0, draft.score2 ?? 0);
    }
    discardScores(readyHere);
  }, readyHere.length === 1 ? 'Marcador guardado' : `${readyHere.length} marcadores guardados`);

  return (
    <section className={styles.stack} aria-labelledby="marcadores-title">
      <h2 id="marcadores-title" className={styles.srOnly}>Marcadores</h2>
      <div className={styles.roundTabs} role="tablist" aria-label="Rondas">
        {fixture.rounds.map((item) => {
          const done = item.matches.filter((match) => match.completed).length;
          const complete = item.matches.length > 0 && done === item.matches.length;
          const dirty = item.matches.some((match) => match.id in scoreDrafts);
          const className = [styles.roundTab, item.number === round.number ? styles.roundTabOn : '', complete ? styles.roundTabDone : '']
            .filter(Boolean).join(' ');
          return (
            <button
              key={item.number}
              type="button"
              role="tab"
              aria-selected={item.number === round.number}
              className={className}
              onClick={() => setChosenRound(item.number)}
            >
              <span>{item.is_extra_round ? 'Final' : `R${item.number}`}</span>
              <small>{complete ? '✓' : `${done}/${item.matches.length}`}</small>
              {dirty && <span className={styles.navDot} aria-label="Cambios sin guardar" />}
            </button>
          );
        })}
      </div>

      <div className={styles.roundHead}>
        <strong>{round.is_extra_round ? 'Final' : `Ronda ${round.number}`}</strong>
        <span className={round.format === 'FX' ? styles.chipFx : styles.chipPb}>{round.format}</span>
        {round.subformat && <span className={styles.muted}>{round.subformat}</span>}
        <span className={styles.roundHeadCount}>{doneHere}/{round.matches.length} jugadas</span>
      </div>

      {round.matches.length === 0 && <p className={styles.empty}>Esta ronda no tiene cruces.</p>}

      <ol className={styles.matchList}>
        {round.matches.map((match, index) => {
          const score = scoreFor(match.id);
          const changed = match.id in scoreDrafts;
          const isBye = match.player2_id === null;
          const known = score.score1 !== null && (isBye || score.score2 !== null);
          const winner1 = known && !isBye && (score.score1 ?? 0) > (score.score2 ?? 0);
          const winner2 = known && !isBye && (score.score2 ?? 0) > (score.score1 ?? 0);
          const status = changed
            ? (draftReady(match.id) ? <span className={styles.tagChanged}>Sin guardar</span> : <span className={styles.tagMissing}>Falta un puntaje</span>)
            : match.completed ? <span className={styles.tagOk}>Guardado</span> : <span className={styles.tagPending}>Pendiente</span>;
          return (
            <li key={match.id} className={changed ? `${styles.matchCard} ${styles.itemChanged}` : styles.matchCard}>
              <div className={styles.matchTop}>
                <span className={styles.tableNo}>{index + 1}</span>
                {status}
              </div>
              <ScoreRow name={match.player1_name} value={score.score1} winner={winner1} onPick={(value) => setScore(match.id, 'score1', value)} />
              {isBye ? (
                <p className={styles.muted}>Descansa (BYE)</p>
              ) : (
                <ScoreRow name={match.player2_name} value={score.score2} winner={winner2} onPick={(value) => setScore(match.id, 'score2', value)} />
              )}
            </li>
          );
        })}
      </ol>

      {changedHere.length > 0 && (
        <SaveBar
          text={[
            readyHere.length > 0 ? `${readyHere.length} listo${readyHere.length === 1 ? '' : 's'}` : '',
            incompleteHere > 0 ? `${incompleteHere} incompleto${incompleteHere === 1 ? '' : 's'}` : '',
          ].filter(Boolean).join(' · ')}
          saveLabel={readyHere.length > 1 ? `Guardar ${readyHere.length}` : 'Guardar'}
          onSave={save}
          onDiscard={() => discardScores(changedHere)}
          saveDisabled={readyHere.length === 0}
          busy={busy}
        />
      )}
      {otherRoundsChanged > 0 && (
        <p className={styles.hint}>Hay {otherRoundsChanged} marcador{otherRoundsChanged === 1 ? '' : 'es'} sin guardar en otras rondas.</p>
      )}
    </section>
  );
}
