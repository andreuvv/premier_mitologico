# Tournament Configuration Guide

This guide explains how to update the tournament information displayed on the home page.

## Configuration File

All tournament settings are centralized in:
```
src/config/tournamentConfig.ts
```

## How to Update Tournament Information

### 1. Tournament Name and Date

```typescript
name: 'Copa K&T',
date: '2025-12-13', // Format: YYYY-MM-DD
time: '15:00',      // Format: HH:MM (24-hour)
```

- **name**: The tournament name (appears in the page title)
- **date**: Tournament date in YYYY-MM-DD format
- **time**: Tournament start time in 24-hour format (HH:MM)

### 2. Location

```typescript
location: {
  name: 'Donde los Karens',
  address: 'Las Tórtolas 3273, Macul, Santiago',
  googleMapsQuery: 'Las+Tórtolas+3273,+Macul,+Santiago',
}
```

- **name**: Venue name
- **address**: Full address
- **googleMapsQuery**: URL-encoded address for Google Maps embed (use `+` for spaces)

### 3. Formats

```typescript
formats: [
  {
    name: 'Primer Bloque Racial Libre',
    link: '/game-formats#primerBloqueRacialLibre',
  },
  {
    name: 'Furia Extendido Racial Libre',
    link: '/game-formats#bloqueFuriaRacialLibre',
  },
]
```

Add or remove format objects as needed. Each format needs:
- **name**: Display name of the format
- **link**: Internal link to format details page

### 4. Round Type

```typescript
roundType: {
  name: 'Mejor de 3',
  link: '/tournament-info#md3',
}
```

- **name**: Round type name (e.g., "Mejor de 3", "Mejor de 1")
- **link**: Internal link to round type explanation

## TBD Mode

The website automatically displays "TBD" when:

1. **Date is set to `null`**:
   ```typescript
   date: null,
   ```

2. **Tournament date has passed by 1 full day**:
   - If tournament date is December 13, 2025
   - On December 15, 2025 or later, it will show "TBD"

### What Changes in TBD Mode:

1. **Page Title**: Shows tournament name + **_TBD_** (bold + italic)
2. **Countdown Card**: 
   - Date shows "TBD"
   - Countdown timer replaced with "TBD" text
3. **Map Card**:
   - Location shows "TBD"
   - Address shows "Ubicación de Torneo No Definida"
   - Map replaced with message "Ubicación de Torneo No Definida"

## Example Scenarios

### Active Tournament (Shows Normal Info)

```typescript
export const tournamentConfig: TournamentConfig = {
  name: 'Copa K&T',
  date: '2025-12-20', // Future date
  time: '15:00',
  location: {
    name: 'Donde los Karens',
    address: 'Las Tórtolas 3273, Macul, Santiago',
    googleMapsQuery: 'Las+Tórtolas+3273,+Macul,+Santiago',
  },
  // ... formats and roundType
};
```

Result: Normal display with countdown and map

### TBD Mode (Manual)

```typescript
export const tournamentConfig: TournamentConfig = {
  name: 'Copa K&T',
  date: null, // Set to null for TBD
  time: null,
  location: {
    name: null,
    address: null,
    googleMapsQuery: null,
  },
  // ... formats and roundType
};
```

Result: Shows TBD everywhere

### TBD Mode (Automatic - Past Tournament)

```typescript
export const tournamentConfig: TournamentConfig = {
  name: 'Copa K&T',
  date: '2025-12-13', // Date in the past
  time: '15:00',
  // ... rest of config
};
```

If today is December 15, 2025 or later → Shows TBD automatically

## Tips

1. **Always update the date** when planning a new tournament
2. **Use null values** if information is truly undefined
3. **URL encode the Google Maps query** (replace spaces with `+`)
4. **Test locally** before deploying to production
5. **Keep format links consistent** with your routes

## Deployment

After updating the configuration:

```bash
npm run deploy
```

The changes will be reflected on your GitHub Pages site.
