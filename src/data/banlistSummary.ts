import { BanListFormat } from '../types/banlist';

export type ChangeType = 'positive' | 'positiveSoft' | 'negative' | 'negativeSoft' | 'neutral';

export type ChangeArrowDirection = 'up' | 'down' | 'none';

export interface ChangeArrowInfo {
  count: number;
  direction: ChangeArrowDirection;
}

export const getRestrictionRankFromLabel = (label: string): number => {
  const normalized = label.toLowerCase();
  if (normalized.includes('banead')) return 3;
  if (normalized.includes('x1')) return 2;
  if (normalized.includes('x2')) return 1;
  return 0;
};

export const getChangeArrowInfo = (pastMonth: string, currentMonth: string): ChangeArrowInfo => {
  const prevRank = getRestrictionRankFromLabel(pastMonth);
  const currRank = getRestrictionRankFromLabel(currentMonth);
  const diff = currRank - prevRank;

  if (diff === 0) {
    return { count: 0, direction: 'none' };
  }

  return {
    count: Math.abs(diff),
    direction: diff > 0 ? 'down' : 'up',
  };
};

export interface FormatSummary {
  card: string;
  pastMonth: string;
  currentMonth: string;
  changeType?: ChangeType;
  imageUrl?: string;
  cardId?: number;
}

// Update this object each month with the changes for each format
export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIBRE]: [
    { 
      card: 'Lakshmi', 
      pastMonth: 'Liberado', 
      currentMonth: 'Limitada x1', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/046-LBF2-Lakshmi-MazosCL.webp'},
    { 
      card: 'Nammu', 
      pastMonth: 'Liberado', 
      currentMonth: 'Limitada x1', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/047-LBF2-Nammu-MazosCL.webp'},
    { 
      card: 'Vishnu Infinito', 
      pastMonth: 'Liberado', 
      currentMonth: 'Limitada x1', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/096-LBF2-Vishnu-Infinito-MazosCL.webp'},
    { 
      card: 'Takam', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Liberada', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/104-LBF2-Takam-MazosCL.webp'},
    { 
      card: 'Surt', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Liberada', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/124-LBF2-Surt-MazosCL.webp'},
    { 
      card: 'Sinach', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Liberada', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/110-LBF2-Sinach-MazosCL.webp'},
  ],
  [BanListFormat.BLOQUE_FURIA_RAGNAROK]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
};

// This will be displayed in the accordion title
export const lastUpdateMonth = 'Junio 2026';
