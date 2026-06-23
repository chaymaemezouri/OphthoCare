"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TeleconsultSession } from "@/components/teleconsult/teleconsult-session";
import { PatientPageShell } from "@/components/patient/patient-page-shell";
import { Button } from "@/components/ui/button";

export default function PatientTeleconsultPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);

  return (
    <PatientPageShell className="space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-lg text-slate-600" asChild>
        <Link href="/dashboard/patient/bookings">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Mes rendez-vous
        </Link>
      </Button>
      <TeleconsultSession
        appointmentId={appointmentId}
        role="patient"
        onLeave={() => {
          window.location.href = "/dashboard/patient/bookings";
        }}
      />
    </PatientPageShell>
  );
}
