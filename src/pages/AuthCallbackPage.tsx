import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verificando...');

  useEffect(() => {
    let handled = false;

    // onAuthStateChange fires immediately with current state (covers both
    // implicit hash-based flow and PKCE code flow after exchange).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;

      if (event === 'PASSWORD_RECOVERY') {
        handled = true;
        subscription.unsubscribe();
        // Mark this as a legitimate recovery session so ResetPasswordPage
        // can verify the user arrived here via the reset email.
        sessionStorage.setItem('myl_password_recovery', '1');
        navigate('/reset-password', { replace: true });

      } else if (event === 'SIGNED_IN') {
        handled = true;
        subscription.unsubscribe();
        setMessage('¡Cuenta confirmada! Redirigiendo...');
        setTimeout(() => navigate('/'), 1500);
      }
    });

    // For PKCE code-based flow: exchange the code explicitly.
    // onAuthStateChange will then fire with the resulting event.
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error && !handled) {
          handled = true;
          subscription.unsubscribe();
          setMessage('El enlace no es válido o ya expiró.');
          // Sign out in case the client auto-logged in via another mechanism.
          supabase.auth.signOut();
          setTimeout(() => navigate('/'), 3000);
        }
      });
    }

    // Fallback: if neither event fires within 8 seconds, abort.
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true;
        subscription.unsubscribe();
        setMessage('El enlace no es válido o ya expiró.');
        supabase.auth.signOut();
        setTimeout(() => navigate('/'), 3000);
      }
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
