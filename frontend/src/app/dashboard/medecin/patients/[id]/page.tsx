"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { DoctorPatientDossierView } from "@/components/medical/doctor-patient-dossier-view";

function PatientDossierContent({ patientId }: { patientId: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? undefined;
  const appointmentId = searchParams.get("appointmentId") ?? undefined;
  return (
    <DoctorPatientDossierView
      patientId={patientId}
      defaultTab={tab ?? undefined}
      initialAppointmentId={appointmentId ?? undefined}
    />
  );
}

export default function PatientDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Chargement du dossier…</p>}>
      <PatientDossierContent patientId={resolvedParams.id} />
    </Suspense>
  );
}
