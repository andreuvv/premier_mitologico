import { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { tournamentAdminAPI } from '../../services/tournamentAdminService';
import { MONTHS, monthYearOf, type TournamentFormat, type TournamentType } from './adminUtils';
import { SaveBar, Segmented } from './ui';
import VenuesDialog from './VenuesDialog';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

interface TournamentTabProps {
  admin: TournamentAdminState;
  reloadPublicCard: () => unknown;
}

/** "Torneo": name, dates, place, format and roster of the active tournament. */
export default function TournamentTab({ admin, reloadPublicCard }: TournamentTabProps) {
  const { activeId, players, subformats, venues, form, updateForm, formDirty, discardForm, busy, run, notify, fixture } = admin;
  // "Otro lugar…" stays open while typing, even before the text matches anything.
  const [typingPlace, setTypingPlace] = useState(false);
  const [managingVenues, setManagingVenues] = useState(false);
  const matchedVenue = venues.find((venue) => venue.name === form.locationName && venue.address === form.locationAddress);
  const placeChoice = typingPlace
    ? 'other'
    : matchedVenue ? String(matchedVenue.id)
    : form.locationName || form.locationAddress ? 'other' : '';
  const selectedVenue = placeChoice === 'other' ? undefined : matchedVenue;

  const choosePlace = (value: string) => {
    if (value === 'other') {
      setTypingPlace(true);
      if (matchedVenue) updateForm({ locationName: '', locationAddress: '' });
      return;
    }
    setTypingPlace(false);
    const venue = venues.find((item) => String(item.id) === value);
    updateForm({ locationName: venue?.name ?? '', locationAddress: venue?.address ?? '' });
  };

  const saveVenue = async () => {
    const ok = await run(
      () => tournamentAdminAPI.createVenue(form.locationName, form.locationAddress),
      `"${form.locationName.trim()}" quedó en la lista de lugares`,
    );
    if (ok) {
      updateForm({ locationName: form.locationName.trim(), locationAddress: form.locationAddress.trim() });
      setTypingPlace(false);
    }
  };
  const isNew = activeId === null;
  const hasFixture = fixture.rounds.length > 0;
  const selected = new Set(form.playerIds);

  const togglePlayer = (playerId: number) => {
    updateForm({
      playerIds: selected.has(playerId)
        ? form.playerIds.filter((id) => id !== playerId)
        : [...form.playerIds, playerId],
    });
  };

  const changeStartDate = (startDate: string) => {
    const monthYear = monthYearOf(startDate);
    updateForm({
      startDate,
      ...(monthYear ?? {}),
      // Keep the end date valid when the start moves past it.
      ...(form.endDate && startDate && form.endDate < startDate ? { endDate: startDate } : {}),
    });
  };

  const save = async () => {
    if (!form.name.trim()) {
      notify('error', 'Ponle un nombre al torneo.');
      return;
    }
    if (form.playerIds.length < 2) {
      notify('error', 'Elige al menos 2 jugadores.');
      return;
    }
    const input = {
      name: form.name.trim(),
      month: form.month,
      year: form.year,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      format: form.format,
      subformat1Id: form.subformat1Id,
      subformat2Id: form.subformat2Id,
      tournamentType: form.tournamentType,
      playerIds: form.playerIds,
      locationName: form.locationName.trim() || null,
      locationAddress: form.locationAddress.trim() || null,
    };
    admin.acceptFormFromServer();
    const ok = await run(async () => {
      if (isNew) await tournamentAdminAPI.createTournament(input);
      else await tournamentAdminAPI.updateTournament(input);
      await reloadPublicCard();
    }, isNew ? 'Torneo creado' : 'Cambios guardados');
    if (!ok) updateForm({});
  };

  const subformatOptions = subformats.map((subformat) => (
    <option key={subformat.subformat_id} value={subformat.subformat_id}>{subformat.subformat_name}</option>
  ));

  return (
    <section className={styles.stack} aria-labelledby="torneo-title">
      <h2 id="torneo-title" className={styles.srOnly}>Datos del torneo</h2>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Datos</h3>
        <div className={styles.fields}>
          <label className={styles.fieldWide}>
            <span>Nombre</span>
            <input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="Ej: Premier Diciembre" />
          </label>
          <label>
            <span>Inicio</span>
            <input type="date" value={form.startDate} onChange={(e) => changeStartDate(e.target.value)} />
          </label>
          <label>
            <span>Fin</span>
            <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => updateForm({ endDate: e.target.value })} />
          </label>
          <label>
            <span>Mes</span>
            <select value={form.month} onChange={(e) => updateForm({ month: e.target.value })}>
              {MONTHS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Año</span>
            <input type="number" inputMode="numeric" value={form.year} onChange={(e) => updateForm({ year: Number(e.target.value) })} />
          </label>
          <div className={`${styles.fieldWide} ${styles.placeField}`}>
            <div className={styles.labelRow}>
              <label htmlFor="torneo-lugar">Lugar</label>
              <button type="button" className={styles.link} onClick={() => setManagingVenues(true)}>
                Administrar lugares
              </button>
            </div>
            <select id="torneo-lugar" value={placeChoice} onChange={(e) => choosePlace(e.target.value)}>
              <option value="">Sin lugar</option>
              {venues.map((venue) => (
                <option key={venue.id} value={String(venue.id)}>{venue.name}</option>
              ))}
              <option value="other">Otro lugar…</option>
            </select>
          </div>
          {placeChoice === 'other' ? (
            <div className={styles.customPlace}>
              <label>
                <span>Nombre del lugar</span>
                <input value={form.locationName} onChange={(e) => updateForm({ locationName: e.target.value })} placeholder="Ej: Casa de Troke" />
              </label>
              <label>
                <span>Dirección</span>
                <input value={form.locationAddress} onChange={(e) => updateForm({ locationAddress: e.target.value })} placeholder="Calle 123, Comuna, Santiago" />
              </label>
              <button
                type="button"
                className={styles.secondary}
                onClick={saveVenue}
                disabled={busy || !form.locationName.trim() || !form.locationAddress.trim()}
              >
                Guardar en la lista de lugares
              </button>
            </div>
          ) : selectedVenue ? (
            <p className={`${styles.fieldWide} ${styles.placeAddress}`}>
              <FaMapMarkerAlt aria-hidden /> {selectedVenue.address}
            </p>
          ) : null}
        </div>
        <p className={styles.hint}>El mes y el año se completan solos al elegir la fecha de inicio.</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Formato</h3>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Bloque</span>
          <Segmented<TournamentFormat>
            label="Bloque"
            value={form.format}
            onChange={(format) => updateForm({ format })}
            options={[
              { value: 'PB', label: 'Primer Bloque' },
              { value: 'FX', label: 'Furia Ext.' },
              { value: 'PBFX', label: 'PB + FX' },
            ]}
          />
        </div>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Tipo</span>
          <Segmented<TournamentType>
            label="Tipo de torneo"
            value={form.tournamentType}
            onChange={(tournamentType) => updateForm({ tournamentType })}
            options={[
              { value: 'premier_mitoxico', label: 'Premier Mitóxico' },
              { value: 'special_event', label: 'Evento especial' },
            ]}
          />
        </div>
        <div className={styles.fields}>
          <label className={styles.fieldWide}>
            <span>{form.format === 'PBFX' ? 'Subformato PB' : 'Subformato 1'}</span>
            <select value={form.subformat1Id} onChange={(e) => updateForm({ subformat1Id: Number(e.target.value) })}>{subformatOptions}</select>
          </label>
          <label className={styles.fieldWide}>
            <span>{form.format === 'PBFX' ? 'Subformato FX' : 'Subformato 2'}</span>
            <select value={form.subformat2Id} onChange={(e) => updateForm({ subformat2Id: Number(e.target.value) })}>{subformatOptions}</select>
          </label>
        </div>
        <p className={styles.hint}>
          {form.format === 'PBFX'
            ? 'Las rondas alternan PB y FX.'
            : 'Las rondas alternan los dos subformatos, empezando por el primero.'}
          {hasFixture && ' Con rondas guardadas no se puede cambiar el bloque: limpia el fixture primero.'}
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>Jugadores <span className={styles.count}>{form.playerIds.length}</span></h3>
          <div className={styles.inlineActions}>
            <button type="button" className={styles.link} onClick={() => updateForm({ playerIds: players.map((p) => p.id) })}>Todos</button>
            <button type="button" className={styles.link} onClick={() => updateForm({ playerIds: [] })}>Ninguno</button>
          </div>
        </div>
        <div className={styles.playerGrid}>
          {players.map((player) => {
            const on = selected.has(player.id);
            return (
              <button
                key={player.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                className={on ? styles.playerOn : styles.player}
                onClick={() => togglePlayer(player.id)}
              >
                <span className={styles.playerCheck} aria-hidden>{on ? '✓' : ''}</span>
                {player.name}
              </button>
            );
          })}
        </div>
        {hasFixture && <p className={styles.hint}>No se puede quitar a un jugador que ya tiene partidas.</p>}
      </div>

      {managingVenues && <VenuesDialog admin={admin} onClose={() => setManagingVenues(false)} />}

      {(isNew || formDirty) && (
        <SaveBar
          text={isNew ? `${form.playerIds.length} jugador${form.playerIds.length === 1 ? '' : 'es'}` : 'Cambios sin guardar'}
          saveLabel={isNew ? 'Crear torneo' : 'Guardar cambios'}
          onSave={save}
          onDiscard={isNew ? undefined : discardForm}
          busy={busy}
        />
      )}
    </section>
  );
}
