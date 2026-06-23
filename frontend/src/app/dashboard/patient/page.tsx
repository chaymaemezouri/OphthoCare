'use client';

import { Loader2 } from 'lucide-react';
import { useRequireAuth, useAuth } from '@/hooks/use-auth';
import { PatientDashboardHome } from '@/components/patient/patient-dashboard-home';

export default function PatientPortalPage() {
  useRequireAuth();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-blue-600" aria-hidden />
        <p className="text-sm text-slate-500">Chargement de votre espace…</p>
      </div>
    );
  }

  return <PatientDashboardHome />;
}
