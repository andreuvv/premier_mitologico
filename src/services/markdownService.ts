import { FormatSection, FormatVariant, InfoSection, TournamentSubsection } from '../types';

export const loadMarkdownContent = async (
  type: 'game_formats' | 'tournament_info',
  section: FormatSection | InfoSection,
  variant?: FormatVariant | TournamentSubsection
): Promise<string> => {
  try {
    let fileName: string;
    
    if (type === 'game_formats') {
      if (variant) {
        fileName = getFormatVariantFileName(variant as FormatVariant);
      } else {
        fileName = getFormatSectionFileName(section as FormatSection);
      }
    } else {
      if (variant) {
        fileName = getTournamentSubsectionFileName(variant as TournamentSubsection);
      } else {
        fileName = getInfoSectionFileName(section as InfoSection);
      }
    }

    const path = `${import.meta.env.BASE_URL}assets/markdown/${type}/${fileName}`;
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error loading markdown:', error);
    return '# Error\n\nNo se pudo cargar el contenido.';
  }
};

const getFormatSectionFileName = (section: FormatSection): string => {
  switch (section) {
    case FormatSection.PRIMER_BLOQUE:
      return 'primer_bloque.md';
    case FormatSection.BLOQUE_FURIA:
      return 'bloque_furia.md';
  }
};

const getFormatVariantFileName = (variant: FormatVariant): string => {
  switch (variant) {
    case FormatVariant.PRIMER_BLOQUE_RACIAL_LIBRE:
      return 'pb_racial_libre.md';
    case FormatVariant.PRIMER_BLOQUE_RACIAL_EDICION:
      return 'pb_racial_edicion.md';
    case FormatVariant.BLOQUE_FURIA_RACIAL_LIBRE:
      return 'bf_racial_libre.md';
    case FormatVariant.BLOQUE_FURIA_RACIAL_LIMITADO:
      return 'bf_racial_edicion.md';
  }
};

const getInfoSectionFileName = (section: InfoSection): string => {
  switch (section) {
    case InfoSection.GENERAL:
      return 'general.md';
    case InfoSection.TOURNAMENT_SYSTEM:
      return 'tournament_system.md';
    case InfoSection.PRIZES_AND_FUNDING:
      return 'prizes_and_funding.md';
    case InfoSection.PARTICIPANTS:
      return 'participants.md';
    case InfoSection.SCHEDULE:
      return 'schedule.md';
  }
};

const getTournamentSubsectionFileName = (subsection: TournamentSubsection): string => {
  switch (subsection) {
    case TournamentSubsection.MD1:
      return 'md1.md';
    case TournamentSubsection.MD3:
      return 'md3.md';
    case TournamentSubsection.MULLIGAN:
      return 'mulligan.md';
    case TournamentSubsection.SCORING:
      return 'scoring.md';
    case TournamentSubsection.TIMING:
      return 'timing.md';
  }
};
