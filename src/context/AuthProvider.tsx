import { useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AuthContext } from './authContext';
import { leakedPasswordError } from '../utils/passwordSecurity';

/** true/false when the email is (not) on the whitelist, null on error. */
async function isEmailAllowed(email: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('is_email_allowed', { p_email: email.toLowerCase().trim() });
  if (error) return null;
  return data === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string): Promise<{ error: string | null }> => {
    // Check whitelist before attempting registration (the DB enforces it too).
    const allowed = await isEmailAllowed(email);
    if (allowed === null) return { error: 'Error al verificar el acceso. Intenta de nuevo.' };
    if (!allowed) return { error: 'Este correo no está autorizado para crear una cuenta.' };

    const leaked = await leakedPasswordError(password);
    if (leaked) return { error: leaked };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      if (error.message.includes('Database error saving new user')) {
        return { error: 'Este correo no está autorizado para crear una cuenta.' };
      }
      return { error: error.message };
    }

    // Profile is created automatically by a DB trigger (handle_new_user)
    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
