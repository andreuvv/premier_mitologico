import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FormatSection, FormatVariant } from '../types';
import { formatSectionConfig, formatVariantConfig } from '../config/constants';
import { loadMarkdownContent } from '../services/markdownService';
import { getIcon } from '../utils/iconMapper';
import styles from './GameFormatsPage.module.css';

const GameFormatsPage: React.FC = () => {
  const { section: sectionParam, variant: variantParam } = useParams<{ section?: string; variant?: string }>();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<FormatSection>(FormatSection.PRIMER_BLOQUE);
  const [selectedVariant, setSelectedVariant] = useState<FormatVariant | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top when mobile menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileMenuOpen]);

  // Handle URL parameter navigation
  useEffect(() => {
    if (variantParam) {
      const variant = Object.values(FormatVariant).find(v => v === variantParam);
      if (variant) {
        setSelectedVariant(variant);
        // Find which section contains this variant
        const sectionEntry = Object.entries(formatSectionConfig).find(([, config]) => 
          config.variants?.includes(variant)
        );
        if (sectionEntry) {
          setSelectedSection(sectionEntry[0] as FormatSection);
        }
      }
    } else if (sectionParam) {
      const section = Object.values(FormatSection).find(s => s === sectionParam);
      if (section) {
        setSelectedSection(section);
        setSelectedVariant(null);
      }
    } else {
      // Default to primerBloque if no params
      setSelectedSection(FormatSection.PRIMER_BLOQUE);
      setSelectedVariant(null);
    }
  }, [sectionParam, variantParam]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const markdownContent = await loadMarkdownContent(
        'game_formats',
        selectedSection,
        selectedVariant || undefined
      );
      setContent(markdownContent);
      setLoading(false);
    };

    fetchContent();
  }, [selectedSection, selectedVariant]);

  const handleSectionClick = (section: FormatSection) => {
    setSelectedSection(section);
    setSelectedVariant(null);
    navigate(`/game-formats/${section}`);
  };

  const handleVariantClick = (variant: FormatVariant, section: FormatSection) => {
    setSelectedSection(section);
    setSelectedVariant(variant);
    navigate(`/game-formats/${section}/${variant}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.mobileHeader}>
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2 className={styles.mobileTitle}>
          {selectedVariant 
            ? formatVariantConfig[selectedVariant].title 
            : formatSectionConfig[selectedSection].title}
        </h2>
      </div>
      
      {mobileMenuOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`${styles.sidebar} ${!mobileMenuOpen ? styles.sidebarClosed : ''}`}>
        {Object.entries(formatSectionConfig).map(([key, config]) => {
            const section = key as FormatSection;
            const isActive = selectedSection === section && !selectedVariant;
            const IconComponent = getIcon(config.icon);

            return (
              <div key={section} className={styles.sectionGroup}>
                <button
                  className={`${styles.sectionButton} ${isActive ? styles.active : ''}`}
                  onClick={() => handleSectionClick(section)}
                >
                  <IconComponent className={styles.icon} />
                  <span>{config.title}</span>
                </button>
                {config.variants && (
                  <div className={styles.variants}>
                    {config.variants.map((variant) => (
                      <button
                        key={variant}
                        className={`${styles.variantButton} ${selectedVariant === variant ? styles.active : ''}`}
                        onClick={() => handleVariantClick(variant, section)}
                      >
                        {formatVariantConfig[variant].title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </aside>
      <main className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : (
          <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
};

export default GameFormatsPage;
