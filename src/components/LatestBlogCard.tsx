import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllBlogPosts, formatBlogDate } from '../services/blogService';
import { BlogPost } from '../types';
import styles from './LatestBlogCard.module.css';

const LatestBlogCard = () => {
  const [latestPost, setLatestPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.imageContainer}>
        <img 
          src={image}
          alt={latestPost.title}
          className={styles.image}
        />
      </div>
      
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
    </div>
  );
};

export default LatestBlogCard;
