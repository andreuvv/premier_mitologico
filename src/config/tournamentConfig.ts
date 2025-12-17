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
  location: {
    name: string | null;
    address: string | null;
    googleMapsQuery: string | null;
  };
  formats: Array<{
    name: string;
    link: string;
  }>;
  roundType: {
    name: string;
    link: string;
  };
}

export const tournamentConfig: TournamentConfig = {
  name: 'Copa K&T',
  date: '2026-01-10', // Set to null or past date for TBD mode
  time: '18:00',
  location: {
    name: "Weshe's",
    address: 'Jorge Quevedo 5464, Macul, Santiago',
    googleMapsQuery: 'Jorge+Quevedo+5464,+Macul,+Santiago',
  },
  formats: [
    {
      name: 'Primer Bloque Racial Libre',
      link: '/game-formats#primerBloqueRacialLibre',
    },
    {
      name: 'Furia Extendido Racial Libre',
      link: '/game-formats#bloqueFuriaRacialLibre',
    },
  ],
  roundType: {
    name: 'Mejor de 3',
    link: '/tournament-info#md3',
  },
};

/**
 * Check if tournament date has passed by more than 1 day
 */
export function isTournamentPast(): boolean {
  if (!tournamentConfig.date) return true;
  
  const tournamentDate = new Date(tournamentConfig.date);
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
 * Format date for display
 */
export function formatTournamentDate(): string {
  if (!tournamentConfig.date || !tournamentConfig.time || isTournamentPast()) {
    return 'TBD';
  }
  
  const date = new Date(tournamentConfig.date);
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
  
  const date = new Date(tournamentConfig.date);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
