import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SectionLoader from '../components/loading/SectionLoader';
import { infoSectionConfig, tournamentSubsectionConfig } from '../config/constants';
import { useAuth } from '../hooks/useAuth';
import {
  getInfoDocument,
  infoDocumentSlug,
  saveInfoDocument,
} from '../services/infoDocumentService';
import { isCurrentUserBanlistAdmin } from '../services/monthlyBanlistService';
import { InfoSection, TournamentSubsection } from '../types';
import { getIcon } from '../utils/iconMapper';
import styles from './GameFormatsPage.module.css';
import copyStyles from './TournamentInfoPage.module.css';

const BANK_DETAILS_MARKER = 'ANDRE VERA VEAS';

const getInitialState = (sectionParam?: string, subsectionParam?: string) => {
  if (subsectionParam) {
    const subsection = Object.values(TournamentSubsection).find((value) => value === subsectionParam);
    if (subsection) {
      const sectionEntry = Object.entries(infoSectionConfig).find(([, config]) =>
        config.subsections?.includes(subsection),
      );
      if (sectionEntry) {
        return {
          section: sectionEntry[0] as InfoSection,
          subsection,
        };
      }
    }
  } else if (sectionParam) {
    const section = Object.values(InfoSection).find((value) => value === sectionParam);
    if (section) {
      return { section, subsection: null };
    }
  }

  return { section: InfoSection.GENERAL, subsection: null };
};

