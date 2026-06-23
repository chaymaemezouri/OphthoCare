'use client';

import { useState, useEffect, useId } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpecialtyPicker } from '@/components/search/specialty-picker';
import { specialtiesApi, doctorsApi } from '@/lib/api';
import { PLATFORM_CITIES, mergePlatformCities } from '@/lib/constants/platform-coverage';
import type { Specialty } from '@/types';
import type { SearchFilters } from '@/types/search';

interface SearchFiltersBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  initialSpecialtyCode?: string;
  initialCity?: string;
  initialQ?: string;
}

export function SearchFilters({
  onSearch,
  isLoading,
  initialSpecialtyCode = '',
  initialCity = '',
  initialQ = '',
}: SearchFiltersBarProps) {
  const cityListId = useId();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [cities, setCities] = useState<string[]>([...PLATFORM_CITIES]);
  const [specialtyCode, setSpecialtyCode] = useState(initialSpecialtyCode);
  const [city, setCity] = useState(initialCity);
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    void specialtiesApi
      .getAll()
      .then((rows) =>
        setSpecialties(
          rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            doctorCount: 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
        ),
      )
      .catch(() => setSpecialties([]));

    void doctorsApi
      .searchCities()
      .then((list) => {
        if (list.length > 0) setCities(mergePlatformCities(list));
      })
      .catch(() => setCities([...PLATFORM_CITIES]));
  }, []);

  useEffect(() => {
    setSpecialtyCode(initialSpecialtyCode);
    setCity(initialCity);
    setQ(initialQ);
  }, [initialSpecialtyCode, initialCity, initialQ]);

  const runSearch = () => {
    onSearch({
      specialtyCode: specialtyCode || undefined,
      city: city.trim() || undefined,
      q: q.trim() || undefined,
      skip: 0,
      take: 50,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const list = specialties.map((s) => ({ code: s.code, name: s.name }));

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 sm:gap-5">
      <div className="flex w-full items-center gap-1.5 border-b border-[#E8EAED] pb-2 sm:gap-2">
        <div className="min-w-0 w-[38%] shrink-0 border-r border-[#E8EAED] pr-2 sm:w-[28%] sm:pr-4">
          <SpecialtyPicker
            value={specialtyCode || '__all__'}
            onChange={(c) => setSpecialtyCode(c === '__all__' ? '' : c)}
            specialties={[{ code: '__all__', name: 'Spécialité' }, ...list]}
            triggerClassName="h-8 w-full border-0 bg-transparent px-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[#555555] shadow-none focus:ring-0 sm:h-9 sm:text-[11px]"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7EADD0] sm:h-4 sm:w-4" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville"
            list={cityListId}
            className="h-8 border-0 bg-transparent pl-5 text-[11px] font-normal text-[#555555] placeholder:text-[#999999] shadow-none focus-visible:ring-0 sm:h-9 sm:pl-6 sm:text-xs"
          />
          <datalist id={cityListId}>
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-8 w-8 shrink-0 rounded-full border border-[#7EADD0]/40 bg-white/90 p-0 text-[#7EADD0] shadow-none hover:border-[#7EADD0] hover:bg-[#7EADD0]/10 sm:h-9 sm:w-9"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nom du praticien (optionnel)"
        className="h-9 max-w-md border-0 border-b border-[#E8EAED] bg-transparent px-0 text-xs text-[#555555] placeholder:text-[#999999] shadow-none focus-visible:ring-0 rounded-none"
      />
    </form>
  );
}
