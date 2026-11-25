import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchActiveTournament, fetchSubformats } from '../services/tournamentQueries';
import { buildActiveTournamentCard, type ActiveTournamentCard } from '../utils/activeTournament';
import { ActiveTournamentContext } from './activeTournamentContext';

export function ActiveTournamentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<ActiveTournamentCard | null>(null);

  const reload = useCallback(async () => {
    const [active, subformats] = await Promise.all([fetchActiveTournament(), fetchSubformats()]);
    setTournament(active ? buildActiveTournamentCard(active, subformats) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  const value = useMemo(() => ({ loading, tournament, reload }), [loading, tournament, reload]);
  return <ActiveTournamentContext.Provider value={value}>{children}</ActiveTournamentContext.Provider>;
}
