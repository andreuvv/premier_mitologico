import { CollectionCatalog, CollectionFormat } from '../types/collection';
import { supabase } from '../config/supabase';

const BUCKET = 'card-catalogs';

const formatToFile: Record<CollectionFormat, string> = {
  [CollectionFormat.PRIMER_BLOQUE]: 'cartas_pb.json',
  [CollectionFormat.FURIA_EXTENDIDO]: 'cartas_fx.json',
};

// One version per page load so a refresh picks up a catalog update,
// while parallel callers in the same load share a single download.
const catalogVersion = Date.now();
const catalogRequests = new Map<CollectionFormat, Promise<CollectionCatalog>>();

function getLocalCatalogUrl(filename: string): string {
  return `${import.meta.env.BASE_URL}assets/json/${filename}`;
}

function getSupabaseCatalogUrl(filename: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return `${data.publicUrl}?v=${catalogVersion}`;
}

async function fetchCatalog(url: string): Promise<CollectionCatalog> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load collection: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadCatalog(format: CollectionFormat): Promise<CollectionCatalog> {
  const filename = formatToFile[format];

  try {
    return await fetchCatalog(getSupabaseCatalogUrl(filename));
  } catch (error) {
    console.warn('Supabase catalog load failed, falling back to local JSON:', error);
    return fetchCatalog(getLocalCatalogUrl(filename));
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
