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
export function useUserCardList(tableName: string, format: CollectionFormat, targetUserId?: string | null) {
  const { user } = useAuth();
  const effectiveUserId = targetUserId ?? user?.id ?? null;
  const isOwner = Boolean(user && effectiveUserId && effectiveUserId === user.id);
  const [cardIds, setCardIds] = useState<Set<number>>(new Set());
  const [loadedFormat, setLoadedFormat] = useState<CollectionFormat | null>(null);

  const hydrate = useCallback((cardsJson: CardsJson) => {
    setCardIds(new Set(Object.keys(cardsJson).map(Number)));
    setLoadedFormat(format);
  }, [format]);

  const loadList = useCallback(async () => {
    if (!effectiveUserId) {
      setCardIds(new Set());
      setLoadedFormat(null);
      return;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('cards')
      .eq('user_id', effectiveUserId)
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
  }, [effectiveUserId, tableName, format, hydrate]);

  const persist = useCallback(async (nextIds: Set<number>) => {
    if (!isOwner || !user) return;
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
  }, [isOwner, user, tableName, format, loadList]);

  const add = useCallback(async (cardId: number) => {
    if (!isOwner || !user) return;
    const nextIds = new Set(cardIds);
    nextIds.add(cardId);
    setCardIds(nextIds);
    await persist(nextIds);
  }, [isOwner, user, cardIds, persist]);

  const remove = useCallback(async (cardId: number) => {
    if (!isOwner || !user) return;
    const nextIds = new Set(cardIds);
    nextIds.delete(cardId);
    setCardIds(nextIds);
    await persist(nextIds);
  }, [isOwner, user, cardIds, persist]);

  const toggle = useCallback(async (cardId: number) => {
    if (cardIds.has(cardId)) {
      await remove(cardId);
    } else {
      await add(cardId);
    }
  }, [cardIds, add, remove]);

  return { cardIds, loadedFormat, loadList, toggle, add, remove, isOwner };
}
