import { BanListFormat } from '../types/banlist';

export interface FormatSummary {
  card: string;
  pastMonth: string;
  currentMonth: string;
}

// Update this object each month with the changes for each format
export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    //{ card: 'Ejemplo Carta 1', pastMonth: 'Limitada x1', currentMonth: 'Baneada' },
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    { card: 'Goblin Stone', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
    { card: 'La Iliada', pastMonth: 'Limitada x1', currentMonth: 'Limitada x2' },
    { card: 'Ofrenda de los Dioses', pastMonth: 'Limitada x1', currentMonth: 'Limitada x2' },
    { card: 'Constantino', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
    { card: 'Conand', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
    { card: 'Linaje Celta', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
    { card: 'Jeroglíficos', pastMonth: 'Liberado', currentMonth: 'Limitada x1' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIBRE]: [
    { card: 'Dragón Fomoriano', pastMonth: 'Liberado', currentMonth: 'Baneada' },
    { card: 'Takam', pastMonth: 'Liberado', currentMonth: 'Limitada x1' },
    { card: 'Jormundgander', pastMonth: 'Limitada x2', currentMonth: 'Liberado' },
  ],
  [BanListFormat.BLOQUE_FURIA_LIMITED]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
};

// This will be displayed in the accordion title
export const lastUpdateMonth = 'Diciembre 2025';
