'use client';

import { MessagingPanel } from '@/components/common/MessagingPanel';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { useRequireAuth } from '@/hooks/use-auth';

export default function PatientMessagesPage() {
  useRequireAuth();
  return (
    <PatientPageShell className="space-y-5">
      <PatientPageHeader
        title="Messages"
        description="Échangez avec les secrétariats de vos cabinets. Réponses visibles ici en temps réel."
        variant="compact"
      />
      <MessagingPanel variant="patient" />
    </PatientPageShell>
  );
}
