const API_BASE_URL = 'https://myltournamentbackend-production.up.railway.app/api';
const API_KEY = 'tournament_myl_secret_2025';

async function testStandings() {
  console.log('🔄 Testing Standings API...\n');

  try {
    // Fetch current standings
    console.log('📊 Fetching standings...');
    const response = await fetch(`${API_BASE_URL}/standings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const standings = await response.json();
    
    console.log('\n✅ Standings retrieved successfully!\n');
    console.log('=== TABLA DE POSICIONES ===\n');
    console.log('Pos | Jugador          | PJ | G  | P  | Pts | PF  | PC  | Dif');
    console.log('----+------------------+----+----+----+-----+-----+-----+-----');
    
    standings.forEach((player, index) => {
      const position = (index + 1).toString().padStart(3);
      const name = player.name.padEnd(16);
      const matchesPlayed = player.matches_played.toString().padStart(2);
      const wins = player.wins.toString().padStart(2);
      const losses = player.losses.toString().padStart(2);
      const points = (player.wins * 3).toString().padStart(3);
      const pointsFor = player.total_points_scored.toString().padStart(3);
      const pointsAgainst = player.total_points_against.toString().padStart(3);
      const diff = (player.total_points_scored - player.total_points_against).toString().padStart(4);
      
      console.log(`${position} | ${name} | ${matchesPlayed} | ${wins} | ${losses} | ${points} | ${pointsFor} | ${pointsAgainst} | ${diff}`);
    });

    console.log('\n📈 Statistics:');
    console.log(`   Total players: ${standings.length}`);
    console.log(`   Players with wins: ${standings.filter(p => p.wins > 0).length}`);
    console.log(`   Players with matches: ${standings.filter(p => p.matches_played > 0).length}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testStandings();
