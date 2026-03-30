import { useState, useEffect } from 'react';
import styles from './CardGrid.module.css';

interface SimpleCard {
  id: number;
  name: string;
  imageUrl: string;
}

interface CardGridProps {
  cards: SimpleCard[];
  cardsPerPage?: number;
}

export default function CardGrid({ cards, cardsPerPage = 100 }: CardGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedCards, setPaginatedCards] = useState<SimpleCard[]>([]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    setPaginatedCards(cards.slice(startIndex, endIndex));
  }, [currentPage, cards, cardsPerPage]);

  const totalPages = Math.ceil(cards.length / cardsPerPage);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {paginatedCards.map((card) => (
          <div key={card.id} className={styles.cardItem}>
            {card.imageUrl ? (
              <img 
                src={card.imageUrl} 
                alt={card.name}
                className={styles.cardImage}
              />
            ) : (
              <div className={styles.placeholder}>Sin imagen</div>
            )}
            <div className={styles.cardInfo}>
              <h4>{card.name}</h4>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            ← Primera
          </button>
          
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Anterior
          </button>

          <div className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Siguiente
          </button>

          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Última →
          </button>
        </div>
      )}
    </div>
  );
}
