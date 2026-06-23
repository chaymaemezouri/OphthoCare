'use client';

import { Suspense } from 'react';
import { useRequireAuth } from '@/hooks/use-auth';
import {
  PatientNotificationsView,
  PatientNotificationsLoading,
} from '@/components/patient/patient-notifications-view';

export default function PatientNotificationsPage() {
  useRequireAuth();

  return (
    <Suspense fallback={<PatientNotificationsLoading />}>
      <PatientNotificationsView />
    </Suspense>
  );
}
