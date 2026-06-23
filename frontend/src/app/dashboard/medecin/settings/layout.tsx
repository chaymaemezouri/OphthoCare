"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { cn } from "@/lib/utils";

function useLocationHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return hash;
}

const tabs = [
  { href: "/dashboard/medecin/settings/profile", label: "Profil" },
  { href: "/dashboard/medecin/settings/profile#equipe", label: "Équipe" },
  { href: "/dashboard/medecin/settings/sites", label: "Sites & horaires" },
  { href: "/dashboard/medecin/settings/tariffs", label: "Tarifs" },
];

export default function MedecinSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hash = useLocationHash();
  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Paramètres cabinet"
          description="Profil, équipe, lieux d'exercice et tarification."
          variant="compact"
        />
        <nav className="flex flex-wrap gap-1 border-b border-slate-200">
          {tabs.map((t) => {
            const base = t.href.split("#")[0];
            const tabHash = t.href.includes("#") ? t.href.slice(t.href.indexOf("#")) : "";
            const active = pathname === base && (tabHash ? hash === tabHash : !hash || hash === "");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-cyan-600 text-cyan-800 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </DoctorPageShell>
    </DashboardLayout>
  );
}
