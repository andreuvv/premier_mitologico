import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import type { CollectionFormat } from '../types/collection';

type CollectionRow = {
  card_id: number;
  copy_count?: number | null;
};

export function useUserCollection(format: CollectionFormat) {
  const { user } = useAuth();
  const [ownedCardIds, setOwnedCardIds] = useState<Set<number>>(new Set());
  const [cardCopies, setCardCopies] = useState<Map<number, number>>(new Map());
  const [loadedFormat, setLoadedFormat] = useState<CollectionFormat | null>(null);

  const hydrateCollection = useCallback((rows: CollectionRow[]) => {
    const nextCopies = new Map<number, number>();
    rows.forEach((row) => {
      const copies = Math.max(1, row.copy_count ?? 1);
      nextCopies.set(row.card_id, copies);
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
      .from('user_collections')
      .select('card_id, copy_count')
      .eq('user_id', user.id)
      .eq('format', format);

    if (!error && data) {
      hydrateCollection(data as CollectionRow[]);
      return;
    }

    // Backward compatibility for environments where copy_count column has not been added yet.
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('user_collections')
      .select('card_id')
      .eq('user_id', user.id)
      .eq('format', format);

    if (!fallbackError && fallbackData) {
      hydrateCollection((fallbackData as Array<{ card_id: number }>).map((row) => ({
        card_id: row.card_id,
        copy_count: 1,
      })));
    }
  }, [user, format, hydrateCollection]);

  const addCopy = useCallback(async (cardId: number) => {
    if (!user) return;

    const currentCopies = cardCopies.get(cardId) ?? 0;
    const nextCopies = currentCopies + 1;

    setCardCopies((prev) => {
      const next = new Map(prev);
      next.set(cardId, nextCopies);
      return next;
    });
    setOwnedCardIds((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });

    const { error } = await supabase
      .from('user_collections')
      .upsert(
        {
          user_id: user.id,
          card_id: cardId,
          format,
          copy_count: nextCopies,
        },
        { onConflict: 'user_id,card_id,format' }
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

    setCardCopies((prev) => {
      const next = new Map(prev);
      if (nextCopies <= 0) {
        next.delete(cardId);
      } else {
        next.set(cardId, nextCopies);
      }
      return next;
    });
    setOwnedCardIds((prev) => {
      const next = new Set(prev);
      if (nextCopies <= 0) {
        next.delete(cardId);
      }
      return next;
    });

    if (nextCopies <= 0) {
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .eq('format', format);
      if (error) {
        console.error('[useUserCollection] delete copy row error:', error);
        await loadCollection();
      }
      return;
    }

    const { error } = await supabase
      .from('user_collections')
      .update({ copy_count: nextCopies })
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .eq('format', format);
    if (error) {
      console.error('[useUserCollection] update copy count error:', error);
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