const TournamentInfoPage: React.FC = () => {
  const { section: sectionParam, subsection: subsectionParam } = useParams<{
    section?: string;
    subsection?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialState = getInitialState(sectionParam, subsectionParam);
  const [selectedSection, setSelectedSection] = useState<InfoSection>(initialState.section);
  const [selectedSubsection, setSelectedSubsection] = useState<TournamentSubsection | null>(
    initialState.subsection,
  );
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const activeTitle = selectedSubsection
    ? tournamentSubsectionConfig[selectedSubsection].title
    : infoSectionConfig[selectedSection].title;
  const slug = infoDocumentSlug(selectedSection, selectedSubsection);
  const showBankCopy = selectedSection === InfoSection.PRIZES_AND_FUNDING && !selectedSubsection;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const onChange = () => setIsNarrow(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    isCurrentUserBanlistAdmin(user.id).then((value) => {
      if (!cancelled) setIsAdmin(value);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (subsectionParam) {
      const subsection = Object.values(TournamentSubsection).find((value) => value === subsectionParam);
      if (subsection) {
        setSelectedSubsection(subsection);
        const sectionEntry = Object.entries(infoSectionConfig).find(([, config]) =>
          config.subsections?.includes(subsection),
        );
        if (sectionEntry) {
          setSelectedSection(sectionEntry[0] as InfoSection);
        }
      }
    } else if (sectionParam) {
      const section = Object.values(InfoSection).find((value) => value === sectionParam);
      if (section) {
        setSelectedSection(section);
        setSelectedSubsection(null);
      }
    } else {
      setSelectedSection(InfoSection.GENERAL);
      setSelectedSubsection(null);
    }
  }, [sectionParam, subsectionParam]);

  useEffect(() => {
    let cancelled = false;

    const fetchContent = async () => {
      setLoading(true);
      setLoadError(false);
      setEditing(false);
      setSaveError(null);

      const result = await getInfoDocument(selectedSection, selectedSubsection);
      if (cancelled) return;

      setContent(result.content);
      setDraft(result.content);
      setLoadError(result.error);
      setLoading(false);
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [selectedSection, selectedSubsection]);

  const handleSectionClick = (section: InfoSection) => {
    setSelectedSection(section);
    setSelectedSubsection(null);
    setMobileMenuOpen(false);
    navigate(`/tournament-info/${section}`);
  };

  const handleSubsectionClick = (subsection: TournamentSubsection, section: InfoSection) => {
    setSelectedSection(section);
    setSelectedSubsection(subsection);
    setMobileMenuOpen(false);
    navigate(`/tournament-info/${section}/${subsection}`);
  };

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

  const handleStartEdit = () => {
    setDraft(content);
    setSaveError(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft(content);
    setSaveError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await saveInfoDocument(slug, draft);
    setSaving(false);

    if (!result.success) {
      setSaveError(result.error ?? 'No se pudo guardar la sección.');
      return;
    }

    setContent(draft);
    setLoadError(false);
    setEditing(false);
  };

  const markdownComponents = {
    code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
      const codeText = String(children).replace(/\n$/, '');

      if (showBankCopy && codeText.includes(BANK_DETAILS_MARKER)) {
        return (
          <div className={copyStyles.copyContainer}>
            <pre className={copyStyles.copyData}>
              <code>{codeText}</code>
            </pre>
            <button type="button" className={copyStyles.copyButton} onClick={handleCopyClick}>
              {copySuccess ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const MarkdownBody: React.FC<{ content: string }> = ({ content: markdown }) => (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Reglamento</p>
        <h1>Info Torneo</h1>
        <p className={styles.lede}>
          Sistema de juego, reglas, premios, participantes y cronograma del torneo.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={mobileMenuOpen}
            aria-controls="info-sidebar"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className={styles.menuGlyph} aria-hidden="true" />
            Menú
          </button>
          <h2 className={styles.mobileTitle}>{activeTitle}</h2>
        </div>

        {mobileMenuOpen && (
          <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
        )}

        <aside
          id="info-sidebar"
          className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}
          aria-hidden={isNarrow && !mobileMenuOpen}
          inert={isNarrow && !mobileMenuOpen ? true : undefined}
        >
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Info</span>
            <button
              type="button"
              className={styles.closeSidebar}
              onClick={() => setMobileMenuOpen(false)}
            >
              Cerrar
            </button>
          </div>

          {Object.entries(infoSectionConfig).map(([key, config]) => {
            const section = key as InfoSection;
            const isActive = selectedSection === section && !selectedSubsection;
            const sectionHasSelection = selectedSection === section;
            const IconComponent = getIcon(config.icon);

            return (
              <div key={section} className={styles.sectionGroup}>
                <button
                  type="button"
                  className={`${styles.sectionButton} ${isActive ? styles.active : ''} ${sectionHasSelection ? styles.sectionCurrent : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleSectionClick(section)}
                >
                  <IconComponent className={styles.icon} />
                  <span>{config.title}</span>
                </button>
                {config.subsections && (
                  <div className={styles.variants}>
                    {config.subsections.map((subsection) => {
                      const subsectionActive = selectedSubsection === subsection;
                      return (
                        <button
                          key={subsection}
                          type="button"
                          className={`${styles.variantButton} ${subsectionActive ? styles.active : ''}`}
                          aria-current={subsectionActive ? 'page' : undefined}
                          onClick={() => handleSubsectionClick(subsection, section)}
                        >
                          {tournamentSubsectionConfig[subsection].title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <main className={styles.content}>
          <div className={styles.articleBar}>
            <div>
              <p className={styles.articleKicker}>
                {selectedSubsection ? infoSectionConfig[selectedSection].title : 'Sección'}
              </p>
              <h2 className={styles.articleTitle}>{activeTitle}</h2>
            </div>
            {isAdmin && !loading && !editing && (
              <button type="button" className={styles.editButton} onClick={handleStartEdit}>
                Editar
              </button>
            )}
          </div>

          {loading ? (
            <SectionLoader message="Cargando sección" />
          ) : editing ? (
            <div className={styles.editor}>
              <div className={styles.editorGrid}>
                <label className={styles.editorPane}>
                  <span className={styles.paneLabel}>Markdown</span>
                  <textarea
                    className={styles.textarea}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    spellCheck={false}
                    aria-label="Contenido de la sección en Markdown"
                  />
                </label>
                <div className={styles.previewPane}>
                  <span className={styles.paneLabel}>Vista previa</span>
                  <div className={styles.previewScroll}>
                    {draft.trim() ? (
                      <MarkdownBody content={draft} />
                    ) : (
                      <p className={styles.empty}>La vista previa está vacía.</p>
                    )}
                  </div>
                </div>
              </div>
              {saveError && <p className={styles.saveError}>{saveError}</p>}
              <div className={styles.editorActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : loadError ? (
            <div className={styles.status}>
              <h3>No se pudo cargar esta sección</h3>
              <p>Intenta de nuevo en un momento. Si el problema sigue, avísanos.</p>
            </div>
          ) : content.trim() ? (
            <MarkdownBody content={content} />
          ) : (
            <div className={styles.status}>
              <h3>Esta sección todavía no tiene contenido</h3>
              <p>
                {isAdmin
                  ? 'Usa Editar para escribir el markdown de esta página.'
                  : 'Vuelve más tarde para leer la información.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TournamentInfoPage;
