# Fixture Update Guide

## How to Update Fixture Data

Update the file: `src/data/fixtureData.ts`

### Step 1: Update Confirmed Players

At the top of the file, update the `players` array to match the participants list:

```typescript
export const players: Player[] = [
  { name: 'PlayerName', confirmed: true },  // Set confirmed: false if they cancel
  // Add new players or update existing ones
];
```

**Match this with `public/assets/markdown/tournament_info/participants.md`**

### Step 2: Update Fixture Rounds

The `fixtureRounds` array contains all the matches. Update it each tournament:

```typescript
export const fixtureRounds: Round[] = [
  {
    number: 1,           // Round number
    format: 'PB',        // 'PB' or 'BF'
    matches: [
      { 
        player1: 'PlayerA', 
        player2: 'PlayerB', 
        score1: null,      // Set to number when match is played
        score2: null 
      },
      // Add more matches
    ],
  },
  // Add more rounds
];
```

### Round Format Pattern

Rounds alternate between formats, **starting with PB**:
- Round 1: PB (Primer Bloque)
- Round 2: BF (Bloque Furia)
- Round 3: PB
- Round 4: BF
- And so on...

### Number of Rounds

**Total rounds = Number of confirmed players - 1**

Examples:
- 10 players → 9 rounds
- 8 players → 7 rounds
- 12 players → 11 rounds

### Updating Scores

When matches are played, update the scores:

```typescript
{ 
  player1: 'Troke', 
  player2: 'Timmy', 
  score1: 2,    // Troke won 2 games
  score2: 1     // Timmy won 1 game
}
```

Leave as `null` for matches not yet played:

```typescript
{ player1: 'Chester', player2: 'David', score1: null, score2: null }
```

### Complete Example

```typescript
export const fixtureRounds: Round[] = [
  {
    number: 1,
    format: 'PB',
    matches: [
      { player1: 'Troke', player2: 'Timmy', score1: 2, score2: 1 },
      { player1: 'Wesh', player2: 'Folo', score1: null, score2: null },
    ],
  },
  {
    number: 2,
    format: 'BF',
    matches: [
      { player1: 'Timmy', player2: 'Wesh', score1: null, score2: null },
      { player1: 'Folo', player2: 'Piter', score1: null, score2: null },
    ],
  },
];
```

---

## Quick Checklist

- [ ] Update `players` array with current participants
- [ ] Set correct number of rounds (players - 1)
- [ ] Alternate formats starting with PB
- [ ] Fill in match pairings
- [ ] Update scores as matches are played
- [ ] Commit and deploy

After updating:
```bash
git add .
git commit -m "Update fixture for [Tournament Name]"
git push
npm run deploy
```
