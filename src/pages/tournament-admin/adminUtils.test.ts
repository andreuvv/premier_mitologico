import { describe, expect, it } from 'vitest';
import { emptyForm, monthYearOf, nextStep, raceSides, rosterRaces, sameForm, tournamentSteps, type ProgressInput } from './adminUtils';

const base: ProgressInput = {
  hasTournament: true, playerCount: 8, racesComplete: 8, pairingMode: 'progressive', roundCount: 3,
  includeExtra: true, regularRoundsSaved: 0, hasFinalRound: false, matchesDone: 0, matchesTotal: 0,
};

describe('tournament steps', () => {
  it('starts at "torneo" without an active tournament and disables the rest', () => {
    const steps = tournamentSteps({ ...base, hasTournament: false, playerCount: 0, racesComplete: 0 });
    expect(nextStep(steps)).toBe('torneo');
    expect(steps.filter((s) => s.disabled).map((s) => s.id)).toEqual(['razas', 'rondas', 'marcadores', 'cerrar']);
  });

  it('asks for races, then rounds, then scores of the saved round', () => {
    expect(nextStep(tournamentSteps({ ...base, racesComplete: 5 }))).toBe('razas');
    expect(nextStep(tournamentSteps(base))).toBe('rondas');
    expect(nextStep(tournamentSteps({ ...base, regularRoundsSaved: 1, matchesDone: 1, matchesTotal: 4 }))).toBe('marcadores');
    expect(nextStep(tournamentSteps({ ...base, regularRoundsSaved: 1, matchesDone: 4, matchesTotal: 4 }))).toBe('rondas');
  });

  it('needs the final round when the extra round is on, then goes to close', () => {
    const allRegular = { ...base, regularRoundsSaved: 3, matchesDone: 12, matchesTotal: 12 };
    expect(nextStep(tournamentSteps(allRegular))).toBe('rondas');
    expect(nextStep(tournamentSteps({ ...allRegular, hasFinalRound: true, matchesTotal: 14, matchesDone: 14 }))).toBe('cerrar');
    expect(nextStep(tournamentSteps({ ...allRegular, includeExtra: false }))).toBe('cerrar');
  });

  it('counts a fixed fixture as done once saved', () => {
    const steps = tournamentSteps({ ...base, pairingMode: 'fixed', regularRoundsSaved: 7, hasFinalRound: true, matchesTotal: 28, matchesDone: 3 });
    expect(steps.find((s) => s.id === 'rondas')?.done).toBe(true);
    expect(nextStep(steps)).toBe('marcadores');
  });
});

describe('form helpers', () => {
  it('compares forms ignoring player order', () => {
    const a = { ...emptyForm(new Date(2026, 10, 1)), playerIds: [3, 1, 2] };
    expect(sameForm(a, { ...a, playerIds: [1, 2, 3] })).toBe(true);
    expect(sameForm(a, { ...a, name: 'X' })).toBe(false);
  });

  it('reads month and year from a date', () => {
    expect(monthYearOf('2026-11-28')).toEqual({ month: 'Noviembre', year: 2026 });
    expect(monthYearOf('')).toBeNull();
  });

  it('maps race columns to blocks', () => {
    expect(raceSides('PBFX')).toEqual(['PB', 'FX']);
    expect(raceSides('PB')).toEqual(['PB', 'PB']);
    expect(raceSides('FX')).toEqual(['FX', 'FX']);
  });
});

describe('rosterRaces', () => {
  it('reads only the active tournament rows, even when older rows come first', () => {
    const rows = [
      { tournament_id: 4, player_id: 1, race_format1: 'Caballero', race_format2: 'Bestia' },
      { tournament_id: 22, player_id: 1, race_format1: 'Eterno', race_format2: 'Guerrero' },
      { tournament_id: 22, player_id: 6, race_format1: null, race_format2: null },
    ];
    expect(rosterRaces(rows, 22, [1, 6, 9])).toEqual({
      1: { race1: 'Eterno', race2: 'Guerrero' },
      6: { race1: '', race2: '' },
      9: { race1: '', race2: '' },
    });
  });
});
