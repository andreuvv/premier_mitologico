import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export interface UserDeck {
  id: string;
  user_id: string;
  name: string;
  format: 'pb' | 'fx';
  subformat: string;
  race: string;
  cards: Record<number, number>;
  created_at: string;
  updated_at: string;
}

interface RawDeckRow {
  id: string;
  user_id: string;
  name: string;
  format: string;
  cards: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// cards JSONB layout stored in Supabase:
// { "_meta": { "subformat": "pb-edicion", "race": "Guerrero" }, "12345": 2, ... }
function parseRow(row: RawDeckRow): UserDeck {
  const { _meta, ...cardEntries } = row.cards as Record<string, unknown>;
  const meta = (_meta as { subformat?: string; race?: string }) ?? {};
  const cards: Record<number, number> = {};
  for (const [k, v] of Object.entries(cardEntries)) {
    const id = Number(k);
    if (!isNaN(id) && typeof v === 'number') cards[id] = v;
  }
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    format: row.format as 'pb' | 'fx',
    subformat: meta.subformat ?? '',
    race: meta.race ?? '',
    cards,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildCardsJson(
  cards: Record<number, number>,
  subformat: string,
  race: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    _meta: { subformat, race },
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
    format: 'pb' | 'fx';
    subformat: string;
    race: string;
    cards: Record<number, number>;
  }): Promise<string | null> => {
    setSaveStatus('saving');
    setSaveError(null);

    const cardsJson = buildCardsJson(options.cards, options.subformat, options.race);

    let result;
    if (options.deckId) {
      // Update existing deck
      result = await supabase
        .from('user_decks')
        .update({ name: options.name, cards: cardsJson })
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

  /** Delete a deck by id. */
  const deleteDeck = useCallback(async (deckId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('user_decks')
      .delete()
      .eq('id', deckId);
    return !error;
  }, []);

  return { saveDeck, loadDecks, deleteDeck, saveStatus, saveError };
}
