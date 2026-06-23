"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ReviewRow = Awaited<ReturnType<typeof adminApi.pendingReviews>>[number];

export default function AdminModerationPage() {
  useRequireAuth();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminApi.pendingReviews());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    await adminApi.approveReview(id);
    void load();
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Motif du rejet (optionnel) :");
    await adminApi.rejectReview(id, reason ?? undefined);
    void load();
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Modération des avis</h2>
          <p className="text-sm text-slate-500">Patients anonymisés — pas d&apos;accès au dossier médical</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-slate-500 text-sm">
              Aucun avis en attente de modération.
            </CardContent>
          </Card>
        ) : (
          rows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-start gap-4">
                  <span>
                    {r.doctor.displayName} · {r.doctor.specialtyName}
                  </span>
                  <span className="text-amber-600 font-bold">{r.rating}/5</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">{r.comment}</p>
                <p className="text-xs text-slate-400">
                  {r.patientLabel} · {new Date(r.createdAt).toLocaleString("fr-FR")}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void approve(r.id)}>
                    Approuver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void reject(r.id)}>
                    Rejeter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

