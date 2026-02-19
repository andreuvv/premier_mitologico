import { FormatSection, FormatVariant, InfoSection, TournamentSubsection } from '../types';

export const formatSectionConfig: Record<FormatSection, {
  title: string;
  icon: string;
  variants?: FormatVariant[];
}> = {
  [FormatSection.PRIMER_BLOQUE]: {
    title: 'Primer Bloque',
    icon: 'FaDiceOne',
    variants: [
      FormatVariant.PRIMER_BLOQUE_RACIAL_LIBRE,
      FormatVariant.PRIMER_BLOQUE_RACIAL_EDICION,
    ],
  },
  [FormatSection.BLOQUE_FURIA]: {
    title: 'Bloque Furia',
    icon: 'FaFire',
    variants: [
      FormatVariant.BLOQUE_FURIA_RACIAL_LIBRE,
      FormatVariant.BLOQUE_FURIA_RACIAL_LIMITADO,
    ],
  },
  [FormatSection.FORMATOS_ESPECIALES]: {
    title: 'Formatos Especiales',
    icon: 'FaStar',
    variants: [
      FormatVariant.INFANTERIA,
      FormatVariant.VCR,
      FormatVariant.COMMANDER,
      FormatVariant.RAGNAROK,
    ],
  },
};

export const formatVariantConfig: Record<FormatVariant, { title: string }> = {
  [FormatVariant.PRIMER_BLOQUE_RACIAL_LIBRE]: { title: 'Primer Bloque Racial Libre' },
  [FormatVariant.PRIMER_BLOQUE_RACIAL_EDICION]: { title: 'Primer Bloque Racial Edición' },
  [FormatVariant.BLOQUE_FURIA_RACIAL_LIBRE]: { title: 'Bloque Furia Racial Libre' },
  [FormatVariant.BLOQUE_FURIA_RACIAL_LIMITADO]: { title: 'Bloque Furia Racial Limitado' },
  [FormatVariant.INFANTERIA]: { title: 'Infantería' },
  [FormatVariant.VCR]: { title: 'Vasallo, Cortesano, Real (VCR)' },
  [FormatVariant.COMMANDER]: { title: 'Commander' },
  [FormatVariant.RAGNAROK]: { title: 'Ragnarok' },
};

export const infoSectionConfig: Record<InfoSection, {
  title: string;
  icon: string;
  subsections?: TournamentSubsection[];
}> = {
  [InfoSection.GENERAL]: {
    title: 'Información General',
    icon: 'FaInfoCircle',
  },
  [InfoSection.TOURNAMENT_SYSTEM]: {
    title: 'Sistema de Torneo',
    icon: 'FaBalanceScale',
    subsections: [
      TournamentSubsection.MD1,
      TournamentSubsection.MD3,
      TournamentSubsection.SCORING,
      TournamentSubsection.TIMING,
    ],
  },
  [InfoSection.GAME_RULES]: {
    title: 'Aclaración de Reglas',
    icon: 'FaBook',
    subsections: [
      TournamentSubsection.MULLIGAN,
      TournamentSubsection.WHO_STARTS,
      TournamentSubsection.GAME_PHASES,
      TournamentSubsection.PLAY_OR_PUT,
      TournamentSubsection.ABILITY_EFFECT,
      TournamentSubsection.ONCE_PER_TURN,
    ],
  },
  [InfoSection.PRIZES_AND_FUNDING]: {
    title: 'Premios y Financiamiento',
    icon: 'FaTrophy',
  },
  [InfoSection.PARTICIPANTS]: {
    title: 'Participantes',
    icon: 'FaUsers',
  },
  [InfoSection.SCHEDULE]: {
    title: 'Cronograma',
    icon: 'FaCalendar',
  },
};

export const tournamentSubsectionConfig: Record<TournamentSubsection, { title: string }> = {
  [TournamentSubsection.MD1]: { title: 'Torneo Md1' },
  [TournamentSubsection.MD3]: { title: 'Torneo Md3' },
  [TournamentSubsection.SCORING]: { title: 'Puntuación' },
  [TournamentSubsection.TIMING]: { title: 'Tiempos' },
  [TournamentSubsection.MULLIGAN]: { title: 'Mulligan' },
  [TournamentSubsection.WHO_STARTS]: { title: '¿Quién Parte?' },
  [TournamentSubsection.GAME_PHASES]: { title: 'Fases del Juego' },
  [TournamentSubsection.PLAY_OR_PUT]: { title: 'Jugar Vs Poner' },
  [TournamentSubsection.ABILITY_EFFECT]: { title: 'Habilidad Vs Efecto' },
  [TournamentSubsection.ONCE_PER_TURN]: { title: 'Una Vez Por Turno' },
};
