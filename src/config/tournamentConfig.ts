/**
 * Tournament Configuration
 * 
 * Update these values to configure the next tournament.
 * Set date to null or past date + 1 day to display "TBD" mode.
 */

export interface TournamentConfig {
  name: string;
  date: string | null; // Format: 'YYYY-MM-DD'
  time: string | null; // Format: 'HH:MM' (24-hour format)
  dateTentative: boolean; // Set to true to show "Fecha y Ubicación aún NO definidas" ribbon
  location: {
    name: string | null;
    address: string | null;
    googleMapsQuery: string | null;
  };
  formats: Array<{
    name: string;
    shortName?: string;
    link: string;
  }>;
  roundType: {
    name: string;
    link: string;
  };
}

export const tournamentConfig: TournamentConfig = {
  name: 'PREMIER PB MAYO 2026',
  date: '2026-05-01',
  time: '14:00',
  dateTentative: true, // Set to true to show the ribbon
  //location: {
  //  name: "Weshes",
  //  address: 'Jorge Quevedo 5464, Macul, Santiago',
  //  googleMapsQuery: 'Jorge+Quevedo+5464,+Macul,+Santiago',
  //},
  location: {
    name: "Casa de la Vale, los Gatos y el Piter.",
    address: 'Las Tórtolas 3273, Macul, Santiago',
    googleMapsQuery: 'Las+Tórtolas+3273,+Macul,+Santiago',
  },
  formats: [
    {
      name: 'Primer Bloque Racial Libre',
      shortName: 'PB Racial Libre',
      link: '/game-formats/primerBloque/primerBloqueRacialLibre',
    },
    {
      name: 'Primer Bloque Racial Edición',
      shortName: 'PB Racial Edición',
      link: '/game-formats/primerBloque/primerBloqueRacialEdicion',
    },
  ],
  roundType: {
    name: 'Mejor de 3',
    link: '/tournament-info/tournamentSystem/md3',
  },
};

/**
 * Check if tournament date has passed by more than 1 day
 */
export function isTournamentPast(): boolean {
  if (!tournamentConfig.date) return true;
  
  // Parse date string as local timezone (not UTC) to avoid timezone offset issues
  const [year, month, day] = tournamentConfig.date.split('-').map(Number);
  const tournamentDate = new Date(year, month - 1, day);
  const now = new Date();
  
  // Remove time component for comparison
  tournamentDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = now.getTime() - tournamentDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays >= 1;
}

/**
 * Check if today is the tournament day
 */
export function isTournamentDay(): boolean {
  if (!tournamentConfig.date) return false;
  
  // Parse date string as local timezone (not UTC) to avoid timezone offset issues
  const [year, month, day] = tournamentConfig.date.split('-').map(Number);
  const tournamentDate = new Date(year, month - 1, day);
  const now = new Date();
  
  // Remove time component for comparison
  tournamentDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return tournamentDate.getTime() === now.getTime();
}

/**
 * Format date for display
 */
export function formatTournamentDate(): string {
  if (!tournamentConfig.date || !tournamentConfig.time || isTournamentPast()) {
    return 'TBD';
  }
  
  // Parse date string as local timezone (not UTC)
  const [year, month, day] = tournamentConfig.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()} - ${tournamentConfig.time} hrs`;
}

/**
 * Get tournament datetime for countdown
 */
export function getTournamentDateTime(): Date | null {
  if (!tournamentConfig.date || !tournamentConfig.time || isTournamentPast()) {
    return null;
  }
  
  return new Date(`${tournamentConfig.date}T${tournamentConfig.time}:00`);
}

/**
 * Get tournament month and year for display
 */
export function getTournamentMonthYear(): string {
  if (!tournamentConfig.date || isTournamentPast()) {
    return '';
  }
  
  // Parse date string as local timezone (not UTC)
  const [year, month] = tournamentConfig.date.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
