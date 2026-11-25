
import { CollectionCatalog, CollectionFormat } from '../types/collection';
import { supabase } from '../config/supabase';

const BUCKET = 'card-catalogs';

const formatToFile: Record<CollectionFormat, string> = {
  [CollectionFormat.PRIMER_BLOQUE]: 'cartas_pb.json',
  [CollectionFormat.FURIA_EXTENDIDO]: 'cartas_fx.json',
};

// Catalogs are several MB each. Instead of busting the cache on every page load,
// the URL is versioned with the object's eTag from Storage: the browser reuses
// its cached copy until the catalog is re-uploaded, and a new upload changes the
// URL, so users get it on their next load.
const catalogRequests = new Map<CollectionFormat, Promise<CollectionCatalog>>();
let catalogVersionsRequest: Promise<Map<string, string>> | null = null;

function getLocalCatalogUrl(filename: string): string {
  return `${import.meta.env.BASE_URL}assets/json/${filename}`;
}

function loadCatalogVersions(): Promise<Map<string, string>> {
  if (!catalogVersionsRequest) {
    catalogVersionsRequest = (async () => {
      const versions = new Map<string, string>();
      const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
      if (error) throw error;
      for (const item of data ?? []) {
        const tag = (item.metadata?.eTag as string | undefined) ?? item.updated_at ?? '';
        if (tag) versions.set(item.name, tag.replace(/"/g, ''));
      }
      return versions;
    })();
    catalogVersionsRequest.catch(() => {
      catalogVersionsRequest = null;
    });
  }
  return catalogVersionsRequest;
}

async function getSupabaseCatalogRequest(filename: string): Promise<{ url: string; init: RequestInit }> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  try {
    const version = (await loadCatalogVersions()).get(filename);
    if (version) {
      return { url: `${data.publicUrl}?v=${encodeURIComponent(version)}`, init: {} };
    }
  } catch (error) {
    console.warn('Could not read catalog versions, revalidating instead:', error);
  }
  // No version available: let the browser revalidate (ETag → 304 when unchanged).
  return { url: data.publicUrl, init: { cache: 'no-cache' } };
}

async function fetchCatalog(url: string, init: RequestInit = {}): Promise<CollectionCatalog> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to load collection: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadCatalog(format: CollectionFormat): Promise<CollectionCatalog> {
  const filename = formatToFile[format];

  try {
    const { url, init } = await getSupabaseCatalogRequest(filename);
    return await fetchCatalog(url, init);
  } catch (error) {
    console.warn('Supabase catalog load failed, falling back to local JSON:', error);
    return fetchCatalog(getLocalCatalogUrl(filename), { cache: 'no-cache' });
  }
}

export const loadCollectionCards = (format: CollectionFormat): Promise<CollectionCatalog> => {
  const existing = catalogRequests.get(format);
  if (existing) return existing;

  const request = loadCatalog(format);
  catalogRequests.set(format, request);
  request.catch(() => {
    catalogRequests.delete(format);
  });
  return request;
};
