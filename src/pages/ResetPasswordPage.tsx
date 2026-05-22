import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Security check: only allow access if user arrived via a PASSWORD_RECOVERY
    // event (flag set by AuthCallbackPage). Prevents a logged-in user from
    // navigating directly to this page to change their password without verification.
    const isRecovery = sessionStorage.getItem('myl_password_recovery') === '1';
    if (!isRecovery) {
      navigate('/', { replace: true });
      return;
    }
    setAuthorized(true);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } else {
      sessionStorage.removeItem('myl_password_recovery');
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'Roboto', sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--dark-brown)',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const titleStyle: React.CSSProperties = {
    margin: '0 0 0.5rem',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--beige)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '0.75rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    color: 'var(--beige)',
    fontSize: '0.82rem',
    fontWeight: 700,
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '4px 4px 0 0',
    color: 'var(--beige)',
    fontSize: '0.9rem',
    padding: '0.6rem 0.75rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const buttonStyle: React.CSSProperties = {
    background: 'var(--sage-green)',
    color: 'var(--dark-brown)',
    border: 'none',
    borderRadius: '4px',
    padding: '0.7rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.4 : 1,
    marginTop: '0.5rem',
  };

  if (!authorized) return null;

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: 'var(--sage-green)', margin: 0, textAlign: 'center' }}>
            ¡Contraseña actualizada! Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <p style={titleStyle}>Nueva contraseña</p>

        <label style={labelStyle}>
          Contraseña
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            required
          />
        </label>

        <label style={labelStyle}>
          Confirmar contraseña
          <input
            type="password"
            style={inputStyle}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            required
          />
        </label>

        {error && (
          <p style={{ color: 'var(--brick-red)', fontSize: '0.82rem', margin: 0 }}>{error}</p>
        )}

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}
