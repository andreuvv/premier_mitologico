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
    { 
      card: 'País sin Luz', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Liberado', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/20-AniversarioHD/cartas/026-AHD-Pais-sin-Luz-MazosCL.png'},
    { 
      card: 'Gruagash', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Liberado', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/12-KitExtension/cartas/051-Gruagash.png'},
    { 
      card: 'Monte Kilgharrah', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Liberado', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/12-AniversarioES/cartas/023-AESX-Monte-Kilgharrah-MazosCL.png'},
    { 
      card: 'Panteón', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Liberado', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/15-AniversarioHE/cartas/026-AHE-Pantein-MazosCL.png'},
    { 
      card: 'Mercaderes', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Liberado', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/01-Espada-Sagrada/cartas/Mercaderes-real.png-1764036016311'},
    { 
      card: 'Eolo', 
      pastMonth: 'Baneada', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/15-AniversarioHE/cartas/030-AHE-Eolo-MazosCL.png'},
    { 
      card: 'Felipe II', 
      pastMonth: 'Baneada', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/01-Espada-Sagrada/cartas/Felipe-ii-real.png-1764035983821'},
    { 
      card: 'Marco Antonio', 
      pastMonth: 'Baneada', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/15-AniversarioHE/cartas/017-AHE-Marco-Antonio-MazosCL.png'},
    { 
      card: 'Ptolomeo II', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/25-AniversarioRA/cartas/083-ARA-Ptolomeo-II-MazosCL.png'},
    { 
      card: 'Abu Simbel', 
      pastMonth: 'Liberado', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/29-Toolkit2026/cartas/028-TKPB26-Abu-Simbel-MazosCL.webp'},
    { 
      card: 'Traficantes de Esclavos', 
      pastMonth: 'Liberado', 
      currentMonth: 'Baneada', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/19-Leyendas3PB/cartas/200-LPB23-Traficantes-MazosCL.png'},
    { 
      card: 'Urisk', 
      pastMonth: 'Liberado', 
      currentMonth: 'Baneada', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/19-Leyendas3PB/cartas/199-LPB23-Urisk-MazosCL.png'},
    { 
      card: 'Yelmo Alejandrino', 
      pastMonth: 'Liberado', 
      currentMonth: 'Baneada', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/25-AniversarioRA/cartas/161-ARA-Yelmo-Alejandrino-MazosCL.png'},
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    { 
      card: 'País sin Luz', 
      pastMonth: 'Limitada x2', 
      currentMonth: 'Liberado', 
      changeType: 'positive', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/20-AniversarioHD/cartas/026-AHD-Pais-sin-Luz-MazosCL.png'},
    { 
      card: 'Morir de Pie', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Limitada x2', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/20-AniversarioHD/relatos/007-AHDX-Morir-de-Pie-MazosCL.png'},
    { 
      card: 'Helios', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Limitada x2', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/22-Lootbox24/cartas/039-LB24-Helios-MazosCL.png'},
    { 
      card: 'Avalon', 
      pastMonth: 'Baneada', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/17-Lootbox3/cartas/054-Avalon-MazosCL.png'},
    { 
      card: 'Mineros de Lapislázuli', 
      pastMonth: 'Liberado', 
      currentMonth: 'Limitada x2', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/25-AniversarioRA/cartas/385-ARA-Mineros-de-Lapislazuli-MazosCL.png'},
    { 
      card: 'Kernuac el Cazador', 
      pastMonth: 'Liberado', 
      currentMonth: 'Baneada', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/PRIMER_BLOQUE/12-AniversarioES/cartas/074-Kernuac-el-Cazador-MazosCL.png'},
  ],
  [BanListFormat.BLOQUE_FURIA_LIBRE]: [
    { 
      card: 'Enki', 
      pastMonth: 'Liberado', 
      currentMonth: 'Baneada', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/numeradas/316.webp'},
    { 
      card: 'Corte Terrenal', 
      pastMonth: 'Liberado', 
      currentMonth: 'Baneada', 
      changeType: 'negative', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/numeradas/307.webp'},
    { 
      card: 'Tribunal Eterno', 
      pastMonth: 'Liberado', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/numeradas/315.webp'},
    { 
      card: 'Humbaba', 
      pastMonth: 'Baneada', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/06-Daana/promos/181-GUA-Humbaba-MazosCL.webp'},
    { 
      card: 'Dragón Fomoriano', 
      pastMonth: 'Baneada', 
      currentMonth: 'Limitada x1', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/06-Daana/promos/175-GUA-Dragon-Fomoriano-MazosCL.webp'},
    { 
      card: 'Cangrejo Cazador', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Limitada x2', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/06-Daana/cartas/037-GUA-Cangrejo-Cazador-MazosCL.webp'},
    { 
      card: 'Takam', 
      pastMonth: 'Limitada x1', 
      currentMonth: 'Limitada x2', 
      changeType: 'neutral', 
      imageUrl: 'https://cdn.mazos.cl/FURIA_EXT/10-Leyendas2/cartas-nombre/104-LBF2-Takam-MazosCL.webp'},
  ],
  [BanListFormat.BLOQUE_FURIA_LIMITED]: [
    //{ card: 'Ejemplo Carta 6', pastMonth: 'Limitada x1', currentMonth: 'Liberado' },
  ],
};

// This will be displayed in the accordion title
export const lastUpdateMonth = 'Abril 2026';
