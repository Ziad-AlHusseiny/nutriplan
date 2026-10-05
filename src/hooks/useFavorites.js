import { useCallback } from 'react';
import { favoritesStore } from '../lib/stores.js';
import { useStored } from './useStored.js';

/** [favorites, isFavorite(id), toggle(id)] — saved in `nutriplan-favorites`. */
export function useFavorites() {
  const [favorites] = useStored(favoritesStore);
  const toggle = useCallback((id) => favoritesStore.set((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])), []);
  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);
  return [favorites, isFavorite, toggle];
}
