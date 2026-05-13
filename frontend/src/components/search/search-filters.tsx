import { useState } from 'react';
import Link from 'next/link';

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
  isLoading?: boolean;
}

export function SearchFilters({ onSearch, isLoading }: SearchFiltersProps) {
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      specialty: specialty || undefined,
      city: city || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Chercher un Médecin</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spécialité
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les spécialités</option>
            <option value="ophthalmology">Ophtalmologie</option>
            <option value="cardiology">Cardiologie</option>
            <option value="dermatology">Dermatologie</option>
            <option value="general-medicine">Médecine Générale</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, Marseille..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isLoading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>
    </form>
  );
}
