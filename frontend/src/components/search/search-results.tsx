'use client';

import type { Doctor } from '@/types';
import { DoctorCard, DoctorCardSkeleton } from '@/components/common/doctor-card';
import { EmptyState } from '@/components/common/alerts';

interface SearchResultsProps {
  doctors: Doctor[];
  isLoading: boolean;
  hasSearched: boolean;
}

export function SearchResults({ doctors, isLoading, hasSearched }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <DoctorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Effectuez une recherche pour voir les résultats</p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <EmptyState message="Aucun médecin trouvé correspondant à votre recherche. Essayez d'autres critères." />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  );
}

export function SearchResultsContainer({
  doctors,
  isLoading,
  hasSearched,
  totalCount,
}: SearchResultsProps & { totalCount?: number }) {
  return (
    <div className="mt-8">
      {hasSearched && doctors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Résultats {totalCount ? `(${totalCount} médecins trouvés)` : ''}
          </h2>
        </div>
      )}

      <SearchResults doctors={doctors} isLoading={isLoading} hasSearched={hasSearched} />
    </div>
  );
}
