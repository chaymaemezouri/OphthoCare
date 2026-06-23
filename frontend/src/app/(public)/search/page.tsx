'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { FilterSidebar } from '@/components/search/filter-sidebar';
import { useSearch } from '@/hooks/use-search';
import { LANDING_SHELL } from '@/components/marketing/landing-layout';
import { GlassPanel } from '@/components/marketing/landing-visuals';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { SearchFilters as SearchFiltersType } from '@/types/search';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const { search, isLoading, error, searchResults, searchTotal } = useSearch();
  const [hasSearched, setHasSearched] = useState(false);
  const [lastFilters, setLastFilters] = useState<SearchFiltersType>({ skip: 0, take: 50 });

  const runSearch = useCallback(async (filters: SearchFiltersType) => {
    setHasSearched(true);
    let merged: SearchFiltersType;
    setLastFilters((prev) => {
      merged = {
        ...prev,
        ...filters,
        skip: filters.skip ?? 0,
        take: filters.take ?? 50,
      };
      return merged;
    });
    void search(merged!);
  }, [search]);

  useEffect(() => {
    const specialtyCode = searchParams.get('specialtyCode') || searchParams.get('specialty') || undefined;
    const city = searchParams.get('city') || undefined;
    const q = searchParams.get('q') || undefined;
    const availableOn = searchParams.get('availableOn') || undefined;
    const minRating = searchParams.get('minRating');
    const maxPrice = searchParams.get('maxPrice');
    const isVerified = searchParams.get('isVerified') === 'true';
    const isCertified = searchParams.get('isCertified') === 'true';

    const initial: SearchFiltersType = {
      specialtyCode,
      city,
      q,
      availableOn,
      minRating: minRating != null && minRating !== '' ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice != null && maxPrice !== '' ? parseFloat(maxPrice) : undefined,
      isVerified: isVerified ? true : undefined,
      isCertified: isCertified ? true : undefined,
      skip: 0,
      take: 50,
    };
    setLastFilters(initial);
    setHasSearched(true);
    void search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement initial depuis l'URL uniquement
  }, []);

  return (
    <div className="pb-20 pt-8 sm:pt-10">
      <div className={cn(LANDING_SHELL)}>
        <div className="mb-8 max-w-2xl space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7EADD0]">Annuaire</p>
          <h1 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#555555] sm:text-2xl">
            Trouver un praticien
          </h1>
          <p className="text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
            Spécialité, ville, tarif et disponibilité — résultats en quelques secondes.
          </p>
        </div>

        <div className="mb-10">
          <GlassPanel tint="blue" className="p-5 sm:p-6">
            <SearchFilters
              onSearch={(f) => void runSearch(f)}
              isLoading={isLoading}
              initialSpecialtyCode={lastFilters.specialtyCode ?? lastFilters.specialty ?? ''}
              initialCity={lastFilters.city ?? ''}
              initialQ={lastFilters.q ?? ''}
            />
          </GlassPanel>
        </div>

        {error ? (
          <div className="mb-8 rounded-[20px] border border-red-200/80 bg-red-50/80 px-5 py-4 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-3">
            <div className="mb-4 lg:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="outline" className="w-full justify-center gap-2 rounded-xl border-[#E8EAED]">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtres avancés
                    </Button>
                  }
                />
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="px-1 pb-6">
                    <FilterSidebar
                      onApplyFilters={(f) => void runSearch(f)}
                      isLoading={isLoading}
                      initialFilters={lastFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden lg:block">
              <FilterSidebar
                onApplyFilters={(f) => void runSearch(f)}
                isLoading={isLoading}
                initialFilters={lastFilters}
              />
            </div>
          </div>
          <div className="lg:col-span-9">
            <SearchResults
              doctors={searchResults}
              total={searchTotal}
              isLoading={isLoading}
              hasSearched={hasSearched}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#77777D]">
          Chargement de la recherche…
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
