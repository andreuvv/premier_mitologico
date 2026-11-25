import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useUserDecks, type UserDeck } from '../../hooks/useUserDecks';
import { loadProfileById, loadProfileByUsername, type UserProfile } from '../../hooks/useUserProfile';
import { fixtureAPI } from '../../services/fixtureAPI';

/**
 * Loads the profile shown on the page (own profile without a username, or a
 * public one by username), its visible decks and the linked premier player name.
 */
export function useProfileData(usernameParam: string | undefined, user: User | null, authLoading: boolean) {
  const { loadDecks } = useUserDecks();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [premierPlayerName, setPremierPlayerName] = useState<string | null>(null);

  const isOwner = Boolean(user && profile && user.id === profile.id);

  const loadProfileData = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);

    if (!usernameParam) {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      const own = await loadProfileById(user.id);
      setProfile(own);
      if (!own) setProfileError('No se encontró tu perfil.');
      setProfileLoading(false);
      return;
    }

    const loaded = await loadProfileByUsername(usernameParam);
    if (!loaded) {
      setProfileError('Perfil no encontrado.');
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (!loaded.is_public && loaded.id !== user?.id) {
      setProfileError('Este perfil es privado.');
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfile(loaded);
    setProfileLoading(false);
  }, [usernameParam, user]);

  useEffect(() => {
    if (authLoading) return;
    loadProfileData();
  }, [authLoading, loadProfileData]);

  useEffect(() => {
    if (!profile) {
      setDecks([]);
      setPremierPlayerName(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const allDecks = await loadDecks(profile.id);
      const visible = isOwner
        ? allDecks.filter((d) => !d.is_draft)
        : allDecks.filter((d) => d.is_public && !d.is_draft);
      if (!cancelled) setDecks(visible);

      if (profile.premier_player_id) {
        try {
          const players = await fixtureAPI.getPremierPlayers();
          const player = players.find((p) => p.id === profile.premier_player_id);
          if (!cancelled) setPremierPlayerName(player?.name ?? null);
        } catch {
          if (!cancelled) setPremierPlayerName(null);
        }
      } else if (!cancelled) {
        setPremierPlayerName(null);
      }
    })();

    return () => { cancelled = true; };
  }, [profile, isOwner, loadDecks]);

  return { profile, setProfile, profileLoading, profileError, decks, premierPlayerName, isOwner };
}
