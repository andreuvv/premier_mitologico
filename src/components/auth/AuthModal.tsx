import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  onClose: () => void;
}

type Mode = 'login' | 'register';

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(translateError(error));
      } else {
        onClose();
      }
    } else {
      if (username.trim().length < 3) {
        setError('El nombre de usuario debe tener al menos 3 caracteres.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim());
      if (error) {
        setError(translateError(error));
      } else {
        setSuccessMessage('¡Cuenta creada! Revisa tu correo para confirmar tu email.');
      }
    }

    setLoading(false);
  };

  const translateError = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
    if (msg.includes('Email not confirmed')) return 'Debes confirmar tu email. ¿Quieres que te reenviemos el correo?';
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.';
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    return msg;
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Ingresa tu email primero.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (error) {
      setError('No se pudo reenviar el correo. Intenta de nuevo.');
    } else {
      setSuccessMessage('Correo de confirmación reenviado. Revisa tu bandeja de entrada po.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">✕</button>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => { setMode('register'); setError(null); setSuccessMessage(null); }}
          >
            Crear Cuenta
          </button>
        </div>

        {successMessage ? (
          <div className={styles.successMessage}>
            <p>{successMessage}</p>
            <button className={styles.submitButton} onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label htmlFor="username">Nombre de usuario</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="tu_nombre"
                  autoComplete="username"
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {error && (
              <div>
                <p className={styles.errorMessage}>{error}</p>
                {error.includes('reenviemos') && (
                  <button
                    type="button"
                    className={styles.resendButton}
                    onClick={handleResendConfirmation}
                    disabled={loading}
                  >
                    Reenviar correo de confirmación
                  </button>
                )}
              </div>
            )}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
