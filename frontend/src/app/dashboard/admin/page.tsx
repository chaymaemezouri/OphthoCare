"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi, type AdminPlatformStats } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-auth";
import { Activity, Loader2, Stethoscope, Users, CalendarCheck, Server } from "lucide-react";

export default function AdminDashboard() {
  useRequireAuth();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminApi.getStats());
    } catch {
      setError("Impossible de charger les statistiques (rôle admin requis).");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Administration plateforme</h2>
            <p className="text-[13px] text-slate-500 font-medium">
              Métriques agrégées uniquement — aucune donnée médicale
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
        )}

        {loading && !stats ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : stats ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Médecins actifs"
                value={String(stats.doctors.active)}
                sub={`${stats.doctors.certified} certifiés`}
                icon={Stethoscope}
              />
              <KpiCard
                title="Consultations aujourd'hui"
                value={String(stats.consultations.todayCount)}
                sub="Compteur anonyme"
                icon={Activity}
              />
              <KpiCard
                title="Nouveaux patients"
                value={String(stats.patients.newThisMonth)}
                sub="Ce mois"
                icon={Users}
              />
              <KpiCard
                title="Présence aux RDV"
                value={stats.attendanceRatePercent != null ? `${stats.attendanceRatePercent}%` : "—"}
                sub="Mois en cours"
                icon={CalendarCheck}
              />
            </div>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Inscriptions (6 mois)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.registrationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="doctors" name="Médecins" stroke="#0f172a" strokeWidth={2} />
                    <Line type="monotone" dataKey="patients" name="Patients" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-100">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" /> Santé système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Uptime" value={`${stats.systemHealth.uptimePercent}%`} />
                  <Row
                    label="Files BullMQ"
                    value={`${stats.systemHealth.queueJobs.waiting} en attente · ${stats.systemHealth.queueJobs.active} actifs · ${stats.systemHealth.queueJobs.failed} échecs`}
                  />
                  <Row label="Taux erreur Sentry" value={`${stats.systemHealth.sentryErrorRatePercent}%`} />
                </CardContent>
              </Card>

              <Card className="border-slate-100">
                <CardHeader>
                  <CardTitle className="text-base">Plateforme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Médecins" value={`${stats.doctors.total} (${stats.doctors.suspended} suspendus)`} />
                  <Row label="Patients" value={String(stats.patients.total)} />
                  <Row label="RDV ce mois" value={String(stats.appointments.thisMonth)} />
                  <Row label="Inscriptions médecins" value={String(stats.registrations.doctorsThisMonth)} />
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/doctors">Gérer les médecins</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/security">Audit & sécurité</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/moderation">Modération avis</Link>
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
          <Badge variant="outline" className="text-[10px] font-medium">
            {sub}
          </Badge>
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}
