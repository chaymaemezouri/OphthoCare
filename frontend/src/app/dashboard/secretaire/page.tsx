"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SecretaryDashboard } from "@/components/secretaire/secretary-dashboard";
import { useRequireAuth, useAuth } from "@/hooks/use-auth";
import { dashboardPathForRole, roleLabelFr } from "@/lib/auth-routes";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function SecretaireDashboardPage() {
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const warnedWrongRole = useRef(false);

  useEffect(() => {
    if (!isLoading && user && user.role !== "secretary") {
      if (!warnedWrongRole.current) {
        warnedWrongRole.current = true;
        toast.info(
          `L’accueil cabinet est réservé aux secrétaires. Vous êtes connecté en tant que ${roleLabelFr(user.role).toLowerCase()}.`,
        );
      }
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <DashboardLayout role="secretaire">
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Chargement…</div>
      </DashboardLayout>
    );
  }

  if (user.role !== "secretary") return null;

  return (
    <DashboardLayout role="secretaire">
      <SecretaryDashboard />
    </DashboardLayout>
  );
}
