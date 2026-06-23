'use client';

import { useCallback, useState } from 'react';
import { useSearchStore } from '@/store/search-store';
import { doctorsApi } from '@/lib/api';
import type { SearchFilters } from '@/types';

export const useSearch = () => {
  const {
    specialty,
    city,
    searchResults,
    searchTotal,
    usedElasticsearch,
    isLoading,
    setSearchResults,
    setLoading,
  } = useSearchStore();
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (filters: SearchFilters) => {
      setLoading(true);
      setError(null);

      try {
        const res = await doctorsApi.search(filters);
        setSearchResults(res.items, res.total, res.usedElasticsearch ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Échec de la recherche');
        setSearchResults([], 0, null);
      } finally {
        setLoading(false);
      }
    },
    [setSearchResults, setLoading]
  );

  return {
    specialty,
    city,
    searchResults,
    searchTotal,
    usedElasticsearch,
    isLoading,
    error,
    search,
  };
};
