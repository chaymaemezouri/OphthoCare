'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
  onApplyFilters: (filters: any) => void;
  isLoading?: boolean;
}

export function FilterSidebar({ onApplyFilters, isLoading = false }: FilterSidebarProps) {
  const [filters, setFilters] = useState({
    specialty: '',
    city: '',
    minRating: 0,
    maxPrice: 500,
    isVerified: false,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters({
      specialty: '',
      city: '',
      minRating: 0,
      maxPrice: 500,
      isVerified: false,
    });
    onApplyFilters({});
  };

  return (
    <aside className="w-full lg:w-72 bg-white p-6 rounded-lg shadow-md h-fit sticky top-4">
      <h2 className="text-xl font-bold mb-6">Filtres</h2>

      <div className="space-y-6">
        {/* Specialty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
          <select
            value={filters.specialty}
            onChange={(e) => handleFilterChange('specialty', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les spécialités</option>
            <option value="ophthalmology">Ophtalmologie</option>
            <option value="cardiology">Cardiologie</option>
            <option value="dermatology">Dermatologie</option>
            <option value="general-medicine">Médecine Générale</option>
            <option value="dentistry">Dentisterie</option>
            <option value="pediatrics">Pédiatrie</option>
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Ex: Paris, Casablanca"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note minimale: {filters.minRating.toFixed(1)} ★
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Price Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix max: {filters.maxPrice} €
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Verified Filter */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="verified"
            checked={filters.isVerified}
            onChange={(e) => handleFilterChange('isVerified', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="verified" className="ml-3 text-sm text-gray-700">
            Médecins vérifiés seulement
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 space-y-3">
        <Button onClick={handleApply} disabled={isLoading} className="w-full bg-blue-600">
          Appliquer les filtres
        </Button>
        <Button onClick={handleReset} disabled={isLoading} variant="outline" className="w-full">
          Réinitialiser
        </Button>
      </div>
    </aside>
  );
}
