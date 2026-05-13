'use client';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                OphthoCare
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900">
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    S&apos;inscrire
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">{user.email}</span>
                  <Link href="/dashboard/patient" className="text-gray-600 hover:text-gray-900">
                    Tableau de bord
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
