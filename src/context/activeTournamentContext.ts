import { createContext } from 'react';
import type { ActiveTournamentCard } from '../utils/activeTournament';

export interface ActiveTournamentState {
  loading: boolean;
  tournament: ActiveTournamentCard | null;
  reload: () => Promise<void>;
}

export const ActiveTournamentContext = createContext<ActiveTournamentState | null>(null);
