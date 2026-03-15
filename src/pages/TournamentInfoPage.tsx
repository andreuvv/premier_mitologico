import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InfoSection, TournamentSubsection } from '../types';
import { infoSectionConfig, tournamentSubsectionConfig } from '../config/constants';
import { loadMarkdownContent } from '../services/markdownService';
import { getIcon } from '../utils/iconMapper';
import styles from './TournamentInfoPage.module.css';

const TournamentInfoPage: React.FC = () => {
  const { section: sectionParam, subsection: subsectionParam } = useParams<{ section?: string; subsection?: string }>();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<InfoSection>(InfoSection.GENERAL);
  const [selectedSubsection, setSelectedSubsection] = useState<TournamentSubsection | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Scroll to top when mobile menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileMenuOpen]);

  const handleCopyClick = () => {
    const textToCopy = `ANDRE VERA VEAS
18.537.438-6
Banco Itaú
Cuenta Corriente
0222946443
VEANVE@GMAIL.COM`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Handle URL parameter navigation
  useEffect(() => {
    if (subsectionParam) {
      const subsection = Object.values(TournamentSubsection).find(s => s === subsectionParam);
      if (subsection) {
        setSelectedSubsection(subsection);
        // Find which section contains this subsection
        const sectionEntry = Object.entries(infoSectionConfig).find(([, config]) => 
          config.subsections?.includes(subsection)
        );
        if (sectionEntry) {
          setSelectedSection(sectionEntry[0] as InfoSection);
        }
      }
    } else if (sectionParam) {
      const section = Object.values(InfoSection).find(s => s === sectionParam);
      if (section) {
        setSelectedSection(section);
        setSelectedSubsection(null);
      }
    } else {
      // Default to general if no params
      setSelectedSection(InfoSection.GENERAL);
      setSelectedSubsection(null);
    }
  }, [sectionParam, subsectionParam]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const markdownContent = await loadMarkdownContent(
        'tournament_info',
        selectedSection,
        selectedSubsection || undefined
      );
      setContent(markdownContent);
      setLoading(false);
    };

    fetchContent();
  }, [selectedSection, selectedSubsection]);

  const handleSectionClick = (section: InfoSection) => {
    setSelectedSection(section);
    setSelectedSubsection(null);
    navigate(`/tournament-info/${section}`);
  };

  const handleSubsectionClick = (subsection: TournamentSubsection, section: InfoSection) => {
    setSelectedSection(section);
    setSelectedSubsection(subsection);
    navigate(`/tournament-info/${section}/${subsection}`);
  };

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
          {selectedSubsection 
            ? tournamentSubsectionConfig[selectedSubsection].title 
            : infoSectionConfig[selectedSection].title}
        </h2>
      </div>
      
      {mobileMenuOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`${styles.sidebar} ${!mobileMenuOpen ? styles.sidebarClosed : ''}`}>
        {Object.entries(infoSectionConfig).map(([key, config]) => {
            const section = key as InfoSection;
            const isActive = selectedSection === section && !selectedSubsection;
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
                {config.subsections && (
                  <div className={styles.subsections}>
                    {config.subsections.map((subsection) => (
                      <button
                        key={subsection}
                        className={`${styles.subsectionButton} ${selectedSubsection === subsection ? styles.active : ''}`}
                        onClick={() => handleSubsectionClick(subsection, section)}
                      >
                        {tournamentSubsectionConfig[subsection].title}
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
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const content = String(children).replace(/\n$/, '');
                  
                  // Check if this is the "Datos para Copiar" code block
                  if (selectedSection === InfoSection.PRIZES_AND_FUNDING && 
                      content.includes('ANDRE VERA VEAS')) {
                    return (
                      <div className={styles.copyContainer}>
                        <pre className={styles.copyData}>
                          <code>{content}</code>
                        </pre>
                        <button 
                          className={styles.copyButton}
                          onClick={handleCopyClick}
                        >
                          {copySuccess ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                    );
                  }
                  
                  return <code className={className} {...props}>{children}</code>;
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentInfoPage;
