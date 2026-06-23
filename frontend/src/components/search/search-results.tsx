'use client';

import type { Doctor } from '@/types';
import { DoctorCard, DoctorCardSkeleton } from '@/components/common/doctor-card';
import { EmptyState } from '@/components/common/alerts';

interface SearchResultsProps {
  doctors: Doctor[];
  total?: number;
  isLoading: boolean;
  hasSearched: boolean;
}

export function SearchResults({ doctors, total, isLoading, hasSearched }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div>
        <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">Praticiens</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#E8EAED] bg-[#F8F8F6]/80 px-8 py-16 text-center">
        <p className="text-sm text-[#77777D]">
          Lancez une recherche ou modifiez les filtres pour afficher l&apos;annuaire.
        </p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <EmptyState message="Aucun praticien ne correspond à ces critères. Élargissez la ville ou la spécialité, ou retirez le filtre « disponible le »." />
    );
  }

  const count = total ?? doctors.length;

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">Praticiens</p>
        <p className="text-sm text-[#77777D]">
          <span className="font-medium tabular-nums text-[#111111]">{count}</span> résultat{count > 1 ? 's' : ''}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
}
