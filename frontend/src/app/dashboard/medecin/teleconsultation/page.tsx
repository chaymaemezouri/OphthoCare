"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DOCTOR_CARD } from "@/components/doctor/doctor-dashboard-shell";
import { TeleconsultLobby } from "@/components/teleconsult/teleconsult-lobby";
import { TeleconsultSession } from "@/components/teleconsult/teleconsult-session";
import { cn } from "@/lib/utils";

export default function TeleconsultationPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        {!activeId ? (
          <DoctorPageHeader
          title="Salles de visio"
            description="Rejoignez une consultation vidéo planifiée ou en cours."
            variant="compact"
          />
        ) : null}
        <div className={cn(DOCTOR_CARD, "min-h-[calc(100vh-12rem)] overflow-hidden")}>
          {activeId ? (
            <TeleconsultSession appointmentId={activeId} role="doctor" onLeave={() => setActiveId(null)} />
          ) : (
            <TeleconsultLobby onJoin={(id) => setActiveId(id)} />
          )}
        </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
