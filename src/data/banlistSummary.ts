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
    //{ card: 'Festín', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive' },
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    { card: 'Fergus', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive' },
    { card: 'Ofrenda a los Dioses', pastMonth: 'Limitada x2', currentMonth: 'Liberado', changeType: 'positive' },
    { card: 'La llama Fría', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1', changeType: 'neutral' },
    { card: 'Tebas', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1', changeType: 'neutral' },
    { card: 'Kamose el Guerrero', pastMonth: 'Liberado', currentMonth: 'Limitada x2', changeType: 'neutral' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIBRE]: [
    //{ card: 'Dragón Fomoriano', pastMonth: 'Liberado', currentMonth: 'Baneada' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIMITED]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
};

// This will be displayed in the accordion title
export const lastUpdateMonth = 'Marzo 2026';
