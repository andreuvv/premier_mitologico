import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (error) {
        setMessage('El enlace no es válido o ya expiró.');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setMessage('¡Cuenta confirmada! Redirigiendo...');
        setTimeout(() => navigate('/'), 1500);
      }
    });
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
