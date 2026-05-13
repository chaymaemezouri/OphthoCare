'use client';

import { useAuth } from '@/hooks/use-auth';

export default function DoctorDashboard() {
  const { user, isLoading, requireAuth } = useAuth();

  requireAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Tableau de bord Médecin</h1>
      <p className="mt-4">Bienvenue, Dr. {user?.firstName} {user?.lastName}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Patients</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">-</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Rendez-vous Aujourd&apos;hui</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">-</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Consultations</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Ordonnances</h2>
          <p className="text-3xl font-bold text-orange-600 mt-2">-</p>
        </div>
      </div>
    </div>
  );
}
