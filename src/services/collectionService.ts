import { CollectionCatalog, CollectionFormat } from '../types/collection';

export const loadCollectionCards = async (format: CollectionFormat): Promise<CollectionCatalog> => {
  const filename = format === CollectionFormat.PRIMER_BLOQUE ? 'cartas_pb.json' : 'cartas_fx.json';
  const response = await fetch(`${import.meta.env.BASE_URL}assets/json/${filename}`);
  
  if (!response.ok) {
    throw new Error(`Failed to load collection: ${response.statusText}`);
  }
  
  return response.json();
};
