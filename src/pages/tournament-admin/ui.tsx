import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Toast } from './useTournamentAdmin';
import styles from '../TournamentAdminPage.module.css';

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: 'normal' | 'large';
}

/** A row of mutually exclusive buttons (radio group). */
export function Segmented<T extends string | number>({ label, value, options, onChange, disabled, size = 'normal' }: SegmentedProps<T>) {
  return (
    <div className={size === 'large' ? `${styles.segmented} ${styles.segmentedLarge}` : styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={option.value === value ? styles.segmentOn : styles.segment}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SaveBarProps {
  text: ReactNode;
  saveLabel: string;
  onSave: () => void;
  onDiscard?: () => void;
  busy: boolean;
  saveDisabled?: boolean;
}

/** Sticky bar at the bottom of a step with its unsaved changes and the save button. */
export function SaveBar({ text, saveLabel, onSave, onDiscard, busy, saveDisabled }: SaveBarProps) {
  return (
    <div className={styles.saveBar} role="region" aria-label="Cambios sin guardar">
      <span className={styles.saveBarText}>{text}</span>
      <div className={styles.saveBarActions}>
        {onDiscard && (
          <button type="button" className={styles.ghost} onClick={onDiscard} disabled={busy}>
            Descartar
          </button>
        )}
        <button type="button" className={styles.primary} onClick={onSave} disabled={busy || saveDisabled}>
          {busy ? 'Guardando…' : saveLabel}
        </button>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal confirmation for actions that replace or delete data. */
export function ConfirmDialog({ title, children, confirmLabel, tone = 'primary', busy, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className={styles.dialogBackdrop} onClick={onCancel}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="admin-dialog-title" className={styles.dialogTitle}>{title}</h2>
        <div className={styles.dialogBody}>{children}</div>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghost} onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className={tone === 'danger' ? styles.danger : styles.primary} onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Floating result message; successes hide themselves, errors stay until closed. */
export function ToastView({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast || toast.kind === 'error') return undefined;
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className={toast.kind === 'error' ? `${styles.toast} ${styles.toastError}` : styles.toast}
      role={toast.kind === 'error' ? 'alert' : 'status'}
    >
      <span>{toast.kind === 'error' ? '⚠ ' : '✓ '}{toast.text}</span>
      <button type="button" className={styles.toastClose} onClick={onClose} aria-label="Cerrar aviso">✕</button>
    </div>
  );
}

/** Progress bar with an accessible label. */
export function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={styles.progress}>
      <div className={styles.progressHead}>
        <span>{label}</span>
        <strong>{value}/{total}</strong>
      </div>
      <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={label}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

interface InfoTipProps {
  /** Accessible name of the ⓘ button, e.g. "Qué hace Borrar todas". */
  label: string;
  children: ReactNode;
  /** Which side of the button the bubble lines up with, so it stays on screen. */
  align?: 'start' | 'end';
}

/**
 * ⓘ button with an explanation bubble. Opens on hover where there is a mouse,
 * and on tap/click everywhere (phones have no hover). Escape or a tap outside closes it.
 */
export function InfoTip({ label, children, align = 'start' }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  // An open bubble is placed against the screen (position: fixed), never the page:
  // a bubble sticking out of the page widens it on phones and pushes the fixed
  // bottom bar out of reach. It goes under the ⓘ, or above it if there's no room,
  // and follows the ⓘ while the page scrolls or the phone's address bar moves.
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const anchor = wrapRef.current;
    if (!tip || !anchor) return undefined;
    if (!open) {
      tip.removeAttribute('style');
      return undefined;
    }
    const place = () => {
      const margin = 8;
      const screenWidth = document.documentElement.clientWidth;
      const width = Math.min(300, screenWidth - margin * 2);
      const button = anchor.getBoundingClientRect();
      const preferredLeft = align === 'end' ? button.right + margin - width : button.left - margin;
      const left = Math.max(margin, Math.min(preferredLeft, screenWidth - margin - width));
      Object.assign(tip.style, { position: 'fixed', width: `${width}px`, left: `${left}px`, right: 'auto', top: `${button.bottom + margin}px` });
      const height = tip.getBoundingClientRect().height;
      const bottomBar = document.querySelector('nav[aria-label="Etapas del torneo"]');
      const limit = bottomBar && getComputedStyle(bottomBar).position === 'fixed'
        ? bottomBar.getBoundingClientRect().top
        : window.innerHeight;
      if (button.bottom + margin + height > limit - margin && button.top - margin - height > margin) {
        tip.style.top = `${button.top - margin - height}px`;
      }
    };
    place();
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={open ? `${styles.tipWrap} ${styles.tipOpen}` : styles.tipWrap}>
      <button
        type="button"
        className={styles.tipButton}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={tipId}
        onClick={() => setOpen((value) => !value)}
      >
        i
      </button>
      <span ref={tipRef} id={tipId} role="tooltip" className={align === 'end' ? `${styles.tip} ${styles.tipEnd}` : styles.tip}>
        {children}
      </span>
    </span>
  );
}
