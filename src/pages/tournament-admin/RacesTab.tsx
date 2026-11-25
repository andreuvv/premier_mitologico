import { tournamentAdminAPI } from '../../services/tournamentAdminService';
import { raceChoices, raceComplete, raceSides } from './adminUtils';
import { Progress, SaveBar } from './ui';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

/** "Razas": both races of every player, saved together. */
export default function RacesTab({ admin }: { admin: TournamentAdminState }) {
  const {
    savedForm, rosterIds, raceFor, setRace, changedRaceIds, raceDrafts, discardRaces,
    subformatName, playerName, busy, run,
  } = admin;
  if (!savedForm) return null;

  const [side1, side2] = raceSides(savedForm.format);
  const label1 = subformatName(savedForm.subformat1Id) ?? 'Subformato 1';
  const label2 = subformatName(savedForm.subformat2Id) ?? 'Subformato 2';
  const head1 = savedForm.format === 'PBFX' ? `PB · ${label1}` : label1;
  const head2 = savedForm.format === 'PBFX' ? `FX · ${label2}` : label2;
  const completeCount = rosterIds.filter((id) => raceComplete(raceFor(id))).length;
  const sortedIds = [...rosterIds].sort((a, b) => playerName(a).localeCompare(playerName(b), 'es'));

  const save = () => run(async () => {
    for (const playerId of changedRaceIds) {
      const race = raceDrafts[playerId];
      await tournamentAdminAPI.saveRace(playerId, race.race1, race.race2);
    }
    discardRaces();
  }, changedRaceIds.length === 1 ? 'Raza guardada' : `${changedRaceIds.length} jugadores guardados`);

  return (
    <section className={styles.stack} aria-labelledby="razas-title">
      <div className={styles.card}>
        <h2 id="razas-title" className={styles.cardTitle}>Razas del torneo</h2>
        <Progress value={completeCount} total={rosterIds.length} label="Jugadores con sus dos razas" />
        <p className={styles.hint}>
          {savedForm.format === 'PBFX'
            ? 'La primera raza es de Primer Bloque y la segunda de Furia.'
            : `Solo se listan razas de ${savedForm.format === 'FX' ? 'Furia Extendido' : 'Primer Bloque'}.`}
          {' '}Los cambios se guardan todos juntos.
        </p>
      </div>

      {rosterIds.length === 0 && <p className={styles.empty}>No hay jugadores en el torneo.</p>}

      <ul className={styles.raceList}>
        {sortedIds.map((playerId) => {
          const race = raceFor(playerId);
          const changed = playerId in raceDrafts;
          const missing = !raceComplete(race);
          const className = [styles.raceItem, changed ? styles.itemChanged : '', missing && !changed ? styles.itemMissing : '']
            .filter(Boolean).join(' ');
          return (
            <li key={playerId} className={className}>
              <div className={styles.raceName}>
                <strong>{playerName(playerId)}</strong>
                {changed ? <span className={styles.tagChanged}>Sin guardar</span>
                  : missing ? <span className={styles.tagMissing}>Falta raza</span>
                  : <span className={styles.tagOk}>✓</span>}
              </div>
              <label className={styles.raceField}>
                <span>{head1}</span>
                <select value={race.race1} onChange={(e) => setRace(playerId, { race1: e.target.value })}>
                  <option value="">Sin raza</option>
                  {raceChoices(side1, race.race1).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className={styles.raceField}>
                <span>{head2}</span>
                <select value={race.race2} onChange={(e) => setRace(playerId, { race2: e.target.value })}>
                  <option value="">Sin raza</option>
                  {raceChoices(side2, race.race2).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
            </li>
          );
        })}
      </ul>

      {changedRaceIds.length > 0 && (
        <SaveBar
          text={`${changedRaceIds.length} ${changedRaceIds.length === 1 ? 'cambio' : 'cambios'}`}
          saveLabel="Guardar razas"
          onSave={save}
          onDiscard={discardRaces}
          busy={busy}
        />
      )}
    </section>
  );
}
