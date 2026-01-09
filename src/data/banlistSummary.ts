import { BanListFormat } from '../types/banlist';

export interface FormatSummary {
  card: string;
  pastMonth: string;
  currentMonth: string;
}

// Update this object each month with the changes for each format
export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    { card: 'Festín', pastMonth: 'Baneada', currentMonth: 'Limitada x1' },
    { card: 'Amón', pastMonth: 'Baneada', currentMonth: 'Limitada x1' },
    { card: 'Cathbadh el Druida', pastMonth: 'Baneada', currentMonth: 'Limitada x1' },
    { card: 'Averix el Sabio', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
    { card: 'Kobold', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1' },
    { card: 'Ptolomeo II', pastMonth: 'Liberado', currentMonth: 'Limitada x2' },
    { card: 'Daga de Bote', pastMonth: 'Liberado', currentMonth: 'Limitada x1' },
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    { card: 'Marco Antonio', pastMonth: 'Baneada', currentMonth: 'Liberado' },
    { card: 'Rea', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
    { card: 'Ptolomeo II', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1' },
    { card: 'Furia Irracional', pastMonth: 'Liberado', currentMonth: 'Limitada x1' },
    { card: 'La Llama Fría', pastMonth: 'Liberado', currentMonth: 'Limitada x2' },
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
