export enum BanListFormat {
  PRIMER_BLOQUE_LIBRE = 'pb_libre',
  PRIMER_BLOQUE_EDICION = 'pb_edition',
  BLOQUE_FURIA_LIBRE = 'bf_libre',
  BLOQUE_FURIA_LIMITED = 'bf_limited',
}

export enum BanListCategory {
  BANNED = 'banned',
  LIMITED_X1 = 'limitedX1',
  LIMITED_X2 = 'limitedX2',
}

export interface BanListCard {
  name: string;
  type: string;
  imageUrl: string;
}

export interface BanListData {
  format: string;
  lastUpdated: string;
  banned: BanListCard[];
  limitedX1: BanListCard[];
  limitedX2: BanListCard[];
}
