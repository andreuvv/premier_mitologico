import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchActiveTournament, fetchSubformats, type TournamentRow } from '../services/tournamentQueries';

export interface TournamentFormatBadge {
  name: string;
  shortName: string;
  link: string;
}

export interface ActiveTournamentCard {
  id: number;
  name: string;
  monthYear: string;
  startDate: string | null;
  format: 'PB' | 'FX' | 'PBFX';
  locationName: string | null;
  locationAddress: string | null;
  formats: TournamentFormatBadge[];
}

interface ActiveTournamentState {
  loading: boolean;
  tournament: ActiveTournamentCard | null;
  reload: () => Promise<void>;
}

const ActiveTournamentContext = createContext<ActiveTournamentState | null>(null);

const ROUND_TYPE: TournamentFormatBadge = {
  name: 'Mejor de 3',
  shortName: 'Mejor de 3',
  link: '/tournament-info/tournamentSystem/md3',
};

function formatBadge(side: 'PB' | 'FX', subformatName: string | null): TournamentFormatBadge {
  const label = subformatName ?? '';
  const lower = label.toLowerCase();
  const full = side === 'PB'
    ? (label ? `Primer Bloque ${label}` : 'Primer Bloque')
    : (label ? `Furia Extendido ${label}` : 'Furia Extendido');
  const shortName = side === 'PB' ? full.replace('Primer Bloque', 'PB') : full.replace('Furia Extendido', 'FX');
  let link = side === 'PB'
    ? '/game-formats/primerBloque/primerBloqueRacialLibre'
    : '/game-formats/bloqueFuria/bloqueFuriaRacialLibre';
  if (lower.includes('edici')) link = '/game-formats/primerBloque/primerBloqueRacialEdicion';
  if (lower.includes('ragnarok')) link = '/game-formats/formatosEspeciales/ragnarok';
  if (lower.includes('vcr')) link = '/game-formats/formatosEspeciales/vcr';
  return { name: full, shortName, link };
}

export function buildActiveTournamentCard(
  tournament: TournamentRow,
  subformats: Array<{ subformat_id: number; subformat_name: string }>,
): ActiveTournamentCard {
  const nameOf = (id: number | null) => subformats.find((row) => row.subformat_id === id)?.subformat_name ?? null;
  const side = tournament.format === 'FX' ? 'FX' : 'PB';
  const secondName = nameOf(tournament.subformat2_id);
  const formats = tournament.format === 'PBFX'
    ? [formatBadge('PB', nameOf(tournament.subformat1_id)), formatBadge('FX', secondName)]
    : [
      formatBadge(side, nameOf(tournament.subformat1_id)),
      ...(secondName ? [formatBadge(side, secondName)] : []),
    ];
  return {
    id: tournament.id,
    name: tournament.name,
    monthYear: `${tournament.month} ${tournament.year}`,
    startDate: tournament.start_date,
    format: tournament.format,
    locationName: tournament.location_name,
    locationAddress: tournament.location_address,
    formats: [...formats, ROUND_TYPE],
  };
}

export function parseTournamentDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isTournamentDatePast(startDate: string | null): boolean {
  if (!startDate) return false;
  const date = parseTournamentDate(startDate);
  const now = new Date();
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) >= 1;
}

export function formatActiveTournamentDate(startDate: string | null): string {
  if (!startDate || isTournamentDatePast(startDate)) return 'Fecha por definir';
  const date = parseTournamentDate(startDate);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

export function activeTournamentDateTime(startDate: string | null): Date | null {
  if (!startDate || isTournamentDatePast(startDate)) return null;
  return new Date(`${startDate}T00:00:00`);
}

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

export function useActiveTournamentCard(): ActiveTournamentState {
  const value = useContext(ActiveTournamentContext);
  if (!value) throw new Error('useActiveTournamentCard must be used within ActiveTournamentProvider');
  return value;
}
