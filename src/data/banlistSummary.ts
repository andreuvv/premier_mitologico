import { BanListFormat } from '../types/banlist';

export type ChangeType = 'positive' | 'negative' | 'neutral';

export interface FormatSummary {
  card: string;
  pastMonth: string;
  currentMonth: string;
  changeType?: ChangeType;
}

// Update this object each month with the changes for each format
export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    { card: 'Festín', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive' },
    { card: 'Amón', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive' },
    { card: 'Cathbadh el Druida', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive' },
    { card: 'Averix el Sabio', pastMonth: 'Limitada x2', currentMonth: 'Liberado', changeType: 'positive' },
    { card: 'Kobold', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1', changeType: 'neutral' },
    { card: 'Ptolomeo II', pastMonth: 'Liberado', currentMonth: 'Limitada x2', changeType: 'neutral' },
    { card: 'Daga de Bote', pastMonth: 'Liberado', currentMonth: 'Limitada x1', changeType: 'neutral' },
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    { card: 'Marco Antonio', pastMonth: 'Baneada', currentMonth: 'Liberado', changeType: 'positive' },
    { card: 'Rea', pastMonth: 'Limitada x2', currentMonth: 'Liberado', changeType: 'positive' },
    { card: 'Ptolomeo II', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1', changeType: 'neutral' },
    { card: 'Furia Irracional', pastMonth: 'Liberado', currentMonth: 'Limitada x1', changeType: 'neutral' },
    { card: 'La Llama Fría', pastMonth: 'Liberado', currentMonth: 'Limitada x2', changeType: 'neutral' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIBRE]: [
    //{ card: 'Dragón Fomoriano', pastMonth: 'Liberado', currentMonth: 'Baneada' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIMITED]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
};

// This will be displayed in the accordion title
export const lastUpdateMonth = 'Enero 2025';
