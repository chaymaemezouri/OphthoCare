'use client';

import { useAuth } from '@/hooks/use-auth';
import { MedicalRecordsDisplay, MedicalDataEditor } from '@/components/medical/medical-records';
import { useState } from 'react';

export default function MedicalRecordsPage() {
  const { user, requireAuth, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'records' | 'data'>('records');

  requireAuth();

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mon Dossier Médical</h1>
        <p className="text-gray-600 mt-2">
          Consultez et gérez vos données médicales en toute sécurité
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-6 py-3 font-semibold border-b-2 transition ${
            activeTab === 'records'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Historique de Consultations
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-6 py-3 font-semibold border-b-2 transition ${
            activeTab === 'data'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Données Médicales
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'records' && <MedicalRecordsDisplay patientId={user?.id || ''} />}
        {activeTab === 'data' && <MedicalDataEditor patientId={user?.id || ''} />}
      </div>
    </div>
  );
}
