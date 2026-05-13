'use client';

import type { Doctor } from '@/types';
import { DoctorCard } from '@/components/common/doctor-card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DoctorGridProps {
  doctors: Doctor[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function DoctorGrid({
  doctors,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: DoctorGridProps) {
  const [displayCount, setDisplayCount] = useState(6);

  const displayedDoctors = doctors.slice(0, displayCount);
  const hasMoreLocal = displayCount < doctors.length;

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    } else {
      setDisplayCount((prev) => prev + 6);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displayedDoctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>

      {(hasMoreLocal || hasMore) && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isLoading} variant="outline" size="lg">
            {isLoading ? 'Chargement...' : 'Voir plus de médecins'}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour afficher une liste de médecins avec pagination infinie
 */
export function DoctorGridInfinite({
  doctors,
  isLoading,
  onLoadMore,
  hasMore,
}: DoctorGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}

      {hasMore && (
        <div className="col-span-full flex justify-center py-8">
          <Button onClick={onLoadMore} disabled={isLoading} size="lg">
            {isLoading ? 'Chargement...' : 'Charger plus'}
          </Button>
        </div>
      )}
    </div>
  );
}
