"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminApi, type AdminDoctorRow } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, ExternalLink } from "lucide-react";

export default function AdminDoctorsPage() {
  useRequireAuth();
  const [rows, setRows] = useState<AdminDoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [certified, setCertified] = useState<"" | "yes" | "no">("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [statsId, setStatsId] = useState<string | null>(null);
  const [statsText, setStatsText] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listDoctors({
        city: city || undefined,
        specialty: specialty || undefined,
        isCertified: certified === "yes" ? true : certified === "no" ? false : undefined,
        status: status === "all" ? undefined : status,
        take: 100,
      });
      setRows(data.items);
    } finally {
      setLoading(false);
    }
  }, [city, specialty, certified, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const header = ["id", "nom", "email", "specialite", "ville", "certifie", "suspendu", "note", "rdv"];
    const lines = rows.map((r) =>
      [
        r.id,
        r.displayName,
        r.email ?? "",
        r.specialtyName,
        r.city,
        r.isCertified ? "oui" : "non",
        r.isSuspended ? "oui" : "non",
        String(r.rating),
        String(r.appointmentCount),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medecins-ophthocare.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const specialties = useMemo(
    () => [...new Set(rows.map((r) => r.specialtyCode))].sort(),
    [rows],
  );

  const showStats = async (id: string) => {
    setStatsId(id);
    const s = await adminApi.getDoctorStats(id);
    setStatsText(
      `${s.consultationCount} consultations · ${s.appointmentCount} RDV · note ${s.averageRating} (${s.reviewCount} avis)`,
    );
  };

  const certify = async (id: string) => {
    await adminApi.certifyDoctor(id);
    void load();
  };

  const suspend = async (id: string) => {
    const reason = window.prompt("Motif de suspension :");
    if (!reason?.trim()) return;
    await adminApi.suspendDoctor(id, reason.trim());
    void load();
  };

  const unsuspend = async (id: string) => {
    await adminApi.unsuspendDoctor(id);
    void load();
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Médecins</h2>
            <p className="text-sm text-slate-500">Comptes et statistiques anonymes — pas de dossiers patients</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[140px]" />
            <select
              className="h-9 rounded-md border border-slate-200 px-2 text-sm"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">Toutes spécialités</option>
              {specialties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-slate-200 px-2 text-sm"
              value={certified}
              onChange={(e) => setCertified(e.target.value as "" | "yes" | "no")}
            >
              <option value="">Certifié ?</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
            <select
              className="h-9 rounded-md border border-slate-200 px-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>
            <Button size="sm" onClick={() => void load()}>
              Appliquer
            </Button>
          </CardContent>
        </Card>

        {statsId && statsText && (
          <p className="text-sm bg-slate-50 border rounded-lg px-4 py-2">
            Stats médecin {statsId.slice(0, 8)}… : {statsText}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Médecin</th>
                  <th className="p-3">Spécialité</th>
                  <th className="p-3">Ville</th>
                  <th className="p-3">Certifié</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">RDV</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{r.displayName}</td>
                    <td className="p-3">{r.specialtyName}</td>
                    <td className="p-3">{r.city}</td>
                    <td className="p-3">
                      {r.isCertified ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {r.isSuspended ? (
                        <Badge variant="destructive">Suspendu</Badge>
                      ) : (
                        <Badge variant="outline">Actif</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {r.rating} ({r.reviewCount})
                    </td>
                    <td className="p-3">{r.appointmentCount}</td>
                    <td className="p-3 flex flex-wrap gap-1">
                      {!r.isCertified && (
                        <Button size="sm" variant="outline" onClick={() => void certify(r.id)}>
                          Certifier
                        </Button>
                      )}
                      {r.isSuspended ? (
                        <Button size="sm" variant="outline" onClick={() => void unsuspend(r.id)}>
                          Réactiver
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => void suspend(r.id)}>
                          Suspendre
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/doctor/${r.id}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void showStats(r.id)}>
                        Stats
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

