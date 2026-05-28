export interface CardProduct {
  productName: string;
  productCode: string;
  productType: string;
}

export interface CardEdition {
  name: string;
  slug: string;
  __typename: string;
}

export interface CardGame {
  name: string;
  slug: string;
  __typename: string;
}

export interface CollectionCard {
  id: number;
  slug: string;
  name: string;
  gameId: number;
  collectorCode: string;
  effect?: string;
  flavor?: string;
  type: string;
  cost: number;
  attack: number;
  imageUrl: string;
  artist: string;
  frequency: string;
  race: string[];
  edition: CardEdition;
  game: CardGame;
  product?: CardProduct;
  interactions?: string[];
  unique?: boolean;
  moreThan3?: boolean;
  isNewest?: boolean;
  isRework?: boolean;
  isReworked?: boolean;
  __typename: string;
}

export interface CollectionCatalog {
  data: {
    CardCatalog: {
      cards: CollectionCard[];
      total: number;
      pages: number;
      __typename: string;
    };
  };
}

export enum CollectionFormat {
  PRIMER_BLOQUE = 'pb',
  FURIA_EXTENDIDO = 'fx',
}
