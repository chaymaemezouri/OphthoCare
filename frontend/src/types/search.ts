import type { Doctor } from './doctor';

export interface SearchFilters {
  specialty?: string;
  specialtyCode?: string;
  city?: string;
  q?: string;
  minRating?: number;
  maxPrice?: number;
  isVerified?: boolean;
  isCertified?: boolean;
  /** YYYY-MM-DD — médecins avec au moins un créneau libre ce jour-là */
  availableOn?: string;
  skip?: number;
  take?: number;
}

export interface DoctorSearchResponse {
  items: Doctor[];
  total: number;
  skip: number;
  take: number;
  usedElasticsearch?: boolean;
}

export interface DoctorSearchResult {
  doctor: Doctor;
  distance?: number;
  matchScore: number;
}
