"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorAgenda } from "@/components/agenda/doctor-agenda";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DOCTOR_OUTLINE_BTN } from "@/components/doctor/doctor-dashboard-shell";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

function AgendaWithPatientPrefill() {
  const sp = useSearchParams();
  const initial = sp.get("patientId")?.trim() || undefined;
  return <DoctorAgenda initialPatientId={initial} />;
}

export default function AgendaPage() {
  const router = useRouter();
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const isDoctor = user?.role === "doctor";

  useEffect(() => {
    if (!isDoctor && user && !isLoading) {
      router.replace("/unauthorized");
    }
  }, [isDoctor, user, isLoading, router]);

  if (isLoading || (user && !isDoctor)) {
    return (
      <DashboardLayout role="medecin">
        <DoctorPageShell>
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Chargement…</div>
        </DoctorPageShell>
      </DashboardLayout>
    );
  }

  if (!user || !isDoctor) return null;

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Mon agenda"
          description="Rendez-vous, absences et création de créneaux. Glisser-déposer pour déplacer (snap 15 min)."
          actions={
            <>
              <Button variant="outline" size="sm" className={DOCTOR_OUTLINE_BTN} asChild>
                <Link href="/dashboard/medecin">
                  Tableau de bord
                  <ChevronRight className="ml-1 h-4 w-4 opacity-50" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className={DOCTOR_OUTLINE_BTN} asChild>
                <Link href="/dashboard/medecin/profile">Profil & horaires</Link>
              </Button>
            </>
          }
        />
        <Suspense
          fallback={
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
              Chargement du planning…
            </div>
          }
        >
          <AgendaWithPatientPrefill />
        </Suspense>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
