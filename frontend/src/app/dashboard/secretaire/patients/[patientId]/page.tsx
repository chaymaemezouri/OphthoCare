"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { DoctorPatientDossierView } from "@/components/medical/doctor-patient-dossier-view";

export default function SecretairePatientDossierPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== "secretary") {
      router.replace("/unauthorized");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.role !== "secretary") {
    return <div className="p-8 text-center text-slate-500 text-sm">Chargement…</div>;
  }

  return (
    <DoctorPatientDossierView
      patientId={patientId}
      listPath="/dashboard/secretaire/patients"
      layoutRole="secretaire"
      readOnlyMedical
    />
  );
}
