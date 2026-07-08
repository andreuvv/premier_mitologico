import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBlog, FaChevronDown } from 'react-icons/fa';
import { fetchAllBlogPosts, formatBlogDate } from '../services/blogService';
import { BlogPost } from '../types';
import styles from './LatestBlogCard.module.css';

interface LatestBlogCardProps {
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const LatestBlogCard = ({ collapsible = false, defaultOpen = false }: LatestBlogCardProps) => {
  const [latestPost, setLatestPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  useEffect(() => {
    const loadLatestPost = async () => {
      try {
        const posts = await fetchAllBlogPosts();
        if (posts.length > 0) {
          setLatestPost(posts[0]); // Already sorted by date (newest first)
        }
      } catch (error) {
        console.error('Error loading latest blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLatestPost();
  }, []);

  if (loading) {
    if (collapsible) {
      return (
        <div className={styles.wrapper}>
          <button
            type="button"
            className={styles.headerButton}
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
          >
            <div className={styles.header}>
              <FaBlog className={styles.headerIcon} />
              <h3 className={styles.sectionTitle}>Último Blog</h3>
            </div>
            <FaChevronDown className={`${styles.toggleIcon} ${isOpen ? styles.open : ''}`} />
          </button>
          {isOpen && <div className={styles.stateText}>Cargando...</div>}
        </div>
      );
    }
    return <div className={styles.card}>Cargando...</div>;
  }

  if (!latestPost) {
    return null;
  }

  const handleCardClick = () => {
    navigate(`/blog/${latestPost.slug}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/players/${latestPost.author}`);
  };

  const officialTag = latestPost.tags.find(tag => tag === 'Torneo Premier');
  const excerpt = latestPost.homeExcerpt || latestPost.excerpt;
  const image = latestPost.homeImage || 'https://i.imgur.com/HckHDVA.jpeg';

  const cardContent = (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.content}>
        {officialTag && (
          <div className={styles.tagBadge}>{officialTag}</div>
        )}
        <h3 className={styles.title}>{latestPost.title}</h3>
        <p className={styles.excerpt}>{excerpt}</p>

        <div className={styles.meta}>
          <span className={styles.date}>{formatBlogDate(latestPost.date)}</span>
          <button
            className={styles.author}
            onClick={handleAuthorClick}
          >
            por {latestPost.author}
          </button>
        </div>
      </div>

      <div className={styles.imageContainer}>
        <img
          src={image}
          alt={latestPost.title}
          className={styles.image}
        />
      </div>
    </div>
  );

  if (!collapsible) {
    return cardContent;
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.headerButton}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <div className={styles.header}>
          <FaBlog className={styles.headerIcon} />
          <h3 className={styles.sectionTitle}>Último Blog</h3>
        </div>
        <FaChevronDown className={`${styles.toggleIcon} ${isOpen ? styles.open : ''}`} />
      </button>
      {isOpen && cardContent}
    </div>
  );
};

export default LatestBlogCard;
