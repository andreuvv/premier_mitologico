import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verificando...');

  useEffect(() => {
    let handled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const params = new URLSearchParams(window.location.search);
    const isRecoveryUrl = params.get('type') === 'recovery';

    const goToReset = (sub: { unsubscribe: () => void }) => {
      handled = true;
      sub.unsubscribe();
      clearTimeout(timeout);
      sessionStorage.setItem('myl_password_recovery', '1');
      navigate('/reset-password', { replace: true });
    };

    const goToError = (sub: { unsubscribe: () => void }) => {
      handled = true;
      sub.unsubscribe();
      clearTimeout(timeout);
      setMessage('El enlace no es válido o ya expiró.');
      supabase.auth.signOut();
      setTimeout(() => navigate('/'), 3000);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;

      if (event === 'PASSWORD_RECOVERY') {
        goToReset(subscription);
      } else if (event === 'SIGNED_IN') {
        // With PKCE, Supabase sometimes fires SIGNED_IN instead of
        // PASSWORD_RECOVERY for recovery links — use URL type as fallback.
        if (isRecoveryUrl) {
          goToReset(subscription);
        } else {
          handled = true;
          subscription.unsubscribe();
          clearTimeout(timeout);
          setMessage('¡Cuenta confirmada! Redirigiendo...');
          setTimeout(() => navigate('/'), 1500);
        }
      }
    });

    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error && !handled) {
          goToError(subscription);
        }
        // Success: onAuthStateChange will handle navigation
      });
    }

    // Fallback timeout
    timeout = setTimeout(() => {
      if (!handled) goToError(subscription);
    }, 8000);

    return () => {
      handled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--beige)',
      fontFamily: "'Roboto', sans-serif",
      fontSize: '1rem',
    }}>
      {message}
    </div>
  );
}
