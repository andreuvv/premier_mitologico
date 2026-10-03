import { supabase } from '../config/supabase';
import { FormatSection, FormatVariant } from '../types';
import { loadMarkdownContent } from './markdownService';

const FALLBACK_ERROR_PREFIX = '# Error';

export type FormatDocumentResult = {
  content: string;
  source: 'remote' | 'fallback';
  error: boolean;
};

export const formatDocumentSlug = (
  section: FormatSection,
  variant?: FormatVariant | null,
): string => variant ?? section;

export const getFormatDocument = async (
  section: FormatSection,
  variant?: FormatVariant | null,
): Promise<FormatDocumentResult> => {
  const slug = formatDocumentSlug(section, variant);

  const loadFallback = async (): Promise<FormatDocumentResult> => {
    const content = await loadMarkdownContent('game_formats', section, variant ?? undefined);
    return {
      content,
      source: 'fallback',
      error: content.startsWith(FALLBACK_ERROR_PREFIX),
    };
  };

  try {
    const { data, error } = await supabase
      .from('format_documents')
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
    console.error('Error loading format document:', error);
    return loadFallback();
  }
};

export const saveFormatDocument = async (
  slug: string,
  content: string,
): Promise<{ success: boolean; error?: string }> => {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('format_documents')
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
