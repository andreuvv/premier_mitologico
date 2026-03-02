import { BlogPost } from '../types';

interface FrontmatterData {
  metadata: {
    title: string;
    date: string;
    author: string;
    tags: string[];
    excerpt: string;
    homeExcerpt?: string;
    homeImage?: string;
  };
  content: string;
}

/**
 * Parse frontmatter from markdown content
 * Format:
 * ---
 * title: "..."
 * date: "..."
 * author: "..."
 * tags: ["...", "..."]
 * excerpt: "..."
 * ---
 * Content here...
 */
function parseFrontmatter(content: string): FrontmatterData {
  // Normalize line endings (handle both \r\n and \n)
  const normalizedContent = content.replace(/\r\n/g, '\n');
  
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = normalizedContent.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid markdown format. Expected frontmatter between --- markers.');
  }

  const [, frontmatterText, markdownContent] = match;
  const metadata: any = {};

  // Parse YAML-like frontmatter
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    if (key === 'tags') {
      // Parse array: ["tag1", "tag2"]
      const arrayMatch = value.match(/\[(.*?)\]/);
      if (arrayMatch) {
        metadata.tags = arrayMatch[1]
          .split(',')
          .map((tag: string) => tag.trim().replace(/^["']|["']$/g, ''));
      }
    } else {
      // Remove quotes from string values
      metadata[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  if (!metadata.title || !metadata.date || !metadata.author || !metadata.excerpt) {
    throw new Error('Missing required frontmatter fields: title, date, author, excerpt');
  }

  if (!metadata.tags) {
    metadata.tags = [];
  }

  return {
    metadata,
    content: markdownContent.trim(),
  };
}

/**
 * Get slug from filename (remove .md extension)
 */
function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '');
}

/**
 * Fetch all blog posts from markdown files
 */
export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const modules = import.meta.glob<string>('/src/../public/assets/markdown/blog/**/*.md', {
      as: 'raw',
    });

    const posts: BlogPost[] = [];

    for (const [path, resolver] of Object.entries(modules)) {
      try {
        // Get the raw markdown content
        const markdownContent = await resolver();

        // Extract filename from path
        const filename = path.split('/').pop() || '';
        const slug = getSlugFromFilename(filename);

        // Parse frontmatter
        const { metadata, content } = parseFrontmatter(markdownContent);

        posts.push({
          slug,
          title: metadata.title,
          date: metadata.date,
          author: metadata.author,
          tags: metadata.tags,
          excerpt: metadata.excerpt,
          homeExcerpt: metadata.homeExcerpt,
          homeImage: metadata.homeImage,
          content,
        });
      } catch (error) {
        console.error(`Error parsing blog post from ${path}:`, error);
      }
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await fetchAllBlogPosts();
  return posts.find((post: BlogPost) => post.slug === slug) || null;
}

export function formatBlogDate(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return formatter.format(date);
}
