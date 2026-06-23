"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorBillingDashboard } from "@/components/billing/doctor-billing-dashboard";
import { ReceiptManager } from "@/components/documents/ReceiptManager";
import { useRequireAuth, useAuth } from "@/hooks/use-auth";
import { dashboardPathForRole } from "@/lib/auth-routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SecretaireGestionPage() {
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "secretary") {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, isLoading, router]);

  if (user?.role !== "secretary" && !isLoading) return null;

  return (
    <DashboardLayout role="secretaire">
      <div className="mx-auto max-w-6xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ma facturation</h2>
          <p className="text-sm text-slate-500">Encaissements et reçus du cabinet</p>
        </div>
        <ReceiptManager />
        <DoctorBillingDashboard />
      </div>
    </DashboardLayout>
  );
}
