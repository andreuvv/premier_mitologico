export interface Player {
  name: string;
  confirmed: boolean;
}

export interface Match {
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
}

export interface Round {
  number: number;
  format: 'PB' | 'BF';
  matches: Match[];
}

// Update this list as players confirm/cancel
export const players: Player[] = [
  { name: 'Troke', confirmed: true },
  { name: 'Timmy', confirmed: true },
  { name: 'Wesh', confirmed: true },
  { name: 'Folo', confirmed: true },
  { name: 'Piter', confirmed: true },
  { name: 'Clanso', confirmed: true },
  { name: 'Chisco', confirmed: true },
  { name: 'Traukolin', confirmed: true },
  { name: 'Chester', confirmed: true },
  { name: 'David', confirmed: true },
];

// Generate fixture rounds based on confirmed players
export const generateRounds = (): Round[] => {
  const confirmedPlayers = players.filter(p => p.confirmed).map(p => p.name);
  const numPlayers = confirmedPlayers.length;
  const numRounds = numPlayers - 1;
  
  const rounds: Round[] = [];
  
  for (let i = 0; i < numRounds; i++) {
    const format = i % 2 === 0 ? 'PB' : 'BF'; // Alternate, starting with PB
    rounds.push({
      number: i + 1,
      format,
      matches: [], // Empty matches to be filled manually or by algorithm
    });
  }
  
  return rounds;
};

// Manually set fixture matches (update this each tournament)
// Total rounds = numPlayers - 1 (for 10 players = 9 rounds)
export const fixtureRounds: Round[] = [
  {
    number: 1,
    format: 'PB',
    matches: [
      { player1: 'Troke', player2: 'Timmy', score1: null, score2: null },
      { player1: 'Wesh', player2: 'Folo', score1: null, score2: null },
      { player1: 'Piter', player2: 'Clanso', score1: null, score2: null },
      { player1: 'Chisco', player2: 'Traukolin', score1: null, score2: null },
      { player1: 'Chester', player2: 'David', score1: null, score2: null },
    ],
  },
  {
    number: 2,
    format: 'BF',
    matches: [
      { player1: 'Timmy', player2: 'Wesh', score1: null, score2: null },
      { player1: 'Folo', player2: 'Piter', score1: null, score2: null },
      { player1: 'Clanso', player2: 'Chisco', score1: null, score2: null },
      { player1: 'Traukolin', player2: 'Chester', score1: null, score2: null },
      { player1: 'David', player2: 'Troke', score1: null, score2: null },
    ],
  },
  {
    number: 3,
    format: 'PB',
    matches: [
      { player1: 'Troke', player2: 'Wesh', score1: null, score2: null },
      { player1: 'Timmy', player2: 'Folo', score1: null, score2: null },
      { player1: 'Piter', player2: 'Chisco', score1: null, score2: null },
      { player1: 'Clanso', player2: 'Traukolin', score1: null, score2: null },
      { player1: 'Chester', player2: 'David', score1: null, score2: null },
    ],
  },
  {
    number: 4,
    format: 'BF',
    matches: [
      { player1: 'Folo', player2: 'Troke', score1: null, score2: null },
      { player1: 'Wesh', player2: 'Timmy', score1: null, score2: null },
      { player1: 'Chisco', player2: 'Clanso', score1: null, score2: null },
      { player1: 'Traukolin', player2: 'Piter', score1: null, score2: null },
      { player1: 'David', player2: 'Chester', score1: null, score2: null },
    ],
  },
  {
    number: 5,
    format: 'PB',
    matches: [
      { player1: 'Troke', player2: 'Piter', score1: null, score2: null },
      { player1: 'Timmy', player2: 'Clanso', score1: null, score2: null },
      { player1: 'Wesh', player2: 'Chisco', score1: null, score2: null },
      { player1: 'Folo', player2: 'Traukolin', score1: null, score2: null },
      { player1: 'Chester', player2: 'David', score1: null, score2: null },
    ],
  },
  {
    number: 6,
    format: 'BF',
    matches: [
      { player1: 'Clanso', player2: 'Troke', score1: null, score2: null },
      { player1: 'Piter', player2: 'Timmy', score1: null, score2: null },
      { player1: 'Chisco', player2: 'Wesh', score1: null, score2: null },
      { player1: 'Traukolin', player2: 'Folo', score1: null, score2: null },
      { player1: 'David', player2: 'Chester', score1: null, score2: null },
    ],
  },
  {
    number: 7,
    format: 'PB',
    matches: [
      { player1: 'Troke', player2: 'Chisco', score1: null, score2: null },
      { player1: 'Timmy', player2: 'Traukolin', score1: null, score2: null },
      { player1: 'Wesh', player2: 'Clanso', score1: null, score2: null },
      { player1: 'Folo', player2: 'Piter', score1: null, score2: null },
      { player1: 'Chester', player2: 'David', score1: null, score2: null },
    ],
  },
  {
    number: 8,
    format: 'BF',
    matches: [
      { player1: 'Traukolin', player2: 'Troke', score1: null, score2: null },
      { player1: 'Chisco', player2: 'Timmy', score1: null, score2: null },
      { player1: 'Clanso', player2: 'Folo', score1: null, score2: null },
      { player1: 'Piter', player2: 'Wesh', score1: null, score2: null },
      { player1: 'David', player2: 'Chester', score1: null, score2: null },
    ],
  },
  {
    number: 9,
    format: 'PB',
    matches: [
      { player1: 'Troke', player2: 'Chester', score1: null, score2: null },
      { player1: 'Timmy', player2: 'David', score1: null, score2: null },
      { player1: 'Wesh', player2: 'Traukolin', score1: null, score2: null },
      { player1: 'Folo', player2: 'Chisco', score1: null, score2: null },
      { player1: 'Piter', player2: 'Clanso', score1: null, score2: null },
    ],
  },
];
