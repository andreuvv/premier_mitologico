import { BanListFormat } from '../types/banlist';

export type ChangeType = 'positive' | 'negative' | 'neutral';

export interface FormatSummary {
  card: string;
  pastMonth: string;
  currentMonth: string;
  changeType?: ChangeType;
  imageUrl?: string;
}

// Update this object each month with the changes for each format
export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    //{ card: 'Festín', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive' },
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    { card: 'Fergus', pastMonth: 'Baneada', currentMonth: 'Limitada x1', changeType: 'positive', imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/19-Leyendas3PB/cartas/046-LPB23-Fergus-MazosCL.png'},
    { card: 'Ofrenda a los Dioses', pastMonth: 'Limitada x2', currentMonth: 'Liberado', changeType: 'positive', imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/19-Leyendas3PB/cartas/146-LPB23-Ofrenda-a-los-Dioses-MazosCL.png' },
    { card: 'La llama Fría', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1', changeType: 'neutral', imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/28-Lootbox25/cartas/028-LBPB25-La-Llama-fria-MazosCL.png' },
    { card: 'Tebas', pastMonth: 'Limitada x2', currentMonth: 'Limitada x1', changeType: 'neutral', imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/25-AniversarioRA/cartas/270-ARA-Tebas-MazosCL.png' },
    { card: 'Kamose el Guerrero', pastMonth: 'Liberado', currentMonth: 'Limitada x2', changeType: 'neutral', imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/25-AniversarioRA/cartas/295-ARA-Kamose-el-Guerrero-MazosCL.png' },
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
