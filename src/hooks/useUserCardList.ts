import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import type { CollectionFormat } from '../types/collection';

// JSONB shape stored in the cards column: { "card_id": 1 } (1 = present)
type CardsJson = Record<string, number>;

function setToJson(ids: Set<number>): CardsJson {
  const obj: CardsJson = {};
  ids.forEach((id) => { obj[String(id)] = 1; });
  return obj;
}

/**
 * Generic hook for presence-based card lists (favorites, wishlist).
 * Mirrors useUserCollection but stores a Set membership instead of copy counts.
 * One row per (user_id, format); cards is a JSONB map { "card_id": 1 }.
 */
export function useUserCardList(tableName: string, format: CollectionFormat) {
  const { user } = useAuth();
  const [cardIds, setCardIds] = useState<Set<number>>(new Set());
  const [loadedFormat, setLoadedFormat] = useState<CollectionFormat | null>(null);

  const hydrate = useCallback((cardsJson: CardsJson) => {
    setCardIds(new Set(Object.keys(cardsJson).map(Number)));
    setLoadedFormat(format);
  }, [format]);

  const loadList = useCallback(async () => {
    if (!user) {
      setCardIds(new Set());
      setLoadedFormat(null);
      return;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('cards')
      .eq('user_id', user.id)
      .eq('format', format)
      .single();

    if (!error && data) {
      hydrate((data.cards ?? {}) as CardsJson);
      return;
    }

    // PGRST116 = no rows found (new user with empty list) — that's fine
    if (error && error.code !== 'PGRST116') {
      console.error(`[useUserCardList:${tableName}] load error:`, error);
    }
    hydrate({});
  }, [user, tableName, format, hydrate]);

  const persist = useCallback(async (nextIds: Set<number>) => {
    if (!user) return;
    const { error } = await supabase
      .from(tableName)
      .upsert(
        { user_id: user.id, format, cards: setToJson(nextIds) },
        { onConflict: 'user_id,format' }
      );

    if (error) {
      console.error(`[useUserCardList:${tableName}] persist error:`, error);
      await loadList();
    }
  }, [user, tableName, format, loadList]);

  const add = useCallback(async (cardId: number) => {
    if (!user) return;
    const nextIds = new Set(cardIds);
    nextIds.add(cardId);
    setCardIds(nextIds);
    await persist(nextIds);
  }, [user, cardIds, persist]);

  const remove = useCallback(async (cardId: number) => {
    if (!user) return;
    const nextIds = new Set(cardIds);
    nextIds.delete(cardId);
    setCardIds(nextIds);
    await persist(nextIds);
  }, [user, cardIds, persist]);

  const toggle = useCallback(async (cardId: number) => {
    if (cardIds.has(cardId)) {
      await remove(cardId);
    } else {
      await add(cardId);
    }
  }, [cardIds, add, remove]);

  return { cardIds, loadedFormat, loadList, toggle, add, remove };
}
