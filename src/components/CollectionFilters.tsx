import { useState, useEffect, useRef } from 'react';
import { CollectionCard, CollectionFormat } from '../types/collection';
import styles from './CollectionFilters.module.css';

const PB_RACES = ['Caballero', 'Defensor', 'Desafiante', 'Dragon', 'Eterno', 'Faerie', 'Faraon', 'Heroe', 'Olimpico', 'Sacerdote', 'Sombra', 'Titan'];
const FX_RACES = ['Ancestral', 'Barbaro', 'Bestia', 'Caballero', 'Dragon', 'Eterno', 'Guerrero', 'Heroe', 'Sacerdote', 'Sombra'];
const CARD_TYPES = ['Aliado', 'Arma', 'Totem', 'Talisman', 'Oro'];
const ORO_FILTERS = ['all', 'with', 'without'] as const;

type OroFilter = typeof ORO_FILTERS[number];

export interface FilterParams {
  edition: string | null;
  product: string | null;
  q: string | null;
  type: string | null;
  oro: OroFilter | null;
  race: string | null;
  freq: string | null;
  ownedOnly?: boolean;
  notOwnedOnly?: boolean;
  favoritesOnly?: boolean;
  wishlistOnly?: boolean;
}

interface CollectionFiltersProps {
  allCards: CollectionCard[];
  format: CollectionFormat;
  isOpen: boolean;
  onClose: () => void;
  onFilterChange: (cards: CollectionCard[], params: FilterParams) => void;
  initialEdition?: string | null;
  initialProduct?: string | null;
  initialSearch?: string | null;
  initialType?: string | null;
  initialOro?: OroFilter | null;
  initialRace?: string | null;
  initialFreq?: string | null;
  showOwnedOnlyToggle?: boolean;
  initialOwnedOnly?: boolean;
  initialNotOwnedOnly?: boolean;
  initialFavoritesOnly?: boolean;
  initialWishlistOnly?: boolean;
  defaultCollapsed?: boolean;
}

