import { useState, useRef, useLayoutEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BsThreeDotsVertical } from 'react-icons/bs';
import styles from './CardActionsMenu.module.css';

interface CardActionsMenuProps {
  isOwned: boolean;
  isFavorite?: boolean;
  isWishlisted?: boolean;
  onViewCard?: () => void;
  onToggleFavorite?: () => void;
  onToggleWishlist?: () => void;
  onAddToFolder?: () => void;
  onRemoveFromFolder?: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export default function CardActionsMenu({
  isOwned,
  isFavorite = false,
  isWishlisted = false,
  onViewCard,
  onToggleFavorite,
  onToggleWishlist,
  onAddToFolder,
  onRemoveFromFolder,
}: CardActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();

    const handleScroll = () => close();
    const handleResize = () => close();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, updatePosition, close]);

  const items: MenuItem[] = [];

  if (onViewCard) {
    items.push({ key: 'view', label: 'Ver Carta', onClick: onViewCard });
  }
  if (onToggleFavorite) {
    items.push({
      key: 'favorite',
      label: isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos',
      onClick: onToggleFavorite,
    });
  }
  if (onToggleWishlist) {
    items.push({
      key: 'wishlist',
      label: isWishlisted ? 'Quitar de Lista de Deseados' : 'Agregar a Lista de Deseados',
      onClick: onToggleWishlist,
    });
  }
  if (isOwned && onRemoveFromFolder) {
    items.push({
      key: 'folder',
      label: 'Quitar de Carpeta',
      onClick: onRemoveFromFolder,
      variant: 'danger',
    });
  } else if (!isOwned && onAddToFolder) {
    items.push({ key: 'folder', label: 'Agregar a Carpeta', onClick: onAddToFolder });
  }

  if (items.length === 0) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const runItem = (item: MenuItem) => {
    item.onClick();
    close();
  };

  let menu: ReactNode = null;
  if (open) {
    menu = createPortal(
      <div
        ref={menuRef}
        className={styles.menu}
        style={{ top: coords.top, left: coords.left }}
        role="menu"
      >
        {items.map((item) => (
          <button
            key={item.key}
            className={`${styles.menuItem} ${item.variant === 'danger' ? styles.menuItemDanger : ''}`}
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              runItem(item);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body,
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.kebab}
        aria-label="Acciones de la carta"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <BsThreeDotsVertical />
      </button>
      {menu}
    </>
  );
}
