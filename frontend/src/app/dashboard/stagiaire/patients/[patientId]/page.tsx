"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { DoctorPatientDossierView } from "@/components/medical/doctor-patient-dossier-view";

export default function StagiairePatientDossierPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== "trainee") {
      router.replace("/unauthorized");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.role !== "trainee") {
    return <div className="p-8 text-center text-slate-500 text-sm">Chargement…</div>;
  }

  return (
    <DoctorPatientDossierView
      patientId={patientId}
      listPath="/dashboard/stagiaire/patients"
      layoutRole="stagiaire"
      readOnlyMedical
    />
  );
}
