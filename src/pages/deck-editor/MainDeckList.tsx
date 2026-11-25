import { CollectionCard } from '../../types/collection';
import DeckCardRow from './DeckCardRow';
import { DeckGroups, TYPE_DISPLAY, getCoverImageStyle, sortedTypeKeys } from './deckEditorUtils';
import styles from '../DeckBuilderEditorPage.module.css';

export type CoverSettings = {
  imageUrl?: string;
  zoom: number;
  posX: number;
  posY: number;
};

interface MainDeckListProps {
  deckByType: DeckGroups;
  cover: CoverSettings;
  onCoverImageChange: (url: string | undefined) => void;
  onZoomChange: (zoom: number) => void;
  onPosXChange: (posX: number) => void;
  onPosYChange: (posY: number) => void;
  onSelectCard: (card: CollectionCard) => void;
  onAdd: (card: CollectionCard) => void;
  onRemove: (cardId: number) => void;
}

export default function MainDeckList({
  deckByType, cover, onCoverImageChange, onZoomChange, onPosXChange, onPosYChange,
  onSelectCard, onAdd, onRemove,
}: MainDeckListProps) {
  const { imageUrl: headerImageUrl, zoom: headerZoom, posX: headerPosX, posY: headerPosY } = cover;
  const typeKeys = sortedTypeKeys(deckByType);

  return (
    <section className={styles.deckSection}>
      <h3 className={styles.sectionTitle}>🃏 Cartas del mazo</h3>
      <p className={styles.coverHint}>
        {headerImageUrl
          ? 'Portada activa. Presiona ★ en otra carta para cambiarla o en la misma para quitarla.'
          : 'Tip: presiona ★ en una carta del mazo para usarla como portada.'}
      </p>
      {headerImageUrl && (
        <div className={styles.coverControls}>
          <div className={styles.coverPreview}>
            <div
              className={styles.coverPreviewImage}
              style={{
                backgroundImage: `url(${headerImageUrl})`,
                ...getCoverImageStyle(headerZoom, headerPosX, headerPosY),
              }}
              aria-label="Vista previa portada"
            />
          </div>
          <label className={styles.coverControlRow}>
            <span>Zoom ({headerZoom.toFixed(2)}x)</span>
            <input
              type="range"
              min={1}
              max={2}
              step={0.01}
              value={headerZoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
            />
          </label>
          <label className={styles.coverControlRow}>
            <span>Posición horizontal ({Math.round(headerPosX)}%)</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={headerPosX}
              onChange={(e) => onPosXChange(Number(e.target.value))}
            />
          </label>
          <label className={styles.coverControlRow}>
            <span>Posición vertical ({Math.round(headerPosY)}%)</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={headerPosY}
              onChange={(e) => onPosYChange(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className={styles.coverResetBtn}
            onClick={() => {
              onZoomChange(1);
              onPosXChange(50);
              onPosYChange(50);
            }}
          >
            Reset portada
          </button>
        </div>
      )}
      {typeKeys.length === 0 ? (
        <p className={styles.deckEmpty}>Agrega cartas desde la grilla</p>
      ) : (
        typeKeys.map((type) => {
          const items = deckByType[type];
          const groupCount = items.reduce((s, i) => s + i.count, 0);
          return (
            <div key={type} className={styles.deckTypeGroup}>
              <div className={styles.deckTypeHeader}>
                <span>{TYPE_DISPLAY[type] ?? type}</span>
                <span className={styles.deckTypeCount}>{groupCount}</span>
              </div>
              {items.map(({ card, count }) => {
                const isCover = headerImageUrl === card.imageUrl;
                return (
                  <DeckCardRow
                    key={card.id}
                    card={card}
                    count={count}
                    onSelect={onSelectCard}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    cover={{
                      isCover,
                      onToggle: () => onCoverImageChange(isCover ? undefined : card.imageUrl),
                    }}
                  />
                );
              })}
            </div>
          );
        })
      )}
    </section>
  );
}
