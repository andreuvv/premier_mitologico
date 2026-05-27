import { useEffect, useMemo, useState } from 'react';
import { CollectionCard, CollectionCatalog, CollectionFormat } from '../types/collection';
import { loadCollectionCards } from '../services/collectionService';
import styles from './LocalJsonEditorPage.module.css';

type LocalCard = CollectionCard & {
  isNewest?: boolean;
  isRework?: boolean;
};

interface LocalCatalog {
  data: {
    CardCatalog: {
      cards: LocalCard[];
      total: number;
      pages: number;
      __typename: string;
    };
  };
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function asLocalCatalog(catalog: CollectionCatalog): LocalCatalog {
  return {
    data: {
      CardCatalog: {
        ...catalog.data.CardCatalog,
        cards: catalog.data.CardCatalog.cards.map((c) => ({ ...c })) as LocalCard[],
      },
    },
  };
}

export default function LocalJsonEditorPage() {
  const [format, setFormat] = useState<CollectionFormat>(CollectionFormat.PRIMER_BLOQUE);
  const [catalog, setCatalog] = useState<LocalCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [showOnlyRepeated, setShowOnlyRepeated] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [rawEditor, setRawEditor] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedCardId(null);
    loadCollectionCards(format)
      .then((data) => setCatalog(asLocalCatalog(data)))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error cargando JSON'))
      .finally(() => setLoading(false));
  }, [format]);

  const cards = catalog?.data.CardCatalog.cards ?? [];

  const frequencyOptions = useMemo(
    () =>
      Array.from(new Set(cards.map((c) => c.frequency).filter((f) => Boolean(f)))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [cards],
  );

  const groupedCards = useMemo(() => {
    const q = normalize(search);
    const filtered = q
      ? cards.filter(
          (c) => normalize(c.name).includes(q) || c.collectorCode.toLowerCase().includes(q),
        )
      : cards;

    const map = new Map<string, LocalCard[]>();
    for (const c of filtered) {
      const key = normalize(c.name);
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }

    const groups = Array.from(map.values())
      .filter((g) => (showOnlyRepeated ? g.length > 1 : true))
      .map((g) => g.sort((a, b) => b.id - a.id))
      .sort((a, b) => a[0].name.localeCompare(b[0].name, 'es'));

    return groups;
  }, [cards, search, showOnlyRepeated]);

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  useEffect(() => {
    if (!selectedCard) {
      setRawEditor('');
      return;
    }
    setRawEditor(JSON.stringify(selectedCard, null, 2));
  }, [selectedCard]);

  const updateCard = (id: number, updater: (card: LocalCard) => LocalCard) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const nextCards = prev.data.CardCatalog.cards.map((c) => (c.id === id ? updater(c) : c));
      return {
        data: {
          CardCatalog: {
            ...prev.data.CardCatalog,
            cards: nextCards,
          },
        },
      };
    });
  };

  const setGroupFlag = (field: 'isNewest' | 'isRework') => {
    if (!selectedCard) return;
    const key = normalize(selectedCard.name);
    setCatalog((prev) => {
      if (!prev) return prev;
      const nextCards = prev.data.CardCatalog.cards.map((c) => {
        if (normalize(c.name) !== key) return c;
        return { ...c, [field]: c.id === selectedCard.id };
      });
      return {
        data: {
          CardCatalog: {
            ...prev.data.CardCatalog,
            cards: nextCards,
          },
        },
      };
    });
  };

  const clearGroupFlag = (field: 'isNewest' | 'isRework') => {
    if (!selectedCard) return;
    const key = normalize(selectedCard.name);
    setCatalog((prev) => {
      if (!prev) return prev;
      const nextCards = prev.data.CardCatalog.cards.map((c) => {
        if (normalize(c.name) !== key) return c;
        const copy = { ...c };
        delete copy[field];
        return copy;
      });
      return {
        data: {
          CardCatalog: {
            ...prev.data.CardCatalog,
            cards: nextCards,
          },
        },
      };
    });
  };

  const applyRawJson = () => {
    if (!selectedCard) return;
    try {
      const parsed = JSON.parse(rawEditor) as LocalCard;
      if (typeof parsed.id !== 'number') {
        window.alert('El JSON debe incluir un id numérico.');
        return;
      }
      updateCard(selectedCard.id, () => parsed);
      setSelectedCardId(parsed.id);
    } catch {
      window.alert('JSON inválido. Revisa la sintaxis.');
    }
  };

  const downloadEditedJson = () => {
    if (!catalog) return;
    const content = JSON.stringify(catalog, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === CollectionFormat.PRIMER_BLOQUE ? 'cartas_pb.json' : 'cartas_fx.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Local JSON Editor</h1>
          <p className={styles.subtitle}>
            Herramienta local para revisar cartas repetidas, marcar isNewest/isRework y editar frecuencia.
          </p>
        </div>
        <button className={styles.exportBtn} onClick={downloadEditedJson} disabled={!catalog}>
          Descargar JSON Editado
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.formatRow}>
          <button
            className={format === CollectionFormat.PRIMER_BLOQUE ? styles.formatBtnActive : styles.formatBtn}
            onClick={() => setFormat(CollectionFormat.PRIMER_BLOQUE)}
          >
            Primer Bloque
          </button>
          <button
            className={format === CollectionFormat.FURIA_EXTENDIDO ? styles.formatBtnActive : styles.formatBtn}
            onClick={() => setFormat(CollectionFormat.FURIA_EXTENDIDO)}
          >
            Furia Extendido
          </button>
        </div>
        <input
          className={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
        />
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={showOnlyRepeated}
            onChange={(e) => setShowOnlyRepeated(e.target.checked)}
          />
          Solo repetidas
        </label>
      </div>

      {loading && <div className={styles.info}>Cargando cartas...</div>}
      {error && <div className={styles.error}>Error: {error}</div>}

      {!loading && !error && (
        <div className={styles.groups}>
          {groupedCards.length === 0 ? (
            <div className={styles.info}>No hay cartas para los filtros actuales.</div>
          ) : (
            groupedCards.map((group) => (
              <section key={`${group[0].name}-${group[0].id}`} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <h3>{group[0].name}</h3>
                  <span>{group.length} versiones</span>
                </div>
                <div className={styles.groupGrid}>
                  {group.map((card) => (
                    <button
                      key={card.id}
                      className={styles.cardBtn}
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <img src={card.imageUrl} alt={card.name} className={styles.thumb} />
                      <div className={styles.cardMeta}>
                        <strong>{card.collectorCode}</strong>
                        <span>{card.frequency}</span>
                        <span className={styles.metaRow}>
                          {card.isNewest && <em className={styles.flagNewest}>isNewest</em>}
                          {card.isRework && <em className={styles.flagRework}>isRework</em>}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {selectedCard && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedCardId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedCardId(null)}>
              ✕
            </button>
            <div className={styles.modalTop}>
              <img src={selectedCard.imageUrl} alt={selectedCard.name} className={styles.modalImg} />
              <div className={styles.fields}>
                <label>
                  Nombre
                  <input
                    value={selectedCard.name}
                    onChange={(e) => updateCard(selectedCard.id, (c) => ({ ...c, name: e.target.value }))}
                  />
                </label>
                <label>
                  Código
                  <input
                    value={selectedCard.collectorCode}
                    onChange={(e) =>
                      updateCard(selectedCard.id, (c) => ({ ...c, collectorCode: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Tipo
                  <input
                    value={selectedCard.type}
                    onChange={(e) => updateCard(selectedCard.id, (c) => ({ ...c, type: e.target.value }))}
                  />
                </label>
                <label>
                  Frecuencia
                  <select
                    value={selectedCard.frequency}
                    onChange={(e) =>
                      updateCard(selectedCard.id, (c) => ({ ...c, frequency: e.target.value }))
                    }
                  >
                    {frequencyOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.flagActions}>
                  <button onClick={() => setGroupFlag('isNewest')}>Marcar isNewest (grupo)</button>
                  <button onClick={() => clearGroupFlag('isNewest')}>Limpiar isNewest (grupo)</button>
                </div>
                <div className={styles.flagActions}>
                  <button onClick={() => setGroupFlag('isRework')}>Marcar isRework (grupo)</button>
                  <button onClick={() => clearGroupFlag('isRework')}>Limpiar isRework (grupo)</button>
                </div>
              </div>
            </div>

            <div className={styles.rawEditorWrap}>
              <label>Editor JSON de la carta seleccionada</label>
              <textarea
                className={styles.rawEditor}
                value={rawEditor}
                onChange={(e) => setRawEditor(e.target.value)}
              />
              <button className={styles.applyBtn} onClick={applyRawJson}>
                Aplicar JSON Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
