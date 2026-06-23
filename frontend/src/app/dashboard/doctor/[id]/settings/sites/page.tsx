"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { doctorsApi } from "@/lib/api";

export default function DoctorIdSettingsSitesAliasPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const id = params.id as string;

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== "doctor") {
      router.replace("/unauthorized");
      return;
    }
    void doctorsApi.getMe().then((me) => {
      if (me.id !== id) {
        router.replace("/dashboard/medecin");
        return;
      }
      router.replace("/dashboard/medecin/settings/sites");
    });
  }, [id, isLoading, router, user]);

  return <div className="p-8 text-center text-slate-500 text-sm">Redirection…</div>;
}
