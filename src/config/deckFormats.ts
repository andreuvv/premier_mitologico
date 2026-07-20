export type Format = 'pb' | 'fx';
export type Subformat = 'pb-edicion' | 'pb-libre' | 'fx-vcr' | 'fx-libre' | 'fx-ragnarok';

export const PB_RACES = [
  'Caballero', 'Defensor', 'Desafiante', 'Dragon', 'Eterno',
  'Faerie', 'Faraon', 'Heroe', 'Olimpico', 'Sacerdote', 'Sombra', 'Titan',
];

export const FX_RACES = [
  'Ancestral', 'Barbaro', 'Bestia', 'Caballero', 'Dragon',
  'Eterno', 'Guerrero', 'Heroe', 'Sacerdote', 'Sombra',
];

export const FX_TOTEM_RACE = 'Tótem';

export function getFxRacesForSubformat(subformat: Subformat): string[] {
  if (subformat === 'fx-libre' || subformat === 'fx-ragnarok') {
    return [...FX_RACES, FX_TOTEM_RACE];
  }
  return FX_RACES;
}

export const PB_SUBFORMATS: { value: Subformat; label: string; desc: string }[] = [
  { value: 'pb-edicion', label: 'Racial Edición', desc: 'Solo cartas de una misma edición' },
  { value: 'pb-libre', label: 'Racial Libre', desc: 'Cartas de todas las ediciones PB' },
];

export const FX_SUBFORMATS: { value: Subformat; label: string; desc: string }[] = [
  { value: 'fx-vcr', label: 'VCR', desc: 'Solo cartas Vasallo, Cortesano o Real' },
  { value: 'fx-libre', label: 'Racial Libre', desc: 'Cartas de todas las ediciones FX' },
  { value: 'fx-ragnarok', label: 'Racial Ragnarok', desc: 'Todas las cartas son únicas salvo Oros sin habilidad' },
];

/** Sidedeck (mazo de cambio) size limit per format. */
export const SIDEDECK_SIZE: Record<Format, number> = {
  pb: 10,
  fx: 15,
};
