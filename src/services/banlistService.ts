import { BanListFormat, BanListData } from '../types/banlist';
import { getLatestMonthlyBanlist } from './monthlyBanlistService';

const formatToFile: Record<BanListFormat, string> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: 'banlist_pb_libre.json',
  [BanListFormat.PRIMER_BLOQUE_EDICION]: 'banlist_pb_edition.json',
  [BanListFormat.BLOQUE_FURIA_LIBRE]: 'banlist_bf_libre.json',
  [BanListFormat.BLOQUE_FURIA_RAGNAROK]: 'banlist_bf_ragnarok.json',
};

export const loadBanlist = async (format: BanListFormat): Promise<BanListData> => {
  const monthlyBanlist = await getLatestMonthlyBanlist(format);
  if (monthlyBanlist) {
    return monthlyBanlist;
  }

  const filename = formatToFile[format];
  const response = await fetch(`${import.meta.env.BASE_URL}assets/json/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load banlist: ${filename}`);
  }
  return response.json();
};
