import { create } from 'zustand';
import type { Specialty, Doctor } from '@/types';

interface SearchState {
  specialty: string | null;
  city: string | null;
  searchResults: Doctor[];
  specialties: Specialty[];
  isLoading: boolean;
  setSpecialty: (specialty: string | null) => void;
  setCity: (city: string | null) => void;
  setSearchResults: (results: Doctor[]) => void;
  setSpecialties: (specialties: Specialty[]) => void;
  setLoading: (loading: boolean) => void;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  specialty: null,
  city: null,
  searchResults: [],
  specialties: [],
  isLoading: false,

  setSpecialty: (specialty) => set({ specialty }),
  setCity: (city) => set({ city }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSpecialties: (specialties) => set({ specialties }),
  setLoading: (loading) => set({ isLoading: loading }),

  resetSearch: () =>
    set({
      specialty: null,
      city: null,
      searchResults: [],
      isLoading: false,
    }),
}));
