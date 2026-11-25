import { useEffect, useState } from 'react';
import { FaPen, FaTrashAlt } from 'react-icons/fa';
import { tournamentAdminAPI } from '../../services/tournamentAdminService';
import type { VenueRow } from '../../services/tournamentQueries';
import type { TournamentAdminState } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

interface VenuesDialogProps {
  admin: TournamentAdminState;
  onClose: () => void;
}

type Mode = { kind: 'view' } | { kind: 'edit'; id: number } | { kind: 'delete'; id: number };

/**
 * Saved places: edit, delete and add. Tournaments keep their own copy of the
 * name and address, so these changes never rewrite past tournaments. If the
 * place being edited is the one in the tournament form, the form follows it.
 */
export default function VenuesDialog({ admin, onClose }: VenuesDialogProps) {
  const { venues, form, updateForm, busy, run, notify } = admin;
  const [mode, setMode] = useState<Mode>({ kind: 'view' });
  const [draft, setDraft] = useState({ name: '', address: '' });
  const [newVenue, setNewVenue] = useState({ name: '', address: '' });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const inForm = (venue: VenueRow) => venue.name === form.locationName && venue.address === form.locationAddress;

  const startEdit = (venue: VenueRow) => {
    setDraft({ name: venue.name, address: venue.address });
    setMode({ kind: 'edit', id: venue.id });
  };

  const saveEdit = async (venue: VenueRow) => {
    const name = draft.name.trim();
    const address = draft.address.trim();
    if (!name || !address) {
      notify('error', 'El lugar necesita nombre y dirección.');
      return;
    }
    const wasSelected = inForm(venue);
    const ok = await run(
      () => tournamentAdminAPI.updateVenue(venue.id, name, address),
      wasSelected ? `"${name}" actualizado. Guarda el torneo para usar los datos nuevos.` : `"${name}" actualizado`,
    );
    if (!ok) return;
    if (wasSelected) updateForm({ locationName: name, locationAddress: address });
    setMode({ kind: 'view' });
  };

  const confirmDelete = async (venue: VenueRow) => {
    const ok = await run(() => tournamentAdminAPI.deleteVenue(venue.id), `"${venue.name}" se quitó de la lista`);
    if (ok) setMode({ kind: 'view' });
  };

  const add = async () => {
    const name = newVenue.name.trim();
    const address = newVenue.address.trim();
    if (!name || !address) {
      notify('error', 'El lugar necesita nombre y dirección.');
      return;
    }
    const ok = await run(() => tournamentAdminAPI.createVenue(name, address), `"${name}" quedó en la lista de lugares`);
    if (ok) setNewVenue({ name: '', address: '' });
  };

  return (
    <div className={styles.dialogBackdrop} onClick={() => !busy && onClose()}>
      <div
        className={`${styles.dialog} ${styles.dialogWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="venues-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.cardHead}>
          <h2 id="venues-title" className={styles.dialogTitle}>Lugares guardados</h2>
          <button type="button" className={styles.toastClose} onClick={onClose} aria-label="Cerrar" disabled={busy}>✕</button>
        </div>
        <p className={styles.hintTight}>Cambiar o borrar un lugar no modifica los torneos que ya lo usaron.</p>

        {venues.length === 0 && <p className={styles.empty}>Todavía no hay lugares guardados.</p>}

        <ul className={styles.venueList}>
          {venues.map((venue) => {
            const editing = mode.kind === 'edit' && mode.id === venue.id;
            const deleting = mode.kind === 'delete' && mode.id === venue.id;
            return (
              <li key={venue.id} className={styles.venueItem}>
                {editing ? (
                  <div className={styles.venueEdit}>
                    <label>
                      <span>Nombre</span>
                      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
                    </label>
                    <label>
                      <span>Dirección</span>
                      <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                    </label>
                    <div className={styles.venueButtons}>
                      <button type="button" className={styles.ghost} onClick={() => setMode({ kind: 'view' })} disabled={busy}>Cancelar</button>
                      <button type="button" className={styles.primary} onClick={() => saveEdit(venue)} disabled={busy}>
                        {busy ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.venueText}>
                      <strong>{venue.name}</strong>
                      {inForm(venue) && <span className={styles.tagOk}>En este torneo</span>}
                      <span className={styles.muted}>{venue.address}</span>
                    </div>
                    {deleting ? (
                      <div className={styles.venueConfirm}>
                        <span>¿Quitar de la lista?</span>
                        <div className={styles.venueButtons}>
                          <button type="button" className={styles.ghost} onClick={() => setMode({ kind: 'view' })} disabled={busy}>No</button>
                          <button type="button" className={styles.danger} onClick={() => confirmDelete(venue)} disabled={busy}>
                            {busy ? 'Borrando…' : 'Sí, borrar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.venueButtons}>
                        <button type="button" className={styles.iconButton} onClick={() => startEdit(venue)} aria-label={`Editar ${venue.name}`} title="Editar" disabled={busy}>
                          <FaPen aria-hidden />
                        </button>
                        <button type="button" className={styles.iconDanger} onClick={() => setMode({ kind: 'delete', id: venue.id })} aria-label={`Borrar ${venue.name}`} title="Borrar" disabled={busy}>
                          <FaTrashAlt aria-hidden />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <div className={styles.venueAdd}>
          <h3 className={styles.fieldLabel}>Agregar lugar</h3>
          <div className={styles.venueEdit}>
            <label>
              <span>Nombre</span>
              <input value={newVenue.name} onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })} placeholder="Ej: Casa de Troke" />
            </label>
            <label>
              <span>Dirección</span>
              <input value={newVenue.address} onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })} placeholder="Calle 123, Comuna, Santiago" />
            </label>
            <div className={styles.venueButtons}>
              <button type="button" className={styles.secondary} onClick={add} disabled={busy || !newVenue.name.trim() || !newVenue.address.trim()}>
                Agregar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
