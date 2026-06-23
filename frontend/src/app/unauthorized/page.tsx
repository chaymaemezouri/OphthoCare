"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardPathForRole, roleLabelFr } from "@/lib/auth-routes";

export default function UnauthorizedPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role as string | undefined;
  const home = dashboardPathForRole(role);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <ShieldAlert className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Accès non autorisé</h1>
        <p className="mt-2 text-sm text-slate-600">
          {status === "authenticated" && role
            ? `Votre compte est enregistré comme ${roleLabelFr(role).toLowerCase()}. Cette section n’est pas accessible avec ce rôle.`
            : "Vous n’avez pas les droits pour afficher cette page, ou votre session a expiré."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {status === "authenticated" ? (
            <Button className="rounded-lg bg-slate-900 text-white hover:bg-slate-800" asChild>
              <Link href={home}>Mon tableau de bord</Link>
            </Button>
          ) : (
            <Button className="rounded-lg bg-slate-900 text-white hover:bg-slate-800" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          )}
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href="/">Accueil du site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
