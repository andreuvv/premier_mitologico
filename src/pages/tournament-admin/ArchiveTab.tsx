import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fixtureAPI } from '../../services/fixtureAPI';
import { tournamentAdminAPI } from '../../services/tournamentAdminService';
import { orderedStandings } from '../../utils/finalPositions';
import { raceComplete, type StepId } from './adminUtils';
import { ConfirmDialog, InfoTip } from './ui';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

type Pending = 'archive' | 'clearFixture' | 'clearRoster' | null;

/** Final standings of the active tournament, in archive order. */
async function loadFinalStandings() {
  const [standings, liveFixture] = await Promise.all([fixtureAPI.getStandings(), fixtureAPI.getFixture()]);
  return orderedStandings(standings, liveFixture);
}

interface ArchiveTabProps {
  admin: TournamentAdminState;
  onGo: (step: StepId) => void;
}

/** "Cerrar": checklist, final standings, archive; and clearing the active tournament. */
export default function ArchiveTab({ admin, onGo }: ArchiveTabProps) {
  const { fixture, rosterIds, savedRaces, steps, unsaved, busy, run } = admin;
  const [pending, setPending] = useState<Pending>(null);
  const fixtureVersion = fixture.rounds.flatMap((round) => round.matches.map((match) => `${match.id}:${match.score1}-${match.score2}`)).join('|');
  const standings = useQuery({
    queryKey: ['admin', 'final-standings', fixtureVersion],
    queryFn: loadFinalStandings,
    enabled: fixture.rounds.length > 0,
  });

  const matches = fixture.rounds.flatMap((round) => round.matches);
  const pendingMatches = matches.filter((match) => !match.completed).length;
  const missingRaces = rosterIds.filter((id) => !raceComplete(savedRaces[id])).length;
  const roundsStep = steps.find((step) => step.id === 'rondas');
  const anyUnsaved = unsaved.torneo || unsaved.razas || unsaved.rondas || unsaved.marcadores;

  const checks: Array<{ ok: boolean; text: string; go?: StepId }> = [
    { ok: Boolean(roundsStep?.done), text: roundsStep?.done ? 'Rondas completas' : 'Faltan rondas por generar', go: 'rondas' },
    { ok: matches.length > 0 && pendingMatches === 0, text: pendingMatches === 0 ? 'Todos los marcadores cargados' : `${pendingMatches} ${pendingMatches === 1 ? 'partida' : 'partidas'} sin marcador`, go: 'marcadores' },
    { ok: missingRaces === 0, text: missingRaces === 0 ? 'Razas registradas' : `${missingRaces} ${missingRaces === 1 ? 'jugador' : 'jugadores'} sin raza`, go: 'razas' },
    { ok: !anyUnsaved, text: anyUnsaved ? 'Hay cambios sin guardar' : 'Sin cambios pendientes' },
  ];
  const ready = checks.every((check) => check.ok);

  const archive = async () => {
    const ordered = await loadFinalStandings();
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
  };

  const confirm = async () => {
    const action = pending;
    if (action === 'archive') await run(archive, 'Torneo archivado');
    if (action === 'clearFixture') await run(() => tournamentAdminAPI.clear(false), 'Rondas y marcadores borrados');
    if (action === 'clearRoster') await run(() => tournamentAdminAPI.clear(true), 'Jugadores y rondas borrados');
    setPending(null);
  };

  return (
    <section className={styles.stack} aria-labelledby="cerrar-title">
      <div className={styles.card}>
        <h2 id="cerrar-title" className={styles.cardTitle}>Cerrar el torneo</h2>
        <ul className={styles.checklist}>
          {checks.map((check) => (
            <li key={check.text} className={check.ok ? styles.checkOk : styles.checkTodo}>
              <span aria-hidden>{check.ok ? '✓' : '!'}</span>
              <span>{check.text}</span>
              {!check.ok && check.go && (
                <button type="button" className={styles.link} onClick={() => onGo(check.go!)}>Ir</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Tabla final</h3>
        {fixture.rounds.length === 0 ? (
          <p className={styles.hint}>Aparecerá cuando haya rondas guardadas.</p>
        ) : standings.isPending ? (
          <p className={styles.hint}>Calculando…</p>
        ) : (
          <ol className={styles.standings}>
            {(standings.data ?? []).map((standing, index) => (
              <li key={standing.id}>
                <span className={styles.position}>{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</span>
                <span className={styles.standingName}>{standing.name}</span>
                <span className={styles.muted}>{standing.wins}-{standing.ties}-{standing.losses}</span>
                <strong>{standing.points} pts</strong>
              </li>
            ))}
          </ol>
        )}
        <p className={styles.hint}>Así quedará en el historial. Archivar copia rondas, partidas y esta tabla, y deja el torneo inactivo.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => setPending('archive')} disabled={busy}>
            Archivar torneo
          </button>
        </div>
      </div>

      <details className={styles.dangerZone}>
        <summary>Zona de peligro</summary>
        <p className={styles.hint}>Estas acciones borran datos del torneo activo y no se pueden deshacer.</p>
        <div className={styles.dangerActions}>
          <div className={styles.withTip}>
            <button type="button" className={styles.dangerOutline} onClick={() => setPending('clearFixture')} disabled={busy}>
              Borrar rondas y marcadores
            </button>
            <InfoTip label="Qué hace Borrar rondas y marcadores">
              <strong>Borra:</strong> todas las rondas del torneo activo, con sus cruces y marcadores.
              <br /><strong>Mantiene:</strong> el torneo (nombre, fechas, formato), los jugadores inscritos y sus razas.
              <br />Sirve para rehacer el fixture desde cero. No se puede deshacer.
            </InfoTip>
          </div>
          <div className={styles.withTip}>
            <button type="button" className={styles.dangerOutline} onClick={() => setPending('clearRoster')} disabled={busy}>
              Quitar jugadores y rondas
            </button>
            <InfoTip label="Qué hace Quitar jugadores y rondas">
              <strong>Quita la inscripción</strong> de todos los jugadores en este torneo y borra sus razas de este torneo, además de las rondas y marcadores.
              <br /><strong>No borra</strong> a los jugadores del sistema, sus perfiles, ni sus razas o resultados de torneos anteriores. El torneo sigue activo, sin jugadores.
              <br />No se puede deshacer.
            </InfoTip>
          </div>
        </div>
      </details>

      {pending === 'archive' && (
        <ConfirmDialog title="¿Archivar el torneo?" confirmLabel="Archivar" busy={busy} onCancel={() => setPending(null)} onConfirm={confirm}>
          {!ready && <p className={styles.warnText}>Ojo: {checks.filter((check) => !check.ok).map((check) => check.text.toLowerCase()).join(', ')}.</p>}
          <p>El torneo pasará al historial con la tabla final actual y dejará de estar activo.</p>
        </ConfirmDialog>
      )}
      {pending === 'clearFixture' && (
        <ConfirmDialog title="¿Borrar rondas y marcadores?" confirmLabel="Borrar" tone="danger" busy={busy} onCancel={() => setPending(null)} onConfirm={confirm}>
          Se borrarán {fixture.rounds.length} rondas y {matches.length} partidas con sus marcadores. El torneo, los jugadores y sus razas se mantienen.
        </ConfirmDialog>
      )}
      {pending === 'clearRoster' && (
        <ConfirmDialog title="¿Quitar jugadores y rondas?" confirmLabel="Quitar y borrar" tone="danger" busy={busy} onCancel={() => setPending(null)} onConfirm={confirm}>
          Se quitarán los {rosterIds.length} jugadores inscritos y se borrarán sus razas, las rondas y los marcadores. El torneo sigue activo, sin jugadores.
        </ConfirmDialog>
      )}
    </section>
  );
}
