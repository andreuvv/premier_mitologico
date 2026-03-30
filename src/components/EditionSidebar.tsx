import { useState } from 'react';
import { CollectionCard } from '../types/collection';
import styles from './EditionSidebar.module.css';

interface EditionSidebarProps {
  cards: CollectionCard[];
  onFilterChange: (data: { cards: CollectionCard[], filterLabel: string | null }) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface FilterState {
  editionProduct: string | null;
  specialProduct: string | null;
}

export default function EditionSidebar({ cards, onFilterChange, isOpen = true, onClose: _onClose }: EditionSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({ editionProduct: null, specialProduct: null });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ediciones', 'productos']));

  // Extract unique products with type "Edición" - use productName as key
  const editions = Array.from(
    new Map(
      cards
        .filter(card => card.product && card.product.productType === 'Edición')
        .map(card => [card.product!.productName, card.product!])
    ).values()
  ).sort((a, b) => a.productName.localeCompare(b.productName));

  // Extract unique products with type "Producto Especial" - use productName as key
  const specialProducts = Array.from(
    new Map(
      cards
        .filter(card => card.product && card.product.productType === 'Producto Especial')
        .map(card => [card.product!.productName, card.product!])
    ).values()
  ).sort((a, b) => a.productName.localeCompare(b.productName));

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setExpandedSections(newSections);
  };

  const handleEditionClick = (productName: string) => {
    const newFilters = {
      ...filters,
      editionProduct: filters.editionProduct === productName ? null : productName,
      specialProduct: null
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleProductClick = (productName: string) => {
    const newFilters = {
      ...filters,
      editionProduct: null,
      specialProduct: filters.specialProduct === productName ? null : productName
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters: FilterState) => {
    let filtered = cards;
    let filterLabel: string | null = null;

    if (newFilters.editionProduct) {
      filtered = filtered.filter(card => 
        card.product?.productName === newFilters.editionProduct && 
        card.product?.productType === 'Edición'
      );
      filterLabel = `${editions.find(e => e.productName === newFilters.editionProduct)?.productName}`;
    }

    if (newFilters.specialProduct) {
      filtered = filtered.filter(card => 
        card.product?.productName === newFilters.specialProduct && 
        card.product?.productType === 'Producto Especial'
      );
      filterLabel = `${specialProducts.find(p => p.productName === newFilters.specialProduct)?.productName}`;
    }

    onFilterChange({ cards: filtered, filterLabel });
  };

  const clearFilters = () => {
    setFilters({ editionProduct: null, specialProduct: null });
    onFilterChange({ cards, filterLabel: null });
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <h3>Filtros</h3>
        {(filters.editionProduct || filters.specialProduct) && (
          <button className={styles.clearButton} onClick={clearFilters}>
            Limpiar
          </button>
        )}
      </div>

      <div className={styles.section}>
        <button 
          className={styles.sectionHeader}
          onClick={() => toggleSection('ediciones')}
        >
          <span>Ediciones</span>
          <span className={styles.chevron}>
            {expandedSections.has('ediciones') ? '▾' : '▸'}
          </span>
        </button>
        {expandedSections.has('ediciones') && (
          <div className={styles.sectionContent}>
            {editions.length === 0 ? (
              <div className={styles.noItems}>No hay ediciones</div>
            ) : (
              editions.map(product => (
                <button
                  key={product.productName}
                  className={`${styles.item} ${filters.editionProduct === product.productName ? styles.active : ''}`}
                  onClick={() => handleEditionClick(product.productName)}
                >
                  {product.productName}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <button 
          className={styles.sectionHeader}
          onClick={() => toggleSection('productos')}
        >
          <span>Productos Especiales</span>
          <span className={styles.chevron}>
            {expandedSections.has('productos') ? '▾' : '▸'}
          </span>
        </button>
        {expandedSections.has('productos') && (
          <div className={styles.sectionContent}>
            {specialProducts.length === 0 ? (
              <div className={styles.noItems}>No hay productos especiales</div>
            ) : (
              specialProducts.map(product => (
                <button
                  key={product.productName}
                  className={`${styles.item} ${filters.specialProduct === product.productName ? styles.active : ''}`}
                  onClick={() => handleProductClick(product.productName)}
                >
                  {product.productName}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
