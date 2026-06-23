"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorBillingDashboard } from "@/components/billing/doctor-billing-dashboard";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { useRequireAuth } from "@/hooks/use-auth";

export default function MedecinGestionPage() {
  useRequireAuth();

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Gestion & facturation"
          description="Reçus d'honoraires, paiements et exports comptables."
          variant="compact"
        />
        <DoctorBillingDashboard />
      </DoctorPageShell>
    </DashboardLayout>
  );
}
