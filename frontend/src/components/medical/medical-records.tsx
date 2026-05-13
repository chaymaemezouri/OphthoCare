'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MedicalRecordsProps {
  patientId: string;
}

export function MedicalRecordsDisplay({ patientId }: MedicalRecordsProps) {
  const [records] = useState([
    {
      id: '1',
      date: '2026-04-15',
      doctor: 'Dr. Marie Dupont',
      specialty: 'Ophtalmologie',
      diagnosis: 'Myopie',
      notes: 'Prescription de lunettes',
    },
    {
      id: '2',
      date: '2026-03-20',
      doctor: 'Dr. Jean Martin',
      specialty: 'Médecine Générale',
      diagnosis: 'Grippe saisonnière',
      notes: 'Repos recommandé',
    },
  ]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">Dossier Médical</h2>
      </div>

      <div className="divide-y">
        {records.map((record) => (
          <div key={record.id} className="p-6 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-lg">{record.diagnosis}</p>
                <p className="text-gray-600 mt-1">
                  Dr. {record.doctor} • {record.specialty}
                </p>
                <p className="text-gray-500 text-sm mt-2">{record.date}</p>
                <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded">{record.notes}</p>
              </div>

              <div className="ml-4 flex-shrink-0">
                <Button variant="outline" size="sm">
                  Télécharger
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {records.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>Aucun dossier médical disponible</p>
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour éditer les données médicales
 */
export function MedicalDataEditor({ patientId }: { patientId: string }) {
  const [medicalData, setMedicalData] = useState({
    bloodType: 'O+',
    allergies: ['Pénicilline'],
    medications: ['Aspirine 100mg'],
    chronicDiseases: ['Hypertension'],
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleAddAllergy = (allergy: string) => {
    if (!medicalData.allergies.includes(allergy)) {
      setMedicalData({
        ...medicalData,
        allergies: [...medicalData.allergies, allergy],
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Données Médicales</h2>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Enregistrer' : 'Éditer'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Blood Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Groupe sanguin</label>
          <input
            type="text"
            value={medicalData.bloodType}
            disabled={!isEditing}
            className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-50"
          />
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Allergies</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {medicalData.allergies.map((allergy) => (
              <span
                key={allergy}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
              >
                {allergy}
                {isEditing && (
                  <button
                    onClick={() =>
                      setMedicalData({
                        ...medicalData,
                        allergies: medicalData.allergies.filter((a) => a !== allergy),
                      })
                    }
                    className="ml-2 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <input
              type="text"
              placeholder="Ajouter une allergie..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleAddAllergy(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full border rounded-lg px-3 py-2"
            />
          )}
        </div>

        {/* Medications */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Médicaments actuels
          </label>
          <div className="space-y-2">
            {medicalData.medications.map((med) => (
              <div key={med} className="flex justify-between items-center bg-blue-50 p-3 rounded">
                <span>{med}</span>
                {isEditing && (
                  <button
                    onClick={() =>
                      setMedicalData({
                        ...medicalData,
                        medications: medicalData.medications.filter((m) => m !== med),
                      })
                    }
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
