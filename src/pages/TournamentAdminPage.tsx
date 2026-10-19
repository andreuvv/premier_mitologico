import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useActiveTournamentCard } from '../hooks/useActiveTournamentCard';
import { isCurrentUserBanlistAdmin } from '../services/monthlyBanlistService';
import { fixtureAPI, type APIFixtureResponse, type APIPlayer } from '../services/fixtureAPI';
import { tournamentAdminAPI } from '../services/tournamentAdminService';
import { fetchActiveTournament, fetchRaces, fetchSubformats, type SubformatRow } from '../services/tournamentQueries';
import { fullCycleLength, generateRoundRobin, type RoundRobinRound } from '../utils/roundRobin';
import { finalsPairs, generateSwissRound, previousRoundsReady, standingPoints, type SwissHistoryMatch } from '../utils/swissPairing';
import { orderedStandings } from '../utils/finalPositions';
import { FX_RACES, PB_RACES } from '../config/profileOptions';
import styles from './TournamentAdminPage.module.css';

type Tab = 'crear' | 'fixture' | 'marcadores' | 'razas' | 'archivo';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'crear', label: 'Crear' },
  { id: 'fixture', label: 'Fixture' },
  { id: 'marcadores', label: 'Marcadores' },
  { id: 'razas', label: 'Razas' },
  { id: 'archivo', label: 'Archivo' },
];

function raceChoices(side: 'PB' | 'FX', current: string): string[] {
  const choices = [...(side === 'PB' ? PB_RACES : FX_RACES)].sort((left, right) => left.localeCompare(right, 'es'));
  if (current && !choices.includes(current)) choices.unshift(current);
  return choices;
}

const TournamentAdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reload: reloadPublicCard } = useActiveTournamentCard();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('crear');
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [subformats, setSubformats] = useState<SubformatRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [format, setFormat] = useState<'PB' | 'FX' | 'PBFX'>('PBFX');
  const [subformat1Id, setSubformat1Id] = useState(2);
  const [subformat2Id, setSubformat2Id] = useState(4);
  const [tournamentType, setTournamentType] = useState<'premier_mitoxico' | 'special_event'>('premier_mitoxico');
  const [roundCount, setRoundCount] = useState(7);
  const [pairingMode, setPairingMode] = useState<'fixed' | 'progressive'>('fixed');
  const [includeExtra, setIncludeExtra] = useState(true);
  const [preview, setPreview] = useState<RoundRobinRound[]>([]);
  const [extraPairs, setExtraPairs] = useState<Array<[number, number]>>([]);
  const [fixture, setFixture] = useState<APIFixtureResponse>({ rounds: [] });
  const [scores, setScores] = useState<Record<number, { score1: string; score2: string }>>({});
  const [races, setRaces] = useState<Record<number, { race1: string; race2: string }>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setAllowed(false);
      return;
    }
    isCurrentUserBanlistAdmin(user.id).then(setAllowed).catch(() => setAllowed(false));
  }, [user]);

  const load = async () => {
    const [roster, formats, liveFixture, livePlayers, active] = await Promise.all([
      fixtureAPI.getPremierPlayers(),
      fetchSubformats(),
      fixtureAPI.getFixture(),
      fixtureAPI.getPlayers(),
      fetchActiveTournament(),
    ]);
    setPlayers(roster);
    setSubformats(formats);
    if (active) {
      setActiveId(active.id);
      setName(active.name);
      setMonth(active.month);
      setYear(active.year);
      setStartDate(active.start_date?.slice(0, 10) ?? '');
      setEndDate(active.end_date?.slice(0, 10) ?? '');
      setLocationName(active.location_name ?? '');
      setLocationAddress(active.location_address ?? '');
      setFormat(active.format);
      setTournamentType(active.tournament_type);
      if (active.subformat1_id) setSubformat1Id(active.subformat1_id);
      if (active.subformat2_id) setSubformat2Id(active.subformat2_id);
      setSelectedIds(livePlayers.map((player) => player.id));
      setRoundCount(fullCycleLength(livePlayers.length));
      setPairingMode(active.pairing_mode === 'progressive' ? 'progressive' : 'fixed');
    } else {
      setActiveId(null);
    }
    setFixture(liveFixture);
    const nextScores: Record<number, { score1: string; score2: string }> = {};
    liveFixture.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        nextScores[match.id] = {
          score1: match.score1 === null ? '' : String(match.score1),
          score2: match.score2 === null ? '' : String(match.score2),
        };
      });
    });
    setScores(nextScores);
    if (livePlayers.length > 0) {
      const raceRows = await fetchRaces();
      const nextRaces: Record<number, { race1: string; race2: string }> = {};
      livePlayers.forEach((player) => {
        const race = raceRows.find((row) => row.player_id === player.id);
        nextRaces[player.id] = { race1: race?.race_format1 ?? '', race2: race?.race_format2 ?? '' };
      });
      setRaces(nextRaces);
    }
  };

  useEffect(() => {
    if (allowed) {
      load().catch((loadError: Error) => setError(loadError.message));
    }
  }, [allowed]);

  const playerName = useMemo(() => {
    const names = new Map(players.map((player) => [player.id, player.name]));
    return (playerId: number | null) => (playerId === null ? 'BYE' : names.get(playerId) ?? String(playerId));
  }, [players]);

  const run = async (action: () => Promise<void>, success: string) => {
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo completar la acción');
    }
  };

  if (allowed === null) return <main className={styles.page}>Cargando…</main>;
  if (!allowed) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Admin de torneos</h1>
        <p>Esta sección es solo para el administrador.</p>
        <button className={styles.secondary} onClick={() => navigate('/mitoxicos')}>Volver</button>
      </main>
    );
  }

  const confirmedIds = selectedIds;
  const minimumRounds = fullCycleLength(confirmedIds.length);
  const roundMax = Math.max(10, minimumRounds);
  const roundMarks = Array.from({ length: roundMax }, (_, index) => index + 1);
  const swissHistory: SwissHistoryMatch[] = fixture.rounds.flatMap((round) => round.matches.map((match) => ({
    player1_id: match.player1_id,
    player2_id: match.player2_id,
    score1: match.score1,
    score2: match.score2,
    completed: match.completed,
  })));
  const swissReady = previousRoundsReady(swissHistory);
  const regularRoundCount = fixture.rounds.filter((round) => !round.is_extra_round).length;
  const hasFinalRound = fixture.rounds.some((round) => round.is_extra_round);
  const canGenerateFinal = pairingMode === 'progressive' && includeExtra && regularRoundCount >= roundCount && !hasFinalRound;
  const choosePairingMode = (mode: 'fixed' | 'progressive') => {
    if (mode === pairingMode) return;
    setPairingMode(mode);
    setPreview([]);
    setExtraPairs([]);
    if (!activeId) return;
    run(
      () => tournamentAdminAPI.setPairingMode(mode),
      mode === 'fixed' ? 'Tipo de rondas: fijas' : 'Tipo de rondas: una a la vez',
    ).catch(() => undefined);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin de torneos</h1>
        <p className={styles.lede}>Los jugadores se guardan con su player id. En pantalla solo se ven los nombres.</p>
      </header>
      <div className={styles.tabs} role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? styles.tabActive : styles.tab}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {message && <p className={styles.banner}>{message}</p>}
      {error && <p className={`${styles.banner} ${styles.bannerError}`}>{error}</p>}

      {tab === 'crear' && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Datos del torneo</h2>
          <div className={styles.grid}>
            <label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Mes
              <select value={month} onChange={(event) => setMonth(event.target.value)}>
                {MONTHS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Año<input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} /></label>
            <label>Inicio<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label>Fin<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
            <label>Lugar<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Weshes" /></label>
            <label className={styles.wide}>Dirección<input value={locationAddress} onChange={(event) => setLocationAddress(event.target.value)} placeholder="Calle 123, Comuna, Santiago" /></label>
          </div>
          <h2 className={styles.sectionTitle}>Formato</h2>
          <div className={styles.grid}>
            <label>Formato
              <select value={format} onChange={(event) => setFormat(event.target.value as 'PB' | 'FX' | 'PBFX')}>
                <option value="PB">Primer Bloque</option>
                <option value="FX">Furia Extendido</option>
                <option value="PBFX">PB + FX</option>
              </select>
            </label>
            <label>Tipo
              <select value={tournamentType} onChange={(event) => setTournamentType(event.target.value as 'premier_mitoxico' | 'special_event')}>
                <option value="premier_mitoxico">Premier Mitoxico</option>
                <option value="special_event">Evento especial</option>
              </select>
            </label>
            <label>Subformato 1
              <select value={subformat1Id} onChange={(event) => setSubformat1Id(Number(event.target.value))}>
                {subformats.map((subformat) => (
                  <option key={subformat.subformat_id} value={subformat.subformat_id}>{subformat.subformat_name}</option>
                ))}
              </select>
            </label>
            <label>Subformato 2
              <select value={subformat2Id} onChange={(event) => setSubformat2Id(Number(event.target.value))}>
                {subformats.map((subformat) => (
                  <option key={subformat.subformat_id} value={subformat.subformat_id}>{subformat.subformat_name}</option>
                ))}
              </select>
            </label>
          </div>
          <h2 className={styles.sectionTitle}>Jugadores <span className={styles.count}>{selectedIds.length}</span></h2>
          <div className={styles.players}>
            {players.map((player) => {
              const selected = selectedIds.includes(player.id);
              return (
                <label key={player.id} className={selected ? styles.playerOn : styles.player}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => {
                      setSelectedIds((current) => event.target.checked
                        ? [...current, player.id]
                        : current.filter((id) => id !== player.id));
                    }}
                  />
                  <span>{player.name}</span>
                </label>
              );
            })}
          </div>
          <p className={styles.note}>
            En PB y FX las rondas alternan los dos subformatos, empezando por el primero. En PBFX, el primero es el de PB y el segundo el de FX.
          </p>
          <p className={styles.note}>
            {activeId
              ? 'Puedes cambiar el nombre, las fechas, la ubicación, los formatos y los jugadores. Si ya hay fixture, bórralo antes de pasar entre PB, FX y PBFX, o antes de quitar un jugador que ya tiene partidas.'
              : 'No hay un torneo activo. Al crearlo, este formulario queda listo para modificar jugadores y formatos.'}
          </p>
          <button
            className={styles.primary}
            onClick={() => run(
              async () => {
                const input = {
                  name,
                  month,
                  year,
                  startDate: startDate || null,
                  endDate: endDate || null,
                  format,
                  subformat1Id,
                  subformat2Id,
                  tournamentType,
                  playerIds: selectedIds,
                  locationName: locationName.trim() || null,
                  locationAddress: locationAddress.trim() || null,
                };
                if (activeId) await tournamentAdminAPI.updateTournament(input);
                else await tournamentAdminAPI.createTournament(input);
                await reloadPublicCard();
              },
              activeId ? 'Torneo actualizado' : 'Torneo creado',
            )}
          >
            {activeId ? 'Guardar cambios' : 'Crear torneo activo'}
          </button>
        </section>
      )}

      {tab === 'fixture' && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Tipo de rondas</h2>
          <div className={styles.modeSwitch} role="group" aria-label="Tipo de rondas">
            <button
              type="button"
              className={pairingMode === 'fixed' ? styles.modeOn : styles.mode}
              onClick={() => choosePairingMode('fixed')}
            >
              Rondas fijas
            </button>
            <button
              type="button"
              className={pairingMode === 'progressive' ? styles.modeOn : styles.mode}
              onClick={() => choosePairingMode('progressive')}
            >
              Ronda a ronda
            </button>
          </div>
          <div className={styles.grid}>
            <div className={styles.roundSlider}>
              <span>Rondas: <strong className={styles.roundValue}>{roundCount}</strong></span>
              <input
                type="range"
                min={1}
                max={roundMax}
                value={Math.min(roundCount, roundMax)}
                onChange={(event) => setRoundCount(Number(event.target.value))}
              />
              <div className={styles.roundTicks} style={{ gridTemplateColumns: `repeat(${roundMarks.length}, minmax(0, 1fr))` }}>
                {roundMarks.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    className={[
                      styles.roundTick,
                      mark === roundCount ? styles.roundTickActive : '',
                      mark === minimumRounds ? styles.roundTickMinimum : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setRoundCount(mark)}
                    title={mark === minimumRounds ? 'Mínimo para que todos se enfrenten al menos una vez' : undefined}
                  >
                    {mark}
                  </button>
                ))}
              </div>
            </div>
            <label className={styles.extraToggle}>
              <span>
                <input type="checkbox" checked={includeExtra} onChange={(event) => setIncludeExtra(event.target.checked)} />
                {pairingMode === 'progressive' ? ' Ronda extra de finales' : ' Ronda extra'}
              </span>
            </label>
          </div>
          <p className={styles.lede}>
            {confirmedIds.length < 2
              ? 'Se necesitan al menos 2 jugadores.'
              : `Con ${confirmedIds.length} jugadores se necesitan ${minimumRounds} rondas para que todos se enfrenten al menos una vez.`}
            {pairingMode === 'fixed'
              ? ' La ronda extra queda vacía para asignar los cruces a mano.'
              : ' En ronda a ronda, la primera se sortea y cada siguiente junta a los mejores según los puntos de la ronda anterior. La ronda extra de finales propone los cruces de los cuatro primeros.'}
          </p>
          {pairingMode === 'progressive' && (
            <p className={styles.lede}>
              {regularRoundCount} de {roundCount} {roundCount === 1 ? 'ronda' : 'rondas'}.
              {regularRoundCount >= roundCount
                ? hasFinalRound
                  ? ' La final ya está guardada.'
                  : includeExtra
                    ? ' Puedes generar la ronda extra de finales.'
                    : ' Ya están todas las rondas elegidas.'
                : swissReady
                  ? ' Puedes generar la siguiente.'
                  : ' Faltan marcadores antes de generar la siguiente.'}
            </p>
          )}
          <div className={styles.actions}>
            <button
              className={styles.secondary}
              onClick={() => {
                setError('');
                if (pairingMode === 'progressive') {
                  if (regularRoundCount >= roundCount && !canGenerateFinal) {
                    setError(hasFinalRound
                      ? 'La final ya está guardada.'
                      : `El torneo está definido en ${roundCount} ${roundCount === 1 ? 'ronda' : 'rondas'}.`);
                    return;
                  }
                  if (!swissReady) {
                    setError('Carga los marcadores de la ronda anterior antes de generar la siguiente.');
                    return;
                  }
                  if (canGenerateFinal) {
                    const shell = generateSwissRound({
                      playerIds: confirmedIds,
                      history: swissHistory,
                      roundNumber: fixture.rounds.length + 1,
                      format,
                      subformat1Id,
                      subformat2Id,
                    });
                    setPreview(shell ? [{ ...shell, is_extra_round: true, matches: [] }] : []);
                    setExtraPairs(finalsPairs(confirmedIds, swissHistory));
                    return;
                  }
                  const next = generateSwissRound({
                    playerIds: confirmedIds,
                    history: swissHistory,
                    roundNumber: fixture.rounds.length + 1,
                    format,
                    subformat1Id,
                    subformat2Id,
                  });
                  setPreview(next ? [next] : []);
                  setExtraPairs([]);
                  return;
                }
                const rounds = generateRoundRobin({
                  playerIds: confirmedIds,
                  roundCount,
                  format,
                  subformat1Id,
                  subformat2Id,
                  includeExtraRound: includeExtra,
                });
                setPreview(rounds);
                setExtraPairs([]);
              }}
            >
              {pairingMode === 'progressive' ? (canGenerateFinal ? 'Generar final' : 'Generar siguiente ronda') : 'Generar vista previa'}
            </button>
            <button
              className={styles.primary}
              onClick={() => {
                const rounds = preview.map((round) => {
                  if (!round.is_extra_round) return round;
                  return {
                    ...round,
                    matches: extraPairs
                      .filter(([player1, player2]) => player1 && player2)
                      .map(([player1, player2]) => ({ player1_id: player1, player2_id: player2 })),
                  };
                });
                if (pairingMode === 'progressive') {
                  const round = rounds[0];
                  if (!round) return undefined;
                  if (round.is_extra_round) {
                    const ids = round.matches.flatMap((match) => match.player2_id === null ? [match.player1_id] : [match.player1_id, match.player2_id]);
                    if (round.matches.length < 1) {
                      setError('Elige los cruces de la final.');
                      return undefined;
                    }
                    if (new Set(ids).size !== ids.length) {
                      setError('Un jugador no puede estar en los dos cruces de la final.');
                      return undefined;
                    }
                  }
                  return run(() => tournamentAdminAPI.appendRound(round), round.is_extra_round ? 'Final guardada' : 'Ronda guardada');
                }
                return run(() => tournamentAdminAPI.replaceFixture(rounds), 'Fixture guardado');
              }}
            >
              {pairingMode === 'progressive' ? 'Guardar ronda' : 'Guardar fixture'}
            </button>
          </div>
          {preview.length === 0 && <p className={styles.quiet}>Genera la vista previa para ver los cruces.</p>}
          {preview.map((round) => {
            const subformatName = subformats.find((item) => item.subformat_id === round.subformat_id)?.subformat_name;
            const extraChoices = [
              { id: subformat1Id, side: format === 'FX' ? 'FX' as const : 'PB' as const },
              { id: subformat2Id, side: format === 'PB' ? 'PB' as const : 'FX' as const },
            ].filter((choice, index, list) => choice.id && list.findIndex((item) => item.id === choice.id) === index);
            return (
              <div key={round.round_number} className={styles.previewRound}>
                <div className={styles.previewTitle}>
                  <strong>Ronda {round.round_number}</strong>
                  <span className={round.format === 'FX' ? styles.previewBadgeFx : styles.previewBadgePb}>{round.format}</span>
                  {(round.is_extra_round || pairingMode === 'progressive') ? (
                    <label className={styles.extraSubformat}>
                      Subformato
                      <select
                        value={round.subformat_id ?? ''}
                        onChange={(event) => {
                          const nextId = Number(event.target.value);
                          const chosen = extraChoices.find((choice) => choice.id === nextId);
                          setPreview((current) => current.map((item) => (
                            item.round_number === round.round_number && (item.is_extra_round || pairingMode === 'progressive')
                              ? { ...item, subformat_id: nextId, format: chosen?.side ?? item.format }
                              : item
                          )));
                        }}
                      >
                        {extraChoices.map((choice) => {
                          const name = subformats.find((item) => item.subformat_id === choice.id)?.subformat_name ?? 'Subformato';
                          return <option key={choice.id} value={choice.id}>{format === 'PBFX' ? `${choice.side} ${name}` : name}</option>;
                        })}
                      </select>
                    </label>
                  ) : subformatName && <span className={styles.previewSubformat}>{subformatName}</span>}
                  {round.is_extra_round && <span className={styles.previewSubformat}>Extra</span>}
                  <span>{round.is_extra_round ? 'Cruces manuales' : `${round.matches.length} cruces`}</span>
                </div>
                {round.is_extra_round ? (
                  [0, 1].map((index) => (
                    <div key={index} className={styles.extraPair}>
                      <select
                        value={extraPairs[index]?.[0] ?? ''}
                        onChange={(event) => {
                          const next = [...extraPairs] as Array<[number, number]>;
                          const current = next[index] ?? [0, 0];
                          next[index] = [Number(event.target.value), current[1]];
                          setExtraPairs(next);
                        }}
                      >
                        <option value="">Jugador 1</option>
                        {confirmedIds.map((id) => <option key={id} value={id}>{playerName(id)}</option>)}
                      </select>
                      <span>vs</span>
                      <select
                        value={extraPairs[index]?.[1] ?? ''}
                        onChange={(event) => {
                          const next = [...extraPairs] as Array<[number, number]>;
                          const current = next[index] ?? [0, 0];
                          next[index] = [current[0], Number(event.target.value)];
                          setExtraPairs(next);
                        }}
                      >
                        <option value="">Jugador 2</option>
                        {confirmedIds.map((id) => <option key={id} value={id}>{playerName(id)}</option>)}
                      </select>
                    </div>
                  ))
                ) : (
                  round.matches.map((match, index) => (
                    <p key={`${round.round_number}-${index}`} className={match.player2_id === null ? styles.previewBye : styles.previewMatch}>
                      {(() => {
                        const label = (playerId: number) => (
                          pairingMode === 'progressive'
                            ? `${playerName(playerId)} (${standingPoints(playerId, swissHistory)} pts)`
                            : playerName(playerId)
                        );
                        return match.player2_id === null
                          ? `${label(match.player1_id)} (BYE)`
                          : `${label(match.player1_id)} vs ${label(match.player2_id)}`;
                      })()}
                    </p>
                  ))
                )}
              </div>
            );
          })}
        </section>
      )}

      {tab === 'marcadores' && (
        <section className={styles.panel}>
          {fixture.rounds.length === 0 && <p className={styles.note}>Todavía no hay rondas guardadas.</p>}
          {fixture.rounds.map((round) => (
            <div key={round.number} className={styles.round}>
              <div className={styles.roundHead}>
                <strong>Ronda {round.number}</strong>
                <span className={round.format === 'FX' ? styles.previewBadgeFx : styles.previewBadgePb}>{round.format}</span>
                {round.subformat && <span className={styles.previewSubformat}>{round.subformat}</span>}
              </div>
              {round.matches.map((match) => (
                <div key={match.id} className={styles.match}>
                  <span>{match.player1_name} vs {match.player2_name}</span>
                  <input
                    className={styles.score}
                    inputMode="numeric"
                    value={scores[match.id]?.score1 ?? ''}
                    onChange={(event) => setScores((current) => ({
                      ...current,
                      [match.id]: { score1: event.target.value, score2: current[match.id]?.score2 ?? '' },
                    }))}
                  />
                  <input
                    className={styles.score}
                    inputMode="numeric"
                    value={scores[match.id]?.score2 ?? ''}
                    onChange={(event) => setScores((current) => ({
                      ...current,
                      [match.id]: { score1: current[match.id]?.score1 ?? '', score2: event.target.value },
                    }))}
                  />
                  <button
                    className={styles.secondary}
                    onClick={() => run(
                      () => tournamentAdminAPI.updateScore(
                        match.id,
                        Number(scores[match.id]?.score1 ?? 0),
                        Number(scores[match.id]?.score2 ?? 0),
                      ),
                      'Marcador guardado',
                    )}
                  >
                    Guardar
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {tab === 'razas' && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Razas del torneo</h2>
          <p className={styles.lede}>
            {format === 'PBFX'
              ? 'El primer desplegable usa razas de Primer Bloque y el segundo, razas de Furia.'
              : `Solo se listan las razas de ${format === 'FX' ? 'Furia Extendido' : 'Primer Bloque'}.`}
          </p>
          {Object.keys(races).length === 0 && <p>No hay jugadores en el torneo activo.</p>}
          {Object.keys(races).map((id) => {
            const playerId = Number(id);
            const race1 = races[playerId]?.race1 ?? '';
            const race2 = races[playerId]?.race2 ?? '';
            const side1: 'PB' | 'FX' = format === 'FX' ? 'FX' : 'PB';
            const side2: 'PB' | 'FX' = format === 'PB' ? 'PB' : 'FX';
            const label1 = subformats.find((row) => row.subformat_id === subformat1Id)?.subformat_name ?? 'Subformato 1';
            const label2 = subformats.find((row) => row.subformat_id === subformat2Id)?.subformat_name ?? 'Subformato 2';
            return (
              <div key={playerId} className={styles.raceRow}>
                <span>{playerName(playerId)}</span>
                <label>
                  {format === 'PBFX' ? `PB ${label1}` : label1}
                  <select
                    value={race1}
                    onChange={(event) => setRaces((current) => ({
                      ...current,
                      [playerId]: { race1: event.target.value, race2: current[playerId]?.race2 ?? '' },
                    }))}
                  >
                    <option value="">Sin raza</option>
                    {raceChoices(side1, race1).map((race) => <option key={race} value={race}>{race}</option>)}
                  </select>
                </label>
                <label>
                  {format === 'PBFX' ? `FX ${label2}` : label2}
                  <select
                    value={race2}
                    onChange={(event) => setRaces((current) => ({
                      ...current,
                      [playerId]: { race1: current[playerId]?.race1 ?? '', race2: event.target.value },
                    }))}
                  >
                    <option value="">Sin raza</option>
                    {raceChoices(side2, race2).map((race) => <option key={race} value={race}>{race}</option>)}
                  </select>
                </label>
                <button
                  className={styles.secondary}
                  onClick={() => run(
                    () => tournamentAdminAPI.saveRace(playerId, race1, race2),
                    'Raza guardada',
                  )}
                >
                  Guardar
                </button>
              </div>
            );
          })}
        </section>
      )}

      {tab === 'archivo' && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Archivar</h2>
          <p className={styles.note}>Archivar copia rondas, partidas y la tabla actual, y deja el torneo inactivo.</p>
          <div className={styles.actions}>
            <button
              className={styles.primary}
              onClick={() => run(async () => {
                const standings = await fixtureAPI.getStandings();
                const liveFixture = await fixtureAPI.getFixture();
                const ordered = orderedStandings(standings, liveFixture);
                await tournamentAdminAPI.archive(ordered.map((standing, index) => ({
                  player_id: standing.id,
                  matches_played: standing.matches_played,
                  wins: standing.wins,
                  ties: standing.ties,
                  losses: standing.losses,
                  points: standing.points,
                  total_points_scored: standing.total_points_scored,
                  total_matches: standing.total_matches,
                  final_position: index + 1,
                })));
              }, 'Torneo archivado')}
            >
              Archivar torneo activo
            </button>
          </div>
          <div className={styles.dangerZone}>
            <h2 className={styles.sectionTitle}>Limpiar</h2>
            <p className={styles.note}>Estas acciones borran datos del torneo activo y no se pueden deshacer desde esta pantalla.</p>
            <div className={styles.actions}>
              <button className={styles.danger} onClick={() => run(() => tournamentAdminAPI.clear(false), 'Rondas y partidas borradas')}>
                Limpiar fixture
              </button>
              <button className={styles.danger} onClick={() => run(() => tournamentAdminAPI.clear(true), 'Roster y fixture borrados')}>
                Limpiar roster
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default TournamentAdminPage;
