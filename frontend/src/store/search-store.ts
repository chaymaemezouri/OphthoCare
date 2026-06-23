import { create } from 'zustand';
import type { Specialty, Doctor } from '@/types';

interface SearchState {
  specialty: string | null;
  city: string | null;
  searchResults: Doctor[];
  searchTotal: number;
  usedElasticsearch: boolean | null;
  specialties: Specialty[];
  isLoading: boolean;
  setSpecialty: (specialty: string | null) => void;
  setCity: (city: string | null) => void;
  setSearchResults: (results: Doctor[], total?: number, usedElasticsearch?: boolean | null) => void;
  setSpecialties: (specialties: Specialty[]) => void;
  setLoading: (loading: boolean) => void;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  specialty: null,
  city: null,
  searchResults: [],
  searchTotal: 0,
  usedElasticsearch: null,
  specialties: [],
  isLoading: false,

  setSpecialty: (specialty) => set({ specialty }),
  setCity: (city) => set({ city }),
  setSearchResults: (results, total = results.length, usedElasticsearch = null) =>
    set({
      searchResults: results,
      searchTotal: total,
      usedElasticsearch: usedElasticsearch ?? null,
    }),
  setSpecialties: (specialties) => set({ specialties }),
  setLoading: (loading) => set({ isLoading: loading }),

  resetSearch: () =>
    set({
      specialty: null,
      city: null,
      searchResults: [],
      searchTotal: 0,
      usedElasticsearch: null,
      isLoading: false,
    }),
}));
