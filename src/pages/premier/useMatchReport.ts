import { useState, type FormEvent } from 'react';
import type { APIMatchDetail } from '../../services/fixtureAPI';
import { tournamentAdminAPI } from '../../services/tournamentAdminService';

/** Inline "report result" form for the admin. Only one match is edited at a time. */
export function useMatchReport(onSaved: () => Promise<void>) {
  const [matchId, setMatchId] = useState<number | null>(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [error, setError] = useState('');

  const open = (match: APIMatchDetail) => {
    setMatchId(match.id);
    setScore1(match.score1 === null ? '' : String(match.score1));
    setScore2(match.score2 === null ? '' : String(match.score2));
    setError('');
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (matchId === null) return;
    const value1 = Number(score1);
    const value2 = Number(score2);
    if (score1.trim() === '' || score2.trim() === '' || Number.isNaN(value1) || Number.isNaN(value2)) {
      setError('Ingresa los dos resultados.');
      return;
    }
    try {
      await tournamentAdminAPI.updateScore(matchId, value1, value2);
      await onSaved();
      setMatchId(null);
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el resultado.');
    }
  };

  return {
    matchId,
    score1,
    score2,
    error,
    setScore1,
    setScore2,
    open,
    save,
    cancel: () => setMatchId(null),
  };
}

export type MatchReport = ReturnType<typeof useMatchReport>;
