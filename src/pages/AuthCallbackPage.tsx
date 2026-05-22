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

    const goToReset = () => {
      if (handled) return;
      handled = true;
      subscription?.unsubscribe();
      clearTimeout(timeout);
      sessionStorage.setItem('myl_password_recovery', '1');
      navigate('/reset-password', { replace: true });
    };

    const goToConfirmed = () => {
      if (handled) return;
      handled = true;
      subscription?.unsubscribe();
      clearTimeout(timeout);
      setMessage('¡Cuenta confirmada! Redirigiendo...');
      setTimeout(() => navigate('/'), 1500);
    };

    const goToError = () => {
      if (handled) return;
      handled = true;
      subscription?.unsubscribe();
      clearTimeout(timeout);
      setMessage('El enlace no es válido o ya expiró.');
      supabase.auth.signOut();
      setTimeout(() => navigate('/'), 3000);
    };

    // Subscribe to catch events fired AFTER the component mounts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;
      if (event === 'PASSWORD_RECOVERY') {
        goToReset();
      } else if (event === 'SIGNED_IN') {
        // With PKCE, Supabase sometimes fires SIGNED_IN for recovery links.
        if (isRecoveryUrl) goToReset();
        else goToConfirmed();
      }
    });

    // Fallback: with detectSessionInUrl=true (PKCE default), Supabase may have
    // already auto-processed the ?code= and fired the event BEFORE this
    // component mounted. Check the current session directly.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (handled || !session) return;
      if (isRecoveryUrl) goToReset();
      else goToConfirmed();
    });

    // Final fallback timeout
    timeout = setTimeout(() => { if (!handled) goToError(); }, 8000);

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
