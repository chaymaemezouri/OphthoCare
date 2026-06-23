'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MessagingPanel } from '@/components/common/MessagingPanel';
import { DoctorPageHeader } from '@/components/doctor/doctor-page-header';
import { DoctorPageShell } from '@/components/doctor/doctor-page-shell';
import { DOCTOR_CARD } from '@/components/doctor/doctor-dashboard-shell';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/hooks/use-auth';

export default function MedecinCommPage() {
  useRequireAuth();
  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Messagerie patients"
          description="Conversations en temps réel avec vos patients."
          variant="compact"
        />
        <div className={cn(DOCTOR_CARD, 'min-h-[calc(100vh-14rem)] overflow-hidden')}>
          <MessagingPanel />
        </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
