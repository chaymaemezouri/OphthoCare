'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useId } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpecialtyPicker } from '@/components/search/specialty-picker';
import { specialtiesApi, doctorsApi } from '@/lib/api';
import type { Specialty } from '@/types';
import { cn } from '@/lib/utils';

import { PLATFORM_CITIES, mergePlatformCities } from '@/lib/constants/platform-coverage';

type LandingSearchBarProps = {
  className?: string;
  /** Raccourcis villes sous la barre (désactivé sur landing section 02) */
  showCityShortcuts?: boolean;
};

export function LandingSearchBar({ className, showCityShortcuts = true }: LandingSearchBarProps) {
  const router = useRouter();
  const cityListId = useId();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [cities, setCities] = useState<string[]>([...PLATFORM_CITIES]);
  const [specialtyCode, setSpecialtyCode] = useState('');
  const [city, setCity] = useState('');

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

  const list = specialties.map((s) => ({ code: s.code, name: s.name }));

  const submit = (overrideCity?: string) => {
    const params = new URLSearchParams();
    if (specialtyCode) params.set('specialtyCode', specialtyCode);
    const c = (overrideCity ?? city).trim();
    if (c) params.set('city', c);
    const q = params.toString();
    router.push(q ? `/search?${q}` : '/search');
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex w-full items-center gap-1.5 border-b border-[#111111]/15 pb-2 sm:gap-2">
        <div className="min-w-0 w-[36%] shrink-0 border-r border-[#E8EAED]/90 pr-2 sm:w-[30%] sm:pr-4">
          <SpecialtyPicker
            value={specialtyCode || '__all__'}
            onChange={(c) => setSpecialtyCode(c === '__all__' ? '' : c)}
            specialties={[{ code: '__all__', name: 'Spécialité' }, ...list]}
            triggerClassName="h-7 w-full border-0 bg-transparent px-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[#111111] shadow-none focus:ring-0 sm:h-8 sm:text-[11px]"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#77777D] sm:h-4 sm:w-4" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville"
            list={cityListId}
            className="h-7 border-0 bg-transparent pl-5 text-[11px] font-normal text-[#111111] placeholder:text-[#77777D] shadow-none focus-visible:ring-0 sm:h-8 sm:pl-6 sm:text-xs"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
          />
          <datalist id={cityListId}>
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Button
          type="button"
          onClick={() => submit()}
          className="h-7 w-7 shrink-0 rounded-full bg-[#111111] p-0 text-white shadow-none hover:bg-[#333333] sm:h-8 sm:w-8"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showCityShortcuts ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1">
          {cities.slice(0, 6).map((c, i) => (
            <span key={c} className="inline-flex items-center">
              {i > 0 ? <span className="mx-2 text-[#E8EAED]" aria-hidden>|</span> : null}
              <button
                type="button"
                onClick={() => {
                  setCity(c);
                  submit(c);
                }}
                className="text-[11px] font-medium text-[#77777D] transition hover:text-[#111111]"
              >
                {c}
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
