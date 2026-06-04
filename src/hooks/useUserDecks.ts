import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export interface UserDeck {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  is_draft: boolean;
  format: 'pb' | 'fx';
  subformat: string;
  race: string;
  headerImageUrl?: string;
  headerZoom: number;
  headerPosX: number;
  headerPosY: number;
  cards: Record<number, number>;
  created_at: string;
  updated_at: string;
}

export interface PublicDeck extends UserDeck {
  authorName: string;
}

interface RawDeckRow {
  id: string;
  user_id: string;
  name: string;
  is_public?: boolean;
  format: string;
  cards: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// cards JSONB layout stored in Supabase:
// { "_meta": { "subformat": "pb-edicion", "race": "Guerrero" }, "12345": 2, ... }
function parseRow(row: RawDeckRow): UserDeck {
  const { _meta, ...cardEntries } = row.cards as Record<string, unknown>;
  const meta = (_meta as {
    subformat?: string;
    race?: string;
    draft?: boolean;
    headerImageUrl?: string;
    headerZoom?: number;
    headerPosX?: number;
    headerPosY?: number;
  }) ?? {};
  const cards: Record<number, number> = {};
  for (const [k, v] of Object.entries(cardEntries)) {
    const id = Number(k);
    if (!isNaN(id) && typeof v === 'number') cards[id] = v;
  }
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    is_public: row.is_public ?? false,
    is_draft: meta.draft ?? false,
    format: row.format as 'pb' | 'fx',
    subformat: meta.subformat ?? '',
    race: meta.race ?? '',
    headerImageUrl: meta.headerImageUrl,
    headerZoom: typeof meta.headerZoom === 'number' ? meta.headerZoom : 1,
    headerPosX: typeof meta.headerPosX === 'number' ? meta.headerPosX : 50,
    headerPosY: typeof meta.headerPosY === 'number' ? meta.headerPosY : 50,
    cards,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildCardsJson(
  cards: Record<number, number>,
  subformat: string,
  race: string,
  isDraft: boolean,
  headerImageUrl?: string,
  headerZoom = 1,
  headerPosX = 50,
  headerPosY = 50,
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    _meta: {
      subformat,
      race,
      draft: isDraft,
      ...(headerImageUrl ? { headerImageUrl } : {}),
      headerZoom,
      headerPosX,
      headerPosY,
    },
  };
  for (const [id, count] of Object.entries(cards)) {
    if (count > 0) result[id] = count;
  }
  return result;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useUserDecks() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Save (insert or update) a deck. Returns the deck id on success. */
  const saveDeck = useCallback(async (options: {
    deckId: string | null;
    userId: string;
    name: string;
    isPublic: boolean;
    isDraft: boolean;
    headerImageUrl?: string;
    headerZoom?: number;
    headerPosX?: number;
    headerPosY?: number;
    format: 'pb' | 'fx';
    subformat: string;
    race: string;
    cards: Record<number, number>;
  }): Promise<string | null> => {
    setSaveStatus('saving');
    setSaveError(null);

    const cardsJson = buildCardsJson(
      options.cards,
      options.subformat,
      options.race,
      options.isDraft,
      options.headerImageUrl,
      options.headerZoom,
      options.headerPosX,
      options.headerPosY,
    );

    let result;
    if (options.deckId) {
      // Update existing deck
      result = await supabase
        .from('user_decks')
        .update({
          name: options.name,
          cards: cardsJson,
          is_public: options.isDraft ? false : options.isPublic,
        })
        .eq('id', options.deckId)
        .eq('user_id', options.userId)
        .select('id')
        .single();
    } else {
      // Insert new deck
      result = await supabase
        .from('user_decks')
        .insert({
          user_id: options.userId,
          name: options.name,
          is_public: options.isDraft ? false : options.isPublic,
          format: options.format,
          cards: cardsJson,
        })
        .select('id')
        .single();
    }

    if (result.error) {
      setSaveStatus('error');
      setSaveError(result.error.message);
      return null;
    }

    setSaveStatus('saved');
    // Reset to idle after 2.5s
    setTimeout(() => setSaveStatus('idle'), 2500);
    return result.data.id as string;
  }, []);

  /** Load a single deck by id. */
  const loadDeck = useCallback(async (deckId: string): Promise<UserDeck | null> => {
    const { data, error } = await supabase
      .from('user_decks')
      .select('*')
      .eq('id', deckId)
      .single();
    if (error || !data) return null;
    return parseRow(data as RawDeckRow);
  }, []);

  /** Load all decks for a user. */
  const loadDecks = useCallback(async (userId: string): Promise<UserDeck[]> => {
    const { data, error } = await supabase
      .from('user_decks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];
    return (data as RawDeckRow[]).map(parseRow);
  }, []);

  /** Load all public decks from other users, with author username. */
  const loadAllDecks = useCallback(async (excludeUserId?: string): Promise<PublicDeck[]> => {
    let query = supabase
      .from('user_decks')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data: decksData, error } = await query;
    if (error || !decksData || decksData.length === 0) return [];

    const userIds = [...new Set((decksData as RawDeckRow[]).map((d) => d.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const usernameMap = new Map<string, string>(
      ((profilesData ?? []) as { id: string; username: string }[]).map((p) => [p.id, p.username]),
    );

    return (decksData as RawDeckRow[]).map((row) => ({
      ...parseRow(row),
      authorName: usernameMap.get(row.user_id) ?? 'Anónimo',
    }));
  }, []);

  /** Delete a deck by id. */
  const deleteDeck = useCallback(async (deckId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('user_decks')
      .delete()
      .eq('id', deckId);
    return !error;
  }, []);

  return { saveDeck, loadDeck, loadDecks, loadAllDecks, deleteDeck, saveStatus, saveError };
}
