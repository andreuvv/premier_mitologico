import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import type { CollectionFormat } from '../types/collection';

// JSONB shape stored in user_collections_v2.cards: { "card_id": copy_count }
type CardsJson = Record<string, number>;

function mapToJson(copies: Map<number, number>): CardsJson {
  const obj: CardsJson = {};
  copies.forEach((count, id) => { obj[String(id)] = count; });
  return obj;
}

export function useUserCollection(format: CollectionFormat) {
  const { user } = useAuth();
  const [ownedCardIds, setOwnedCardIds] = useState<Set<number>>(new Set());
  const [cardCopies, setCardCopies] = useState<Map<number, number>>(new Map());
  const [loadedFormat, setLoadedFormat] = useState<CollectionFormat | null>(null);

  const hydrateCollection = useCallback((cardsJson: CardsJson) => {
    const nextCopies = new Map<number, number>();
    Object.entries(cardsJson).forEach(([cardId, count]) => {
      nextCopies.set(Number(cardId), Math.max(1, count));
    });
    setCardCopies(nextCopies);
    setOwnedCardIds(new Set(nextCopies.keys()));
    setLoadedFormat(format);
  }, [format]);

  const loadCollection = useCallback(async () => {
    if (!user) {
      setOwnedCardIds(new Set());
      setCardCopies(new Map());
      setLoadedFormat(null);
      return;
    }

    const { data, error } = await supabase
      .from('user_collections_v2')
      .select('cards')
      .eq('user_id', user.id)
      .eq('format', format)
      .single();

    if (!error && data) {
      hydrateCollection((data.cards ?? {}) as CardsJson);
      return;
    }

    // PGRST116 = no rows found (new user with empty collection) — that's fine
    if (error && error.code !== 'PGRST116') {
      console.error('[useUserCollection] load error:', error);
    }
    hydrateCollection({});
  }, [user, format, hydrateCollection]);

  const addCopy = useCallback(async (cardId: number) => {
    if (!user) return;

    const nextCopies = (cardCopies.get(cardId) ?? 0) + 1;

    // Build the updated map locally so we can pass it to both setState and Supabase
    const newCopies = new Map(cardCopies);
    newCopies.set(cardId, nextCopies);

    setCardCopies(newCopies);
    setOwnedCardIds((prev) => { const next = new Set(prev); next.add(cardId); return next; });

    const { error } = await supabase
      .from('user_collections_v2')
      .upsert(
        { user_id: user.id, format, cards: mapToJson(newCopies) },
        { onConflict: 'user_id,format' }
      );

    if (error) {
      console.error('[useUserCollection] add copy error:', error);
      await loadCollection();
    }
  }, [user, cardCopies, format, loadCollection]);

  const removeCopy = useCallback(async (cardId: number) => {
    if (!user) return;

    const currentCopies = cardCopies.get(cardId) ?? 0;
    if (currentCopies <= 0) return;

    const nextCopies = currentCopies - 1;

    // Build the updated map locally so we can pass it to both setState and Supabase
    const newCopies = new Map(cardCopies);
    if (nextCopies <= 0) {
      newCopies.delete(cardId);
    } else {
      newCopies.set(cardId, nextCopies);
    }

    setCardCopies(newCopies);
    setOwnedCardIds((prev) => {
      const next = new Set(prev);
      if (nextCopies <= 0) next.delete(cardId);
      return next;
    });

    const { error } = await supabase
      .from('user_collections_v2')
      .upsert(
        { user_id: user.id, format, cards: mapToJson(newCopies) },
        { onConflict: 'user_id,format' }
      );

    if (error) {
      console.error('[useUserCollection] remove copy error:', error);
      await loadCollection();
    }
  }, [user, cardCopies, format, loadCollection]);

  const toggleCard = useCallback(async (cardId: number) => {
    const isOwned = ownedCardIds.has(cardId);
    if (isOwned) {
      await removeCopy(cardId);
    } else {
      await addCopy(cardId);
    }
  }, [ownedCardIds, addCopy, removeCopy]);

  return { ownedCardIds, cardCopies, loadedFormat, loadCollection, toggleCard, addCopy, removeCopy };
}
