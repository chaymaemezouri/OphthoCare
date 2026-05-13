'use client';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, requireAuth } = useAuth();

  requireAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                OphthoCare
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <nav className="p-6 space-y-4">
            {user?.role === 'patient' && (
              <>
                <Link href="/dashboard/patient" className="block text-gray-700 hover:text-blue-600">
                  Accueil
                </Link>
                <Link href="/dashboard/patient/bookings" className="block text-gray-700 hover:text-blue-600">
                  Mes Rendez-vous
                </Link>
                <Link href="/dashboard/patient/medical-records" className="block text-gray-700 hover:text-blue-600">
                  Dossier Médical
                </Link>
              </>
            )}

            {user?.role === 'doctor' && (
              <>
                <Link href={`/dashboard/doctor/${user.id}`} className="block text-gray-700 hover:text-blue-600">
                  Accueil
                </Link>
                <Link href={`/dashboard/doctor/${user.id}/calendar`} className="block text-gray-700 hover:text-blue-600">
                  Calendrier
                </Link>
                <Link href={`/dashboard/doctor/${user.id}/patients`} className="block text-gray-700 hover:text-blue-600">
                  Mes Patients
                </Link>
                <Link href={`/dashboard/doctor/${user.id}/consultations`} className="block text-gray-700 hover:text-blue-600">
                  Consultations
                </Link>
                <Link href={`/dashboard/doctor/${user.id}/prescriptions`} className="block text-gray-700 hover:text-blue-600">
                  Ordonnances
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
