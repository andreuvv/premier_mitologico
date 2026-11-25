import { useContext } from 'react';
import { ActiveTournamentContext, type ActiveTournamentState } from '../context/activeTournamentContext';

// Date and badge helpers used together with this hook.
export * from '../utils/activeTournament';

export function useActiveTournamentCard(): ActiveTournamentState {
  const value = useContext(ActiveTournamentContext);
  if (!value) throw new Error('useActiveTournamentCard must be used within ActiveTournamentProvider');
  return value;
}
