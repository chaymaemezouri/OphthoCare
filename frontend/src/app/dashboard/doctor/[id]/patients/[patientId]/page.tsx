"use client";

import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { doctorsApi } from "@/lib/api";
import { DoctorPatientDossierView } from "@/components/medical/doctor-patient-dossier-view";

export default function DoctorIdPatientDossierPage({
  params,
}: {
  params: Promise<{ id: string; patientId: string }>;
}) {
  const resolved = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "doctor") {
      router.replace("/unauthorized");
      return;
    }
    void doctorsApi.getMe().then((me) => {
      if (me.id !== resolved.id) {
        router.replace("/dashboard/medecin");
        return;
      }
      setOk(true);
    });
  }, [authLoading, resolved.id, router, user]);

  const listPath = `/dashboard/doctor/${resolved.id}/patients`;

  if (authLoading || !ok) {
    return <div className="p-8 text-center text-slate-500 text-sm">Chargement…</div>;
  }

  return (
    <DoctorPatientDossierView
      patientId={resolved.patientId}
      listPath={listPath}
      layoutRole="medecin"
    />
  );
}
