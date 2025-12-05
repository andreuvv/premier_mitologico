# Ban List Summary - Monthly Update Guide

## How to Update Monthly Summaries

Each month, update the file: `src/data/banlistSummary.ts`

### Steps:

1. **Update the month** at the bottom of the file:
```typescript
export const lastUpdateMonth = 'Enero 2026'; // Change this to current month
```

2. **Update the changes for each format**:
```typescript
export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    { card: 'Card Name', pastMonth: 'Previous Status', currentMonth: 'New Status' },
    // Add more cards that changed
  ],
  // ... other formats
};
```

### Status Options:
- `'Libre'` - Card is unrestricted
- `'Limitada x1'` - Limited to 1 copy
- `'Limitada x2'` - Limited to 2 copies
- `'Baneada'` - Card is banned

### Example:

```typescript
[BanListFormat.BLOQUE_FURIA_LIBRE]: [
  { card: 'Dragón Dorado', pastMonth: 'Libre', currentMonth: 'Limitada x1' },
  { card: 'Espada de Luz', pastMonth: 'Limitada x2', currentMonth: 'Baneada' },
  { card: 'Escudo Sagrado', pastMonth: 'Baneada', currentMonth: 'Limitada x1' },
],
```

### If No Changes:
Simply leave the array empty:
```typescript
[BanListFormat.PRIMER_BLOQUE_EDICION]: [],
```

This will display "Sin cambios" in the card.

---

## Full File Structure:

The file should always have this structure:

```typescript
import { BanListFormat } from '../types/banlist';

export interface FormatSummary {
  card: string;
  pastMonth: string;
  currentMonth: string;
}

export const banlistSummaries: Record<BanListFormat, FormatSummary[]> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: [
    // Your changes here
  ],
  [BanListFormat.PRIMER_BLOQUE_EDICION]: [
    // Your changes here
  ],
  [BanListFormat.BLOQUE_FURIA_LIBRE]: [
    // Your changes here
  ],
  [BanListFormat.BLOQUE_FURIA_LIMITED]: [
    // Your changes here
  ],
};

export const lastUpdateMonth = 'Diciembre 2025'; // Update this!
```

After updating, commit and deploy as usual:
```bash
git add .
git commit -m "Update banlist summary for [Month Year]"
git push
npm run deploy
```
