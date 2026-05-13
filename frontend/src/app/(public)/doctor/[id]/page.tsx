'use client';

import { useState, useEffect } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { LoadingSpinner } from '@/components/common/alerts';
import Link from 'next/link';
import { formatCurrency, getInitials } from '@/lib/utils/formatters';
import type { Doctor } from '@/types';

interface DoctorDetailPageProps {
  params: {
    id: string;
  };
}

export default function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const { fetchDoctorById, isLoading, error } = useDoctors();
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const loadDoctor = async () => {
      const result = await fetchDoctorById(params.id);
      if (result) {
        setDoctor(result);
      }
    };
    loadDoctor();
  }, [params.id, fetchDoctorById]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Médecin non trouvé</h1>
          <p className="text-gray-600 mt-2">{error || 'Le médecin que vous cherchez n\'existe pas'}</p>
          <Link href="/search" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/search" className="text-blue-600 hover:text-blue-800">
            ← Retour aux résultats
          </Link>
        </div>

        {/* Doctor Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-5xl font-bold text-blue-600">
                {getInitials(doctor.user.firstName, doctor.user.lastName)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                Dr. {doctor.user.firstName} {doctor.user.lastName}
              </h1>
              <p className="text-xl text-gray-600 mt-1">{doctor.specialtyCode}</p>

              {/* Rating */}
              <div className="flex items-center mt-4 space-x-6">
                <div>
                  <p className="text-yellow-500 text-2xl font-bold">{doctor.rating.toFixed(1)} ★</p>
                  <p className="text-gray-600 text-sm">{doctor.reviewCount} avis</p>
                </div>

                {doctor.isVerified && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    ✓ Médecin vérifiés
                  </div>
                )}
              </div>

              {/* CTA */}
              <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg">
                Prendre rendez-vous
              </button>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-6 flex-shrink-0">
              <p className="text-gray-600 text-sm">Tarif consultation</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {formatCurrency(doctor.consultationPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* About */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">À propos</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <p className="text-sm font-semibold text-gray-700">Localisation</p>
                <p>{doctor.city}, {doctor.address || 'Adresse non renseignée'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700">Type de consultation</p>
                <p>Cabinet et visioconférence disponibles</p>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Horaires</h2>
            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between">
                <span>Lundi - Vendredi</span>
                <span className="font-semibold">9:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>Samedi</span>
                <span className="font-semibold">9:00 - 14:00</span>
              </div>
              <div className="flex justify-between">
                <span>Dimanche</span>
                <span className="font-semibold">Fermé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Avis Patients</h2>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-6 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">Patient Anonyme</p>
                    <div className="text-yellow-500 text-sm mt-1">★★★★★ (5.0)</div>
                  </div>
                  <p className="text-gray-500 text-sm">Il y a 2 mois</p>
                </div>
                <p className="text-gray-600 mt-3">
                  Très bon accueil, médecin très professionnel. Je recommande!
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
