"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TeleconsultLobby } from "@/components/teleconsult/teleconsult-lobby";
import { TeleconsultSession } from "@/components/teleconsult/teleconsult-session";
import { useRequireAuth } from "@/hooks/use-auth";

export default function SecretaireTeleconsultationPage() {
  useRequireAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DashboardLayout role="secretaire">
      {activeId ? (
        <TeleconsultSession
          appointmentId={activeId}
          role="secretary"
          onLeave={() => setActiveId(null)}
        />
      ) : (
        <TeleconsultLobby onJoin={(id) => setActiveId(id)} />
      )}
    </DashboardLayout>
  );
}
