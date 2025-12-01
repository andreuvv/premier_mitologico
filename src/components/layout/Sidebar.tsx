import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuOption } from '../../types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  selectedOption: MenuOption;
  onSelectOption: (option: MenuOption) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, selectedOption, onSelectOption, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { option: MenuOption.HOME, label: 'Inicio', icon: '🏠', path: '/' },
    { option: MenuOption.TOURNAMENT_INFO, label: 'Info. Torneo', icon: 'ℹ️', path: '/tournament-info' },
    { option: MenuOption.GAME_FORMATS, label: 'Formatos', icon: '🎮', path: '/game-formats' },
    { option: MenuOption.BANLIST, label: 'Banlist', icon: '🚫', path: '/banlist' },
  ];

  const handleItemClick = (option: MenuOption, path: string) => {
    onSelectOption(option);
    navigate(path);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.option}
              className={`${styles.menuItem} ${selectedOption === item.option ? styles.active : ''}`}
              onClick={() => handleItemClick(item.option, item.path)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
