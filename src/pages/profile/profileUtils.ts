import { CollectionCard, CollectionFormat } from '../../types/collection';
import type { SimpleCard } from '../../components/CardGrid';

export type CardSection = 'collection' | 'favorites' | 'wishlist';
export const CARD_SECTIONS: CardSection[] = ['collection', 'favorites', 'wishlist'];

export const toSimpleCards = (cards: CollectionCard[]): SimpleCard[] =>
  cards.map((card) => ({
    id: card.id,
    slug: card.slug,
    name: card.name,
    imageUrl: card.imageUrl,
    collectorCode: card.collectorCode,
    type: card.type,
    cost: card.cost,
    attack: card.attack,
    effect: card.effect,
    flavor: card.flavor,
    artist: card.artist,
    productName: card.product?.productName ?? card.edition?.name,
  }));

export { getSubformatLabel } from '../../utils/deckSubformatLabel';

export const getFormatLabel = (format: CollectionFormat) =>
  format === CollectionFormat.PRIMER_BLOQUE ? 'Primer Bloque' : 'Furia Extendido';

export const getSectionLabel = (section: CardSection) => {
  if (section === 'collection') return 'Colección';
  if (section === 'favorites') return 'Favoritos';
  return 'Lista de Deseados';
};
