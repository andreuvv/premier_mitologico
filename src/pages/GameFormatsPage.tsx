import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FormatSection, FormatVariant } from '../types';
import { formatSectionConfig, formatVariantConfig } from '../config/constants';
import { loadMarkdownContent } from '../services/markdownService';
import { getIcon } from '../utils/iconMapper';
import styles from './GameFormatsPage.module.css';

const GameFormatsPage: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<FormatSection>(FormatSection.PRIMER_BLOQUE);
  const [selectedVariant, setSelectedVariant] = useState<FormatVariant | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle URL hash navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the '#'
    if (hash) {
      // Check if it's a variant
      const variant = Object.values(FormatVariant).find(v => v === hash);
      if (variant) {
        setSelectedVariant(variant);
        // Find which section contains this variant
        const sectionEntry = Object.entries(formatSectionConfig).find(([, config]) => 
          config.variants?.includes(variant)
        );
        if (sectionEntry) {
          setSelectedSection(sectionEntry[0] as FormatSection);
        }
      } else {
        // Check if it's a main section
        const section = Object.values(FormatSection).find(s => s === hash);
        if (section) {
          setSelectedSection(section);
          setSelectedVariant(null);
        }
      }
    }
  }, []);

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
  };

  const handleVariantClick = (variant: FormatVariant, section: FormatSection) => {
    setSelectedSection(section);
    setSelectedVariant(variant);
  };

  const isMobile = window.innerWidth < 800;

  return (
    <div className={styles.container}>
      <div className={styles.mobileHeader}>
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        <h2 className={styles.mobileTitle}>
          {selectedVariant 
            ? formatVariantConfig[selectedVariant].title 
            : formatSectionConfig[selectedSection].title}
        </h2>
      </div>
      
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {Object.entries(formatSectionConfig).map(([key, config]) => {
            const section = key as FormatSection;
            const isActive = selectedSection === section && !selectedVariant;
            const IconComponent = getIcon(config.icon);

            return (
              <div key={section}>
                <button
                  className={`${styles.mobileMenuItem} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    handleSectionClick(section);
                    setMobileMenuOpen(false);
                  }}
                >
                  <IconComponent className={styles.icon} />
                  <span>{config.title}</span>
                </button>
                {config.variants && config.variants.map((variant) => (
                  <button
                    key={variant}
                    className={`${styles.mobileMenuSubItem} ${selectedVariant === variant ? styles.active : ''}`}
                    onClick={() => {
                      handleVariantClick(variant, section);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {formatVariantConfig[variant].title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
      
      {!isMobile && (
        <aside className={styles.sidebar}>
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
      )}
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
