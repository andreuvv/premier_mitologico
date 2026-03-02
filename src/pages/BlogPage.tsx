import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllBlogPosts, formatBlogDate } from '../services/blogService';
import { BlogPost } from '../types';
import styles from './BlogPage.module.css';

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      const allPosts = await fetchAllBlogPosts();
      setPosts(allPosts);
      setLoading(false);
    };

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>Blog</h1>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.container}>
        <h1>Blog</h1>
        <div className={styles.empty}>No hay posts disponibles aún.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Blog</h1>
      <div className={styles.feed}>
        {posts.map((post) => (
          <div 
            key={post.slug} 
            className={styles.cardLink}
            onClick={() => navigate(`/blog/${post.slug}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/blog/${post.slug}`);
            }}
          >
            <article className={styles.card}>
              <h2 className={styles.title}>{post.title}</h2>
              <div className={styles.meta}>
                <span className={styles.date}>📅 {formatBlogDate(post.date)}</span>
                <Link 
                  to={`/players/${post.author}`} 
                  className={styles.author}
                  onClick={(e) => e.stopPropagation()}
                >
                  ✍️ {post.author}
                </Link>
              </div>
              <p className={styles.excerpt}>{post.excerpt}</p>
              <div className={styles.tags}>
                {post.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              <span className={styles.readMore}>Leer más →</span>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
