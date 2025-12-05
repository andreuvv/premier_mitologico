// Test script to create sample fixture data
// Run with: node testFixture.js

const API_URL = 'https://myltournamentbackend-production.up.railway.app/api';
const API_KEY = 'tournament_myl_secret_2025';

const sampleFixture = {
  players: [
    { name: "Troke", confirmed: true },
    { name: "Timmy", confirmed: true },
    { name: "Wesh", confirmed: true },
    { name: "Folo", confirmed: true },
    { name: "Piter", confirmed: true },
    { name: "Clanso", confirmed: true },
    { name: "Chisco", confirmed: true },
    { name: "Traukolin", confirmed: true },
    { name: "Chester", confirmed: true },
    { name: "David", confirmed: true }
  ],
  rounds: [
    {
      round_number: 1,
      format: "PB",
      matches: [
        { player1_name: "Troke", player2_name: "Timmy" },
        { player1_name: "Wesh", player2_name: "Folo" },
        { player1_name: "Piter", player2_name: "Clanso" },
        { player1_name: "Chisco", player2_name: "Traukolin" },
        { player1_name: "Chester", player2_name: "David" }
      ]
    },
    {
      round_number: 2,
      format: "BF",
      matches: [
        { player1_name: "Timmy", player2_name: "Wesh" },
        { player1_name: "Folo", player2_name: "Piter" },
        { player1_name: "Clanso", player2_name: "Chisco" },
        { player1_name: "Traukolin", player2_name: "Chester" },
        { player1_name: "David", player2_name: "Troke" }
      ]
    }
  ]
};

async function createFixture() {
  try {
    const response = await fetch(`${API_URL}/fixture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(sampleFixture)
    });

    const data = await response.json();
    console.log('✅ Fixture created successfully:', data);
  } catch (error) {
    console.error('❌ Error creating fixture:', error);
  }
}

createFixture();
