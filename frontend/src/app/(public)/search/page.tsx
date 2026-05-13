'use client';

import { useState, useCallback } from 'react';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { FilterSidebar } from '@/components/search/filter-sidebar';
import { useSearch } from '@/hooks/use-search';
import type { Doctor } from '@/types';

export default function SearchPage() {
  const { search, isLoading, error } = useSearch();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(
    async (filters: any) => {
      try {
        setHasSearched(true);
        await search(filters);
      } catch (err) {
        console.error('Search error:', err);
      }
    },
    [search]
  );

  const handleApplyFilters = useCallback(
    (filters: any) => {
      handleSearch(filters);
    },
    [handleSearch]
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trouver un Médecin</h1>
          <p className="text-lg text-gray-600">
            Recherchez parmi des milliers de médecins spécialistes
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <SearchFilters onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Results Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <FilterSidebar onApplyFilters={handleApplyFilters} isLoading={isLoading} />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <SearchResults doctors={doctors} isLoading={isLoading} hasSearched={hasSearched} />
          </div>
        </div>
      </div>
    </div>
  );
}
