'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SpecialtyPicker } from '@/components/search/specialty-picker';
import { specialtiesApi } from '@/lib/api';
import type { Specialty } from '@/types';
import type { SearchFilters } from '@/types/search';
import { doctorsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  onApplyFilters: (filters: SearchFilters) => void;
  isLoading?: boolean;
  initialFilters?: SearchFilters;
}

export function FilterSidebar({ onApplyFilters, isLoading = false, initialFilters }: FilterSidebarProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtyCode, setSpecialtyCode] = useState(initialFilters?.specialtyCode ?? initialFilters?.specialty ?? '');
  const [city, setCity] = useState(initialFilters?.city ?? '');
  const [minRating, setMinRating] = useState(initialFilters?.minRating ?? 0);
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice ?? 2000);
  const [isVerified, setIsVerified] = useState(initialFilters?.isVerified ?? false);
  const [isCertified, setIsCertified] = useState(initialFilters?.isCertified ?? false);
  const [availableOn, setAvailableOn] = useState(initialFilters?.availableOn ?? '');
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    void specialtiesApi
      .getAll()
      .then((rows) =>
        setSpecialties(
          rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            description: r.description ?? undefined,
            icon: r.icon ?? undefined,
            doctorCount: 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
        ),
      )
      .catch(() => setSpecialties([]));
  }, []);

  useEffect(() => {
    void doctorsApi.searchCities().then(setCityOptions).catch(() => setCityOptions([]));
  }, []);

  useEffect(() => {
    if (!initialFilters) return;
    setSpecialtyCode(initialFilters.specialtyCode ?? initialFilters.specialty ?? '');
    setCity(initialFilters.city ?? '');
    setMinRating(initialFilters.minRating ?? 0);
    setMaxPrice(initialFilters.maxPrice ?? 2000);
    setIsVerified(initialFilters.isVerified ?? false);
    setIsCertified(initialFilters.isCertified ?? false);
    setAvailableOn(initialFilters.availableOn ?? '');
  }, [initialFilters]);

  const buildPayload = (): SearchFilters => ({
    specialtyCode: specialtyCode || undefined,
    city: city.trim() || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    maxPrice: maxPrice > 0 ? maxPrice : undefined,
    isVerified: isVerified ? true : undefined,
    isCertified: isCertified ? true : undefined,
    availableOn: availableOn || undefined,
    skip: 0,
    take: 50,
  });

  const handleApply = () => {
    onApplyFilters(buildPayload());
  };

  const handleReset = () => {
    setSpecialtyCode('');
    setCity('');
    setMinRating(0);
    setMaxPrice(2000);
    setIsVerified(false);
    setIsCertified(false);
    setAvailableOn('');
    onApplyFilters({ skip: 0, take: 50 });
  };

  const list = specialties.map((s) => ({ code: s.code, name: s.name }));

  return (
    <aside
      className={cn(
        'sticky top-24 h-fit w-full rounded-[24px] border border-[#E8EAED]/80 bg-white/75 p-5 shadow-[0_8px_40px_rgba(126,173,208,0.06)] backdrop-blur-xl lg:max-w-sm',
      )}
      style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">Filtres</p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-[#77777D]">Spécialité</Label>
          <SpecialtyPicker
            value={specialtyCode || '__all__'}
            onChange={(code) => setSpecialtyCode(code === '__all__' ? '' : code)}
            specialties={[{ code: '__all__', name: 'Toutes' }, ...list]}
            triggerClassName="h-10 w-full rounded-xl border-[#E8EAED] bg-white/80 text-sm font-normal text-[#111111] shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filt-city" className="text-[11px] font-medium uppercase tracking-wider text-[#77777D]">
            Ville
          </Label>
          <Input
            id="filt-city"
            list="doctor-city-options"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville ou région"
            className="h-10 rounded-xl border-[#E8EAED] bg-white/80 text-sm shadow-none"
          />
          <datalist id="doctor-city-options">
            {cityOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-[#77777D]">
            Note minimale · {minRating.toFixed(1)}
          </Label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="w-full accent-[#7EADD0]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-[#77777D]">
            Prix max · {maxPrice} MAD
          </Label>
          <input
            type="range"
            min={0}
            max={3000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
            className="w-full accent-[#7EADD0]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filt-date" className="text-[11px] font-medium uppercase tracking-wider text-[#77777D]">
            Disponible le
          </Label>
          <Input
            id="filt-date"
            type="date"
            value={availableOn}
            onChange={(e) => setAvailableOn(e.target.value)}
            className="h-10 rounded-xl border-[#E8EAED] bg-white/80 text-sm shadow-none"
          />
          <p className="text-[11px] leading-relaxed text-[#77777D]">
            Créneaux libres ce jour-là selon agenda et réservations.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={isCertified}
            onChange={(e) => setIsCertified(e.target.checked)}
            className="h-4 w-4 rounded border-[#E8EAED] accent-[#7EADD0]"
          />
          <span className="text-sm text-[#555555]">Certifiés uniquement</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={isVerified}
            onChange={(e) => setIsVerified(e.target.checked)}
            className="h-4 w-4 rounded border-[#E8EAED] accent-[#7EADD0]"
          />
          <span className="text-sm text-[#555555]">Vérifiés uniquement</span>
        </label>
      </div>

      <div className="mt-6 space-y-2">
        <Button
          type="button"
          onClick={handleApply}
          disabled={isLoading}
          className="h-10 w-full rounded-full border border-[#7EADD0]/40 bg-white/90 text-xs font-medium uppercase tracking-wider text-[#7EADD0] shadow-none hover:border-[#7EADD0] hover:bg-[#7EADD0]/10"
        >
          Appliquer
        </Button>
        <Button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          variant="ghost"
          className="h-10 w-full rounded-full text-xs font-medium text-[#77777D] hover:bg-[#7EADD0]/5 hover:text-[#555555]"
        >
          Réinitialiser
        </Button>
      </div>
    </aside>
  );
}
