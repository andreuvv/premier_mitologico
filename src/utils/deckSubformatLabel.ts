/** Short label of a deck subformat ("Racial Edición", "VCR", ...). */
export function getSubformatLabel(subformat: string): string {
  if (subformat === 'pb-edicion') return 'Racial Edición';
  if (subformat === 'pb-libre') return 'Racial Libre';
  if (subformat === 'fx-vcr') return 'VCR';
  if (subformat === 'fx-ragnarok') return 'Racial Ragnarok';
  return 'Racial Libre';
}
