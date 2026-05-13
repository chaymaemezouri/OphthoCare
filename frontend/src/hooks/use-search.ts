'use client';

import { useState, useCallback } from 'react';
import { useSearchStore } from '@/store/search-store';
import { doctorsApi } from '@/lib/api';
import type { SearchFilters, DoctorSearchResult } from '@/types';

export const useSearch = () => {
  const { specialty, city, searchResults, isLoading, setSearchResults, setLoading } = useSearchStore();
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (filters: SearchFilters) => {
      setLoading(true);
      setError(null);

      try {
        const results = await doctorsApi.search(filters);
        setSearchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
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
    isLoading,
    error,
    search,
  };
};
