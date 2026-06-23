"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorAnalyticsDashboard } from "@/components/analytics/doctor-analytics-dashboard";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { useRequireAuth } from "@/hooks/use-auth";

export default function AnalyticsPage() {
  useRequireAuth();

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Analytiques"
          description="Consultations, nouveaux patients et revenus — données réelles du cabinet."
          variant="compact"
        />
        <DoctorAnalyticsDashboard />
      </DoctorPageShell>
    </DashboardLayout>
  );
}
