'use client';

import { Suspense } from 'react';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { PatientBookingsView, PatientBookingsLoading } from '@/components/patient/patient-bookings-view';

export default function BookingsPage() {
  useRequireAuth();
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <PatientBookingsLoading />;
  }

  return (
    <Suspense fallback={<PatientBookingsLoading />}>
      <PatientBookingsView />
    </Suspense>
  );
}
