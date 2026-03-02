import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchBlogPostBySlug, formatBlogDate } from '../services/blogService';
import { BlogPost } from '../types';
import styles from './BlogPostPage.module.css';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const foundPost = await fetchBlogPostBySlug(slug);
      if (foundPost) {
        setPost(foundPost);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Post no encontrado</h1>
          <p>Lo sentimos, el post que buscas no existe.</p>
          <Link to="/blog" className={styles.backLink}>← Volver al Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/blog" className={styles.backLink}>← Volver al Blog</Link>
      
      <article className={styles.post}>
        <h1 className={styles.title}>{post.title}</h1>
        
        <div className={styles.meta}>
          <span className={styles.date}>📅 {formatBlogDate(post.date)}</span>
          <Link to={`/players/${post.author}`} className={styles.author}>
            ✍️ {post.author}
          </Link>
        </div>

        <div className={styles.tags}>
          {post.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        <div className={styles.content}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;
