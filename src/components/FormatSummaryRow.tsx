import styles from './FormatSummaryRow.module.css';
import { BanListFormat } from '../types/banlist';
import { FormatSummary, ChangeType } from '../data/banlistSummary';
import { useState, useEffect } from 'react';

type Props = {
  summaries: Record<BanListFormat, FormatSummary[]>;
};

type HoveredCard = {
  imageUrl: string;
  x: number;
  y: number;
} | null;

const formatLabels: Record<BanListFormat, string> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: 'PB Racial Libre',
  [BanListFormat.PRIMER_BLOQUE_EDICION]: 'PB Racial Edición',
  [BanListFormat.BLOQUE_FURIA_LIBRE]: 'FX Racial Libre',
  [BanListFormat.BLOQUE_FURIA_RAGNAROK]: 'FX Racial Ragnarok',
};

const getRowClassName = (changeType?: ChangeType): string => {
  switch (changeType) {
    case 'positive':
      return styles.rowPositiveStrong;
    case 'positiveSoft':
      return styles.rowPositiveSoft;
    case 'negative':
      return styles.rowNegativeStrong;
    case 'negativeSoft':
      return styles.rowNegativeSoft;
    case 'neutral':
      return styles.rowNeutral;
    default:
      return '';
  }
};

export default function FormatSummaryRow({ summaries }: Props) {
  const [hoveredCard, setHoveredCard] = useState<HoveredCard>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCardImage, setSelectedCardImage] = useState<string | null>(null);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 800);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleMouseEnter = (imageUrl: string, e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!imageUrl || isMobile) return;
    setHoveredCard({
      imageUrl,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (isMobile) return;
    setHoveredCard(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };

  const handleRowClick = (imageUrl: string) => {
    if (isMobile && imageUrl) {
      setSelectedCardImage(imageUrl);
    }
  };

  const handleCloseModal = () => {
    setSelectedCardImage(null);
  };

  return (
    <div className={styles.row}>
      {Object.keys(summaries).map((k) => {
        const key = k as BanListFormat;
        const items = summaries[key];
        return (
          <div key={k} className={styles.card}>
            <h4 className={styles.title}>{formatLabels[key]}</h4>
            {items.length === 0 ? (
              <p className={styles.noChanges}>Sin cambios</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Carta</th>
                    <th>Antes</th>
                    <th>Ahora</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className={getRowClassName(item.changeType)}
                        onMouseEnter={(e) => handleMouseEnter(item.imageUrl || '', e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleRowClick(item.imageUrl || '')}
                        style={{ cursor: item.imageUrl ? 'pointer' : 'default' }}>
                      <td><strong>{item.card}</strong></td>
                      <td>{item.pastMonth}</td>
                      <td>{item.currentMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
      {!isMobile && hoveredCard && (
        <div 
          className={styles.cardTooltip}
          style={{
            left: `${hoveredCard.x + 10}px`,
            top: `${hoveredCard.y + 10}px`,
          }}
        >
          <img src={hoveredCard.imageUrl} alt="Card" />
        </div>
      )}
      {isMobile && selectedCardImage && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedCardImage} alt="Card" />
          </div>
        </div>
      )}
    </div>
  );
}
