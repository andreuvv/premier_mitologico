import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SectionLoader from '../components/loading/SectionLoader';
import { formatSectionConfig, formatVariantConfig } from '../config/constants';
import { useAuth } from '../hooks/useAuth';
import {
  formatDocumentSlug,
  getFormatDocument,
  saveFormatDocument,
} from '../services/formatDocumentService';
import { isCurrentUserBanlistAdmin } from '../services/monthlyBanlistService';
import { FormatSection, FormatVariant } from '../types';
import { getIcon } from '../utils/iconMapper';
import styles from './GameFormatsPage.module.css';

const getInitialState = (sectionParam?: string, variantParam?: string) => {
  if (variantParam) {
    const variant = Object.values(FormatVariant).find((value) => value === variantParam);
    if (variant) {
      const sectionEntry = Object.entries(formatSectionConfig).find(([, config]) =>
        config.variants?.includes(variant),
      );
      if (sectionEntry) {
        return {
          section: sectionEntry[0] as FormatSection,
          variant,
        };
      }
    }
  } else if (sectionParam) {
    const section = Object.values(FormatSection).find((value) => value === sectionParam);
    if (section) {
      return { section, variant: null };
    }
  }

  return { section: FormatSection.PRIMER_BLOQUE, variant: null };
};

const MarkdownBody: React.FC<{ content: string }> = ({ content }) => (
  <div className={styles.markdown}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);

const GameFormatsPage: React.FC = () => {
  const { section: sectionParam, variant: variantParam } = useParams<{
    section?: string;
    variant?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialState = getInitialState(sectionParam, variantParam);
  const [selectedSection, setSelectedSection] = useState<FormatSection>(initialState.section);
  const [selectedVariant, setSelectedVariant] = useState<FormatVariant | null>(initialState.variant);
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

  const activeTitle = selectedVariant
    ? formatVariantConfig[selectedVariant].title
    : formatSectionConfig[selectedSection].title;
  const slug = formatDocumentSlug(selectedSection, selectedVariant);

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
    if (variantParam) {
      const variant = Object.values(FormatVariant).find((value) => value === variantParam);
      if (variant) {
        setSelectedVariant(variant);
        const sectionEntry = Object.entries(formatSectionConfig).find(([, config]) =>
          config.variants?.includes(variant),
        );
        if (sectionEntry) {
          setSelectedSection(sectionEntry[0] as FormatSection);
        }
      }
    } else if (sectionParam) {
      const section = Object.values(FormatSection).find((value) => value === sectionParam);
      if (section) {
        setSelectedSection(section);
        setSelectedVariant(null);
      }
    } else {
      setSelectedSection(FormatSection.PRIMER_BLOQUE);
      setSelectedVariant(null);
    }
  }, [sectionParam, variantParam]);

  useEffect(() => {
    let cancelled = false;

    const fetchContent = async () => {
      setLoading(true);
      setLoadError(false);
      setEditing(false);
      setSaveError(null);

      const result = await getFormatDocument(selectedSection, selectedVariant);
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
  }, [selectedSection, selectedVariant]);

  const handleSectionClick = (section: FormatSection) => {
    setSelectedSection(section);
    setSelectedVariant(null);
    setMobileMenuOpen(false);
    navigate(`/game-formats/${section}`);
  };

  const handleVariantClick = (variant: FormatVariant, section: FormatSection) => {
    setSelectedSection(section);
    setSelectedVariant(variant);
    setMobileMenuOpen(false);
    navigate(`/game-formats/${section}/${variant}`);
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
    const result = await saveFormatDocument(slug, draft);
    setSaving(false);

    if (!result.success) {
      setSaveError(result.error ?? 'No se pudo guardar el formato.');
      return;
    }

    setContent(draft);
    setLoadError(false);
    setEditing(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Reglamento</p>
        <h1>Formatos</h1>
        <p className={styles.lede}>
          Reglas de construcción y variantes de Primer Bloque, Furia Extendido y formatos especiales.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={mobileMenuOpen}
            aria-controls="format-sidebar"
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
          id="format-sidebar"
          className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}
          aria-hidden={isNarrow && !mobileMenuOpen}
          inert={isNarrow && !mobileMenuOpen ? true : undefined}
        >
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Formatos</span>
            <button
              type="button"
              className={styles.closeSidebar}
              onClick={() => setMobileMenuOpen(false)}
            >
              Cerrar
            </button>
          </div>

          {Object.entries(formatSectionConfig).map(([key, config]) => {
            const section = key as FormatSection;
            const isActive = selectedSection === section && !selectedVariant;
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
                {config.variants && (
                  <div className={styles.variants}>
                    {config.variants.map((variant) => {
                      const variantActive = selectedVariant === variant;
                      return (
                        <button
                          key={variant}
                          type="button"
                          className={`${styles.variantButton} ${variantActive ? styles.active : ''}`}
                          aria-current={variantActive ? 'page' : undefined}
                          onClick={() => handleVariantClick(variant, section)}
                        >
                          {formatVariantConfig[variant].title}
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
                {selectedVariant ? formatSectionConfig[selectedSection].title : 'Formato'}
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
            <SectionLoader message="Cargando formato" />
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
                    aria-label="Contenido del formato en Markdown"
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
              <h3>No se pudo cargar este formato</h3>
              <p>Intenta de nuevo en un momento. Si el problema sigue, avísanos.</p>
            </div>
          ) : content.trim() ? (
            <MarkdownBody content={content} />
          ) : (
            <div className={styles.status}>
              <h3>Este formato todavía no tiene contenido</h3>
              <p>
                {isAdmin
                  ? 'Usa Editar para escribir el markdown de esta página.'
                  : 'Vuelve más tarde para leer las reglas.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GameFormatsPage;
