'use client';

import { useAuth } from '@/hooks/use-auth';

export default function PatientDashboard() {
  const { user, isLoading, requireAuth } = useAuth();

  requireAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Tableau de bord Patient</h1>
      <p className="mt-4">Bienvenue, {user?.firstName || user?.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Prochains Rendez-vous</h2>
          <p className="text-gray-600 mt-2">Voir vos rendez-vous programmés</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Dossier Médical</h2>
          <p className="text-gray-600 mt-2">Consulter vos documents médicaux</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Trouver un Médecin</h2>
          <p className="text-gray-600 mt-2">Rechercher et prendre rendez-vous</p>
        </div>
      </div>
    </div>
  );
}
