import { CollectionCard } from '../../types/collection';
import { sameEdition } from '../../utils/editionName';
import BrowserCardItem from './BrowserCardItem';
import { CardBrowserFilters } from './useCardBrowserFilters';
import { CARDS_PER_PAGE, DECK_SIZE, DeckTarget, OroFilter, TYPE_TABS } from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

interface CardBrowserProps {
  filters: CardBrowserFilters;
  showEditionBrowserFilter: boolean;
  target: DeckTarget;
  onTargetChange: (target: DeckTarget) => void;
  deckCards: Record<number, number>;
  sideDeck: Record<number, number>;
  totalDeckCount: number;
  totalSideCount: number;
  sideMax: number;
  getGroupCount: (card: CollectionCard) => number;
  getHardMax: (card: CollectionCard) => number;
  canAddToMain: (card: CollectionCard) => boolean;
  canAddToSide: (card: CollectionCard) => boolean;
  isInCollection: (card: CollectionCard) => boolean;
  onSelectCard: (card: CollectionCard) => void;
  onAdd: (card: CollectionCard) => void;
  onRemove: (cardId: number) => void;
}

export default function CardBrowser({
  filters, showEditionBrowserFilter, target, onTargetChange,
  deckCards, sideDeck, totalDeckCount, totalSideCount, sideMax,
  getGroupCount, getHardMax, canAddToMain, canAddToSide, isInCollection,
  onSelectCard, onAdd, onRemove,
}: CardBrowserProps) {
  const {
    search, setSearch, editionFilter, setEditionFilter, typeFilter, selectType,
    oroFilter, setOroFilter, frequencyFilter, setFrequencyFilter, costFilter, setCostFilter,
    attackFilter, setAttackFilter, page, setPage, totalPages, filteredCards, paginatedCards,
    browserEditionOptions, costOptions, frequencyOptions, attackOptions,
  } = filters;

  return (
    <div className={styles.cardBrowser}>
      {/* Search row */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscar cartas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.pageInfo}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹
          </button>
          <span>
            {page}/{totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            ›
          </button>
          <span className={styles.pageRange}>
            {(page - 1) * CARDS_PER_PAGE + 1}–
            {Math.min(page * CARDS_PER_PAGE, filteredCards.length)} de{' '}
            {filteredCards.length}
          </span>
        </div>
      </div>

      {/* Target selector: main deck vs sidedeck */}
      <div className={styles.targetToggle}>
        <span className={styles.targetToggleLabel}>Agregar a:</span>
        <button
          type="button"
          className={`${styles.targetBtn} ${target === 'main' ? styles.targetBtnActiveMain : ''}`}
          onClick={() => onTargetChange('main')}
          aria-pressed={target === 'main'}
        >
          Mazo principal <span className={styles.targetBtnCount}>{totalDeckCount}/{DECK_SIZE}</span>
        </button>
        <button
          type="button"
          className={`${styles.targetBtn} ${target === 'side' ? styles.targetBtnActiveSide : ''}`}
          onClick={() => onTargetChange('side')}
          aria-pressed={target === 'side'}
        >
          Sidedeck <span className={styles.targetBtnCount}>{totalSideCount}/{sideMax}</span>
        </button>
      </div>

      {/* Type tabs */}
      <div className={styles.typeTabs}>
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.typeTab} ${typeFilter === tab.value ? styles.typeTabActive : ''}`}
            onClick={() => selectType(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className={styles.filtersRow}>
        {showEditionBrowserFilter && (
          <select
            className={styles.filterSelect}
            value={browserEditionOptions.find((option) => sameEdition(option, editionFilter)) ?? editionFilter}
            onChange={(e) => setEditionFilter(e.target.value)}
          >
            <option value="">Todas las ediciones</option>
            {browserEditionOptions.map((edition) => (
              <option key={edition} value={edition}>
                {edition}
              </option>
            ))}
          </select>
        )}
        {typeFilter === 'Oro' && (
          <select
            className={styles.filterSelect}
            value={oroFilter}
            onChange={(e) => setOroFilter(e.target.value as OroFilter)}
          >
            <option value="all">Todos los oros</option>
            <option value="with">Con habilidad</option>
            <option value="without">Sin habilidad</option>
          </select>
        )}
        <select
          className={styles.filterSelect}
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
        >
          <option value="">Toda frecuencia</option>
          {frequencyOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={costFilter}
          onChange={(e) => setCostFilter(e.target.value)}
        >
          <option value="">Todo coste</option>
          {costOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={attackFilter}
          onChange={(e) => setAttackFilter(e.target.value)}
        >
          <option value="">Toda fuerza</option>
          {attackOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Card grid */}
      <div className={styles.cardGrid}>
        {paginatedCards.map((card) => (
          <BrowserCardItem
            key={card.id}
            card={card}
            target={target}
            mainCount={deckCards[card.id] ?? 0}
            sideCount={sideDeck[card.id] ?? 0}
            groupCount={getGroupCount(card)}
            hardMax={getHardMax(card)}
            canAddMore={target === 'side' ? canAddToSide(card) : canAddToMain(card)}
            isInCollection={isInCollection(card)}
            onSelect={onSelectCard}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationBtn}
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            ← Primera
          </button>
          <button
            className={styles.paginationBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className={styles.paginationLabel}>
            Página {page} de {totalPages}
          </span>
          <button
            className={styles.paginationBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </button>
          <button
            className={styles.paginationBtn}
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            Última →
          </button>
        </div>
      )}
    </div>
  );
}
