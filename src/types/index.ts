export enum MenuOption {
  HOME = 'home',
  TOURNAMENT_INFO = 'tournament_info',
  GAME_FORMATS = 'game_formats',
  BANLIST = 'banlist',
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  excerpt: string;
  homeExcerpt?: string;
  homeImage?: string;
  content: string;
}

export enum FormatSection {
  PRIMER_BLOQUE = 'primerBloque',
  BLOQUE_FURIA = 'bloqueFuria',
  FORMATOS_ESPECIALES = 'formatosEspeciales',
}

export enum FormatVariant {
  PRIMER_BLOQUE_RACIAL_LIBRE = 'primerBloqueRacialLibre',
  PRIMER_BLOQUE_RACIAL_EDICION = 'primerBloqueRacialEdicion',
  BLOQUE_FURIA_RACIAL_LIBRE = 'bloqueFuriaRacialLibre',
  BLOQUE_FURIA_RACIAL_LIMITADO = 'bloqueFuriaRacialLimitado',
  INFANTERIA = 'infanteria',
  VCR = 'vcr',
  COMMANDER = 'commander',
  RAGNAROK = 'ragnarok',
}

export enum InfoSection {
  GENERAL = 'general',
  TOURNAMENT_SYSTEM = 'tournamentSystem',
  GAME_RULES = 'gameRules',
  PRIZES_AND_FUNDING = 'prizesAndFunding',
  PARTICIPANTS = 'participants',
  SCHEDULE = 'schedule',
}

export enum TournamentSubsection {
  MD1 = 'md1',
  MD3 = 'md3',
  SCORING = 'scoring',
  TIMING = 'timing',
  MULLIGAN = 'mulligan',
  WHO_STARTS = 'whoStarts',
  GAME_PHASES = 'gamePhases',
  PLAY_OR_PUT = 'playOrPut',
  ABILITY_EFFECT = 'abilityEffect',
  ONCE_PER_TURN = 'oncePerTurn',
}
