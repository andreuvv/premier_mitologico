import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { useDeckRules, type DeckRulesResult, type DeckSubformat } from './useDeckRules';
import type { CollectionCard } from '../types/collection';
import type { BanListData } from '../types/banlist';

// useDeckRules only uses useMemo, so a server render is enough to run it.
type DeckRulesProps = Parameters<typeof useDeckRules>[0];

function Probe({ props, onResult }: { props: DeckRulesProps; onResult: (result: DeckRulesResult) => void }) {
  onResult(useDeckRules(props));
  return null;
}

function runDeckRules(props: DeckRulesProps): DeckRulesResult {
  let result: DeckRulesResult | undefined;
  renderToString(<Probe props={props} onResult={(value) => { result = value; }} />);
  return result as DeckRulesResult;
}

let nextId = 1;
function card(name: string, type: string, extra: Partial<CollectionCard> = {}): CollectionCard {
  return {
    id: nextId++,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    gameId: 1,
    collectorCode: '',
    effect: 'Habilidad',
    type,
    cost: 2,
    attack: 1,
    imageUrl: '',
    artist: '',
    frequency: 'VASALLO',
    race: [],
    edition: { name: 'Espada Sagrada', slug: 'espada-sagrada', __typename: 'Edition' },
    game: { name: 'MyL', slug: 'myl', __typename: 'Game' },
    __typename: 'Card',
    ...extra,
  };
}

const banlist = (overrides: Partial<BanListData>): BanListData => ({
  format: 'pb_libre',
  lastUpdated: '',
  banned: [],
  limitedX1: [],
  limitedX2: [],
  ...overrides,
});

function rules(options: {
  cards: CollectionCard[];
  deck?: Record<number, number>;
  sideDeck?: Record<number, number>;
  subformat?: DeckSubformat;
  race?: string;
  banlist?: BanListData | null;
  lockedEdition?: string | null;
  isDraft?: boolean;
}) {
  return runDeckRules({
    subformat: options.subformat ?? 'pb-libre',
    race: options.race ?? 'Caballero',
    allCards: options.cards,
    deckCards: options.deck ?? {},
    sideDeck: options.sideDeck,
    banlist: options.banlist ?? null,
    lockedEdition: options.lockedEdition ?? null,
    isDraft: options.isDraft,
  });
}

describe('copy limits', () => {
  const normal = card('Excalibur', 'ARMA');
  const unique = card('Rey Arturo', 'ALIADO', { unique: true, race: ['Caballero'] });
  const oro = card('Oro', 'ORO', { effect: 'Oro sin habilidad.', moreThan3: true });

  it('allows 3 copies by default, 1 for unique cards and unlimited when moreThan3', () => {
    const r = rules({ cards: [normal, unique, oro] });
    expect(r.getHardMax(normal)).toBe(3);
    expect(r.getHardMax(unique)).toBe(1);
    expect(r.getHardMax(oro)).toBe(Infinity);
  });

  it('applies the banlist before any other rule', () => {
    const r = rules({
      cards: [normal, unique],
      banlist: banlist({
        banned: [{ name: 'Excalibur', type: 'Arma', imageUrl: '' }],
        limitedX2: [{ name: 'Rey Arturo', type: 'Aliado', imageUrl: '' }],
      }),
    });
    expect(r.getHardMax(normal)).toBe(0);
    expect(r.canAdd(normal)).toBe(false);
    expect(r.getHardMax(unique)).toBe(2);
  });

  it('in FX Ragnarok every card is unique except Oro sin habilidad', () => {
    const r = rules({ cards: [normal, oro], subformat: 'fx-ragnarok' });
    expect(r.getHardMax(normal)).toBe(1);
    expect(r.getHardMax(oro)).toBe(Infinity);
  });

  it('counts reprints (same name and type) and the sidedeck toward the limit', () => {
    const reprint = card('Excalibur', 'ARMA', { edition: { name: 'Helénica', slug: 'helenica', __typename: 'Edition' } });
    const r = rules({ cards: [normal, reprint], deck: { [normal.id]: 2 }, sideDeck: { [reprint.id]: 1 } });
    expect(r.getGroupCount(reprint)).toBe(3);
    expect(r.availableToAdd(reprint)).toBe(0);
  });
});