export default function CollectionFilters({
  allCards, format, isOpen, onClose, onFilterChange,
  initialEdition, initialProduct, initialSearch, initialType, initialOro, initialRace, initialFreq,
  showOwnedOnlyToggle = false, initialOwnedOnly = false, initialNotOwnedOnly = false,
  initialFavoritesOnly = false, initialWishlistOnly = false,
  defaultCollapsed = false,
}: CollectionFiltersProps) {
  const [edition, setEdition] = useState(initialEdition || '');
  const [product, setProduct] = useState(initialProduct || '');
  const [search, setSearch] = useState(initialSearch || '');
  const [type, setType] = useState(initialType || '');
  const [oro, setOro] = useState<OroFilter>(initialOro || 'all');
  const [race, setRace] = useState(initialRace || '');
  const [freq, setFreq] = useState(initialFreq || '');
  const [ownedOnly, setOwnedOnly] = useState(initialOwnedOnly);
  const [notOwnedOnly, setNotOwnedOnly] = useState(initialNotOwnedOnly);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const [wishlistOnly, setWishlistOnly] = useState(initialWishlistOnly);
  const appliedInitialRef = useRef(false);

  const isPB = format === CollectionFormat.PRIMER_BLOQUE;

  // Derive options from loaded cards
  const pbEditions = Array.from(new Map(
    allCards.filter(c => c.edition?.name).map(c => [c.edition!.name, c.edition!.name])
  ).values()).sort();

  const fxEditions = Array.from(new Map(
    allCards.filter(c => c.product?.productType === 'Edición').map(c => [c.product!.productName, c.product!.productName])
  ).values()).sort();

  const fxProducts = Array.from(new Map(
    allCards.filter(c => c.product?.productType === 'Producto Especial').map(c => [c.product!.productName, c.product!.productName])
  ).values()).sort();

  const pbProducts = Array.from(new Map(
    allCards.filter(c => c.cardCategory?.name).map(c => [c.cardCategory!.name, c.cardCategory!.name])
  ).values()).sort();

  const editionOptions = isPB ? pbEditions : fxEditions;
  const productOptions = isPB ? pbProducts : fxProducts;

  const frequencies = Array.from(new Set(
    allCards.filter(c => c.frequency).map(c => c.frequency)
  )).sort();

  const races = isPB ? PB_RACES : FX_RACES;

  const normalizeStr = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const isOroSinHabilidad = (card: CollectionCard) => {
    if (card.type?.toUpperCase() !== 'ORO') return false;
    const text = (card.effect ?? '').replace(/<[^>]*>/g, '').trim().toLowerCase();
    return text === '' || text.includes('oro sin habilidad');
  };

  const applyFilters = (
    e: string,
    p: string,
    s: string,
    t: string,
    oFilter: OroFilter,
    r: string,
    f: string,
    o: boolean = ownedOnly,
    no: boolean = notOwnedOnly,
    fav: boolean = favoritesOnly,
    wish: boolean = wishlistOnly,
  ) => {
    let filtered = allCards;
    const normalizedSearch = normalizeStr(s.trim());

    if (isPB) {
      if (e) filtered = filtered.filter(c => c.edition?.name === e);
      if (p) filtered = filtered.filter(c => c.cardCategory?.name === p);
    } else {
      if (e) filtered = filtered.filter(c => c.product?.productName === e && c.product?.productType === 'Edición');
      if (p) filtered = filtered.filter(c => c.product?.productName === p && c.product?.productType === 'Producto Especial');
    }

    if (normalizedSearch) filtered = filtered.filter(c =>
      normalizeStr(c.name).includes(normalizedSearch) ||
      normalizeStr(c.collectorCode).includes(normalizedSearch)
    );
    if (t) filtered = filtered.filter(c => c.type?.toUpperCase() === t.toUpperCase());
    if (t === 'Oro' && oFilter !== 'all') {
      filtered = filtered.filter(c => {
        if (c.type?.toUpperCase() !== 'ORO') return false;
        const hasSkill = !isOroSinHabilidad(c);
        return oFilter === 'with' ? hasSkill : !hasSkill;
      });
    }
    if (r) filtered = filtered.filter(c => c.race?.some(cr => normalizeStr(cr) === normalizeStr(r)));
    if (f) filtered = filtered.filter(c => c.frequency === f);

    onFilterChange(filtered, {
      edition: e || null,
      product: p || null,
      q: s || null,
      type: t || null,
      oro: t === 'Oro' ? oFilter : null,
      race: r || null,
      freq: f || null,
      ownedOnly: o,
      notOwnedOnly: no,
      favoritesOnly: fav,
      wishlistOnly: wish,
    });
  };

  // Apply initial filter values once when cards are loaded
  useEffect(() => {
    if (appliedInitialRef.current || allCards.length === 0) return;
    appliedInitialRef.current = true;
    applyFilters(edition, product, search, type, oro, race, freq);
  }, [allCards]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditionChange = (val: string) => {
    setEdition(val);
    if (!isPB) setProduct('');
    applyFilters(val, isPB ? product : '', search, type, oro, race, freq);
  };

  const handleProductChange = (val: string) => {
    setProduct(val);
    if (!isPB) setEdition('');
    applyFilters(isPB ? edition : '', val, search, type, oro, race, freq);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    applyFilters(edition, product, val, type, oro, race, freq);
  };

  const handleTypeClick = (val: string) => {
    const newType = type === val ? '' : val;
    const newRace = newType !== 'Aliado' ? '' : race;
    const newOro = newType !== 'Oro' ? 'all' : oro;
    setType(newType);
    if (newType !== 'Oro') setOro('all');
    if (newType !== 'Aliado') setRace('');
    applyFilters(edition, product, search, newType, newOro, newRace, freq);
  };

  const handleOroChange = (val: OroFilter) => {
    setOro(val);
    applyFilters(edition, product, search, type, val, race, freq);
  };

  const handleRaceChange = (val: string) => {
    setRace(val);
    applyFilters(edition, product, search, type, oro, val, freq);
  };

  const handleFreqChange = (val: string) => {
    setFreq(val);
    applyFilters(edition, product, search, type, oro, race, val);
  };

  const handleClear = () => {
    setEdition(''); setProduct(''); setSearch('');
    setType(''); setOro('all'); setRace(''); setFreq('');
    setOwnedOnly(false); setNotOwnedOnly(false);
    setFavoritesOnly(false); setWishlistOnly(false);
    applyFilters('', '', '', '', 'all', '', '', false, false, false, false);
  };

  const handleOwnedOnlyChange = (checked: boolean) => {
    setOwnedOnly(checked);
    if (checked) setNotOwnedOnly(false);
    applyFilters(edition, product, search, type, oro, race, freq, checked, false, favoritesOnly, wishlistOnly);
  };

  const handleNotOwnedOnlyChange = (checked: boolean) => {
    setNotOwnedOnly(checked);
    if (checked) setOwnedOnly(false);
    applyFilters(edition, product, search, type, oro, race, freq, false, checked, favoritesOnly, wishlistOnly);
  };

  const handleFavoritesOnlyChange = (checked: boolean) => {
    setFavoritesOnly(checked);
    applyFilters(edition, product, search, type, oro, race, freq, ownedOnly, notOwnedOnly, checked, wishlistOnly);
  };

  const handleWishlistOnlyChange = (checked: boolean) => {
    setWishlistOnly(checked);
    applyFilters(edition, product, search, type, oro, race, freq, ownedOnly, notOwnedOnly, favoritesOnly, checked);
  };

  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const hasFilters = !!(edition || product || search || type || (type === 'Oro' && oro !== 'all') || race || freq || ownedOnly || notOwnedOnly || favoritesOnly || wishlistOnly);

  return (
    <aside className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Filtros</span>
        <div className={styles.panelActions}>
          {hasFilters && (
            <button className={styles.clearButton} onClick={handleClear}>Limpiar</button>
          )}
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar filtros">✕</button>
          <button
            className={`${styles.chevronButton} ${collapsed ? styles.chevronCollapsed : ''}`}
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expandir filtros' : 'Colapsar filtros'}
          >⌃</button>
        </div>
      </div>

      <div className={`${styles.panelBody} ${collapsed ? styles.panelBodyCollapsed : ''}`}>

      <div className={`${styles.section} ${styles.fieldSearch}`}>
        <label className={styles.label}>Buscar</label>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Nombre o código..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div className={styles.editionRow}>
        <div className={`${styles.section} ${styles.fieldEdition}`}>
          <label className={styles.label}>Edición</label>
          <select
            className={styles.select}
            value={edition}
            onChange={e => handleEditionChange(e.target.value)}
          >
            <option value="">Todas las ediciones</option>
            {editionOptions.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.section} ${styles.fieldProduct}`}>
          <label className={styles.label}>
            {isPB ? 'Producto' : 'Producto Especial'}
          </label>
          <select
            className={styles.select}
            value={product}
            onChange={e => handleProductChange(e.target.value)}
          >
            <option value="">Todos los productos</option>
            {productOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${styles.section} ${styles.fieldType}`}>
        <label className={styles.label}>Tipo</label>
        <div className={styles.typeButtons}>
          {CARD_TYPES.map(t => (
            <button
              key={t}
              className={`${styles.typeButton} ${type === t ? styles.typeButtonActive : ''}`}
              onClick={() => handleTypeClick(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.raceFreqRow} ${type === 'Aliado' ? styles.raceFreqRowActive : ''}`}>
        {type === 'Aliado' && (
          <div className={`${styles.section} ${styles.fieldRace}`}>
            <label className={styles.label}>Raza</label>
            <select
              className={styles.select}
              value={race}
              onChange={e => handleRaceChange(e.target.value)}
            >
              <option value="">Todas las razas</option>
              {races.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {type === 'Oro' && (
          <div className={`${styles.section} ${styles.fieldOro}`}>
            <label className={styles.label}>Habilidad</label>
            <select
              className={styles.select}
              value={oro}
              onChange={e => handleOroChange(e.target.value as OroFilter)}
            >
              <option value="all">Todos los oros</option>
              <option value="with">Con habilidad</option>
              <option value="without">Sin habilidad</option>
            </select>
          </div>
        )}

        <div className={`${styles.section} ${styles.fieldFreq}`}>
          <label className={styles.label}>Frecuencia</label>
          <select
            className={styles.select}
            value={freq}
            onChange={e => handleFreqChange(e.target.value)}
          >
            <option value="">Todas las frecuencias</option>
            {frequencies.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {showOwnedOnlyToggle && (
        <div className={`${styles.section} ${styles.togglesRow}`}>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={ownedOnly}
              onChange={e => handleOwnedOnlyChange(e.target.checked)}
            />
            <span>En Carpeta</span>
          </label>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={notOwnedOnly}
              onChange={e => handleNotOwnedOnlyChange(e.target.checked)}
            />
            <span>No en Carpeta</span>
          </label>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={e => handleFavoritesOnlyChange(e.target.checked)}
            />
            <span>Favoritos</span>
          </label>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={wishlistOnly}
              onChange={e => handleWishlistOnlyChange(e.target.checked)}
            />
            <span>Lista de Deseados</span>
          </label>
        </div>
      )}
      </div>
    </aside>
  );
}
