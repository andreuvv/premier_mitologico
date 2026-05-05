import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import type { CollectionFormat } from '../types/collection';

export function useUserCollection(format: CollectionFormat) {
  const { user } = useAuth();
  const [ownedCardIds, setOwnedCardIds] = useState<Set<number>>(new Set());
  const [loadedFormat, setLoadedFormat] = useState<CollectionFormat | null>(null);

  const loadCollection = useCallback(async () => {
    if (!user) {
      setOwnedCardIds(new Set());
      setLoadedFormat(null);
      return;
    }

    const { data, error } = await supabase
      .from('user_collections')
      .select('card_id')
      .eq('user_id', user.id)
      .eq('format', format);

    if (!error && data) {
      setOwnedCardIds(new Set(data.map((row: { card_id: number }) => row.card_id)));
      setLoadedFormat(format);
    }
  }, [user, format]);

  const toggleCard = useCallback(async (cardId: number) => {
    if (!user) return;

    const isOwned = ownedCardIds.has(cardId);

    // Optimistic update
    setOwnedCardIds(prev => {
      const next = new Set(prev);
      if (isOwned) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });

    if (isOwned) {
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .eq('format', format);
      if (error) console.error('[useUserCollection] delete error:', error);
    } else {
      const { error } = await supabase
        .from('user_collections')
        .upsert({ user_id: user.id, card_id: cardId, format });
      if (error) console.error('[useUserCollection] upsert error:', error);
    }
  }, [user, ownedCardIds, format]);

  return { ownedCardIds, loadedFormat, loadCollection, toggleCard };
}
