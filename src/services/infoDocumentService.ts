import { supabase } from '../config/supabase';
import { InfoSection, TournamentSubsection } from '../types';
import { loadMarkdownContent } from './markdownService';

const FALLBACK_ERROR_PREFIX = '# Error';

export type InfoDocumentResult = {
  content: string;
  source: 'remote' | 'fallback';
  error: boolean;
};

export const infoDocumentSlug = (
  section: InfoSection,
  subsection?: TournamentSubsection | null,
): string => subsection ?? section;

export const getInfoDocument = async (
  section: InfoSection,
  subsection?: TournamentSubsection | null,
): Promise<InfoDocumentResult> => {
  const slug = infoDocumentSlug(section, subsection);

  const loadFallback = async (): Promise<InfoDocumentResult> => {
    const content = await loadMarkdownContent('tournament_info', section, subsection ?? undefined);
    return {
      content,
      source: 'fallback',
      error: content.startsWith(FALLBACK_ERROR_PREFIX),
    };
  };

  try {
    const { data, error } = await supabase
      .from('info_documents')
      .select('content')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return loadFallback();
    }

    return {
      content: data.content ?? '',
      source: 'remote',
      error: false,
    };
  } catch (error) {
    console.error('Error loading info document:', error);
    return loadFallback();
  }
};

export const saveInfoDocument = async (
  slug: string,
  content: string,
): Promise<{ success: boolean; error?: string }> => {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('info_documents')
    .upsert(
      {
        slug,
        content,
        updated_by: userData.user?.id ?? null,
      },
      { onConflict: 'slug' },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};
