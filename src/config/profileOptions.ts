export type FavoriteFormatId = 'pb_edicion' | 'pb_libre' | 'fx_libre' | 'fx_ragnarok';

export interface FavoriteFormatOption {
  id: FavoriteFormatId;
  label: string;
}

export const FAVORITE_FORMATS: FavoriteFormatOption[] = [
  { id: 'pb_edicion', label: 'Primer Bloque Racial Edición' },
  { id: 'pb_libre', label: 'Primer Bloque Racial Libre' },
  { id: 'fx_libre', label: 'Furia Extendido Racial Libre' },
  { id: 'fx_ragnarok', label: 'Furia Extendido Racial Ragnarok' },
];

export const PB_RACES = [
  'Faerie', 'Caballero', 'Dragón', 'Héroe', 'Titán', 'Olímpico',
  'Defensor', 'Desafiante', 'Sombra', 'Eterno', 'Sacerdote', 'Faraón',
];

export const FX_RACES = [
  'Dragón', 'Bestia', 'Sombra', 'Eterno', 'Guerrero', 'Caballero',
  'Sacerdote', 'Ancestral', 'Héroe', 'Bárbaro',
];

export type FavoriteRacesMap = Partial<Record<FavoriteFormatId, string>>;

export function racesForFormat(formatId: FavoriteFormatId): string[] {
  return formatId.startsWith('pb_') ? PB_RACES : FX_RACES;
}

export function getFavoriteFormatLabel(formatId: FavoriteFormatId | null | undefined): string {
  if (!formatId) return '';
  return FAVORITE_FORMATS.find((f) => f.id === formatId)?.label ?? formatId;
}

export function isPbFavoriteFormat(formatId: FavoriteFormatId): boolean {
  return formatId.startsWith('pb_');
}