describe('card visibility', () => {
  it('only shows allies of the deck race (ignoring accents and case)', () => {
    const caballero = card('Lancelot', 'ALIADO', { race: ['Caballero'] });
    const dragon = card('Dragón', 'ALIADO', { race: ['Dragón'] });
    const r = rules({ cards: [caballero, dragon], race: 'CABALLÉRO' });
    expect(r.isCardVisible(caballero)).toBe(true);
    expect(r.isCardVisible(dragon)).toBe(false);
  });

  it('hides the old version of a card that has a rework', () => {
    const old = card('Merlín', 'TALISMAN');
    const rework = card('Merlín', 'TALISMAN', { isRework: true });
    const r = rules({ cards: [old, rework] });
    expect(r.isCardVisible(old)).toBe(false);
    expect(r.isCardVisible(rework)).toBe(true);
  });

  it('in a Tótem deck the first ally locks the ally race', () => {
    const faerie = card('Hada', 'ALIADO', { race: ['Faerie'] });
    const titan = card('Titán', 'ALIADO', { race: ['Titán'] });
    const before = rules({ cards: [faerie, titan], subformat: 'fx-libre', race: 'Tótem' });
    expect(before.isCardVisible(titan)).toBe(true);
    const after = rules({ cards: [faerie, titan], subformat: 'fx-libre', race: 'Tótem', deck: { [faerie.id]: 1 } });
    expect(after.isCardVisible(titan)).toBe(false);
    expect(after.isCardVisible(faerie)).toBe(true);
  });

  it('in Racial Edición a locked edition hides other editions, except Oros Iniciales Teams', () => {
    const fromLocked = card('Arquero', 'ARMA');
    const fromOther = card('Lanza', 'ARMA', { edition: { name: 'Helénica', slug: 'helenica', __typename: 'Edition' } });
    const teamsOro = card('Oro Team', 'ORO', {
      edition: { name: 'Oros Iniciales Teams', slug: 'oros-iniciales-teams', __typename: 'Edition' },
    });
    const r = rules({ cards: [fromLocked, fromOther, teamsOro], subformat: 'pb-edicion', lockedEdition: 'espada-sagrada' });
    expect(r.isCardVisible(fromLocked)).toBe(true);
    expect(r.isCardVisible(fromOther)).toBe(false);
    expect(r.isCardVisible(teamsOro)).toBe(true);
  });
});

describe('deck validation', () => {
  const allies = Array.from({ length: 6 }, (_, index) => card(`Caballero ${index}`, 'ALIADO', { race: ['Caballero'] }));
  const oro = card('Oro', 'ORO', { effect: '<p>Oro sin habilidad.</p>', moreThan3: true });

  it('accepts a legal 50-card deck', () => {
    const deck = Object.fromEntries([...allies.map((a) => [a.id, 3]), [oro.id, 32]]);
    const r = rules({ cards: [...allies, oro], deck });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it('requires 16 allies and an Oro sin habilidad, and warns about missing cards', () => {
    const r = rules({ cards: [...allies, oro], deck: { [allies[0].id]: 3 } });
    expect(r.errors).toContain('Necesitas al menos 16 Aliados (tienes 3)');
    expect(r.errors).toContain('Necesitas al menos 1 Oro sin habilidad');
    expect(r.warnings).toContain('Faltan 47 cartas para completar el mazo (3/50)');
  });

  it('rejects more than 50 cards and too many copies', () => {
    const deck = Object.fromEntries([...allies.map((a) => [a.id, 3]), [oro.id, 32], [allies[0].id, 4]]);
    const r = rules({ cards: [...allies, oro], deck });
    expect(r.errors).toContain('El mazo tiene 51 cartas (máximo 50)');
    expect(r.errors).toContain('"Caballero 0": máximo 3 copias (tienes 4)');
  });

  it('does not report the deck size while it is a draft', () => {
    const r = rules({ cards: [...allies, oro], deck: { [oro.id]: 1 }, isDraft: true });
    expect(r.warnings).toEqual([]);
  });
});
