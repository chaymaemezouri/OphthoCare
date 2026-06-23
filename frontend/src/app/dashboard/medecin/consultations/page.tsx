"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DOCTOR_CARD, DOCTOR_PRIMARY_BTN } from "@/components/doctor/doctor-dashboard-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Stethoscope,
  Activity,
  Search,
  Timer,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { doctorsApi } from "@/lib/api";
import type { DoctorMeAppointmentRow } from "@/types/doctor";

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return localDayKey(d) === localDayKey(ref);
}

function patientName(a: DoctorMeAppointmentRow): string {
  const u = a.patient.user;
  if (!u) return "Patient";
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "Patient";
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatTimeRange(a: DoctorMeAppointmentRow): string {
  return `${formatTime(a.startTime)} – ${formatTime(a.endTime)}`;
}

function typeLabel(t: string): string {
  if (t === "video") return "Vidéo";
  if (t === "in_person") return "Cabinet";
  return t;
}

function statusLabelFr(status: string): string {
  switch (status) {
    case "pending":
      return "En attente";
    case "confirmed":
      return "Confirmé";
    case "completed":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    case "no_show":
      return "Absent";
    default:
      return status;
  }
}

function doctorShortLabel(me: { firstName?: string | null; lastName?: string | null; email?: string }): string {
  const n = [me.firstName, me.lastName].filter(Boolean).join(" ").trim();
  if (n) return `Dr. ${n}`;
  return me.email ?? "Médecin";
}

export default function ConsultationsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<DoctorMeAppointmentRow[]>([]);
  const [doctorLabel, setDoctorLabel] = React.useState("Médecin");
  const [histSearch, setHistSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        end.setDate(end.getDate() + 14);

        const [appts, me] = await Promise.all([
          doctorsApi.getMyAppointments(start.toISOString(), end.toISOString()),
          doctorsApi.getMe().catch(() => null),
        ]);
        if (!cancelled) {
          setRows(Array.isArray(appts) ? appts : []);
          if (me?.user) {
            setDoctorLabel(doctorShortLabel(me.user));
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e && typeof e === "object" && "response" in e
              ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
              : null;
          setError(typeof msg === "string" ? msg : "Impossible de charger les rendez-vous.");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nowMs = Date.now();
  const refNow = new Date();

  const todayAll = rows.filter((a) => isSameLocalDay(a.startTime, refNow));
  const todayNonCancelled = todayAll.filter((a) => a.status !== "cancelled");

  const inProgress = todayNonCancelled.filter((a) => {
    const s = new Date(a.startTime).getTime();
    const e = new Date(a.endTime).getTime();
    return nowMs >= s && nowMs <= e;
  });

  const awaiting = todayNonCancelled
    .filter((a) => {
      const s = new Date(a.startTime).getTime();
      return nowMs < s;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const queue = [...inProgress, ...awaiting];

  const upcomingOtherDays = rows
    .filter((a) => !isSameLocalDay(a.startTime, refNow) && new Date(a.startTime).getTime() > nowMs && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 8);

  const pastToday = todayAll
    .filter((a) => {
      if (a.status === "cancelled" || a.status === "no_show") return true;
      const e = new Date(a.endTime).getTime();
      return nowMs > e || a.status === "completed";
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const qLower = histSearch.trim().toLowerCase();
  const pastFiltered =
    qLower.length === 0
      ? pastToday
      : pastToday.filter((a) => patientName(a).toLowerCase().includes(qLower));

  const rdvTodayTotal = todayNonCancelled.length;
  const rdvTodayDone = todayNonCancelled.filter((a) => {
    if (a.status === "completed") return true;
    return new Date(a.endTime).getTime() < nowMs;
  }).length;
  const progressPct = rdvTodayTotal === 0 ? 0 : Math.round((rdvTodayDone / rdvTodayTotal) * 100);

  const flowLabel = queue.length > 0 ? `${queue.length} actif${queue.length > 1 ? "s" : ""}` : "Aujourd'hui";

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="File du jour"
          description="Rendez-vous d'aujourd'hui et des 14 prochains jours — accès direct au dossier patient."
          actions={
            <Button className={DOCTOR_PRIMARY_BTN} size="sm" asChild>
              <Link href="/dashboard/medecin/agenda">
                <Plus className="mr-2 h-4 w-4" />
                Agenda
              </Link>
            </Button>
          }
        />

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    File du jour & à venir
                  </CardTitle>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                    {loading ? "…" : flowLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading && rows.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement…
                  </div>
                ) : queue.length === 0 && upcomingOtherDays.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[13px] text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-800">Aucun rendez-vous en cours ou à venir</p>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Créez un RDV depuis l&apos;agenda ou exécutez le seed démo (RDV dans ~7 jours) pour voir des entrées ici.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {queue.map((c) => {
                      const s = new Date(c.startTime).getTime();
                      const e = new Date(c.endTime).getTime();
                      const live = nowMs >= s && nowMs <= e;
                      const statusUi = live ? "En cours" : "Attente";
                      return (
                        <div
                          key={c.id}
                          className="p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                              <span className="text-[11px] font-bold text-slate-900 leading-none">
                                {formatTime(c.startTime)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[13px] font-bold text-slate-900 truncate">
                                  {patientName(c)}
                                </h4>
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest shrink-0",
                                    live ? "text-emerald-500" : "text-slate-400",
                                  )}
                                >
                                  {statusUi}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                <span className="text-slate-700 font-semibold">
                                  {c.reason?.trim() || "Consultation"}
                                </span>
                                <span>•</span>
                                <span className="text-slate-900 font-bold">{typeLabel(c.type)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              className="h-8 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-900 hidden sm:inline-flex"
                              asChild
                            >
                              <Link href={`/dashboard/medecin/patients/${c.patient.id}`}>Dossier</Link>
                            </Button>
                            <Button
                              className="h-8 px-4 rounded-lg bg-cyan-600 text-white text-[11px] font-bold hover:bg-cyan-700 shadow-sm"
                              asChild
                            >
                              <Link
                                href={`/dashboard/medecin/patients/${c.patient.id}?tab=consultation&appointmentId=${c.id}`}
                              >
                                Consulter
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {queue.length === 0 && upcomingOtherDays.length > 0 && (
                      <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Prochains rendez-vous
                        </p>
                      </div>
                    )}
                    {queue.length === 0 &&
                      upcomingOtherDays.map((c) => (
                        <div
                          key={c.id}
                          className="p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-600 leading-tight text-center px-0.5">
                                {new Date(c.startTime).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                              <span className="text-[10px] font-bold text-slate-900">
                                {formatTime(c.startTime)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[13px] font-bold text-slate-900 truncate">{patientName(c)}</h4>
                              <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                                {c.reason?.trim() || "Consultation"} • {typeLabel(c.type)}
                              </p>
                            </div>
                          </div>
                          <Button className="h-8 px-3 rounded-lg bg-slate-900 text-white text-[11px] font-bold" asChild>
                            <Link href={`/dashboard/medecin/patients/${c.patient.id}`}>Dossier</Link>
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 py-4 px-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
                    Historique du jour
                  </CardTitle>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                    <Input
                      placeholder="Rechercher un patient…"
                      value={histSearch}
                      onChange={(e) => setHistSearch(e.target.value)}
                      className="pl-8 h-8 bg-slate-50 border-none rounded-lg text-[11px] font-medium"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading && pastToday.length === 0 ? (
                  <div className="flex justify-center py-12 text-slate-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : pastFiltered.length === 0 ? (
                  <p className="px-6 py-10 text-center text-[13px] text-slate-500">
                    {pastToday.length > 0 && qLower.length > 0
                      ? "Aucun résultat pour cette recherche."
                      : "Aucune consultation terminée ou annulée aujourd\u2019hui."}
                  </p>
                ) : (
                  <Table>
                    <TableBody>
                      {pastFiltered.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/30 border-slate-50">
                          <TableCell className="px-6 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-6 w-6 border border-slate-100 shrink-0">
                                <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-[8px]">
                                  {initials(patientName(c))}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold text-slate-900 truncate">{patientName(c)}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                                  {doctorLabel}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 font-medium text-[11px] whitespace-nowrap">
                            {formatTimeRange(c)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="rounded-md px-1.5 py-0 border-slate-100 bg-white text-slate-500 font-bold text-[9px] uppercase tracking-tighter max-w-[140px] truncate"
                              title={c.reason ?? typeLabel(c.type)}
                            >
                              {c.reason?.trim() || typeLabel(c.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <Badge
                              className={cn(
                                "text-[9px] font-bold uppercase border-none mr-2",
                                c.status === "cancelled"
                                  ? "bg-slate-100 text-slate-500"
                                  : c.status === "no_show"
                                    ? "bg-rose-50 text-rose-600"
                                    : "bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {statusLabelFr(c.status)}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest" asChild>
                              <Link href={`/dashboard/medecin/patients/${c.patient.id}`}>
                                <FileText className="h-3 w-3 mr-1 inline" />
                                Dossier
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm bg-white p-6 rounded-xl">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                Aujourd&apos;hui
              </h3>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">RDV prévus</span>
                    <span className="text-slate-900">{loading ? "—" : rdvTodayTotal}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Passés / terminés</span>
                    <span className="text-slate-900">{loading ? "—" : rdvTodayDone}</span>
                  </div>
                  <div className="h-1 w-full rounded-full overflow-hidden bg-slate-100">
                    <div
                      className="h-full bg-cyan-600 transition-all"
                      style={{ width: `${Math.min(100, progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-cyan-950">Actions rapides</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Agenda", href: "/dashboard/medecin/agenda" },
                  { label: "Patients", href: "/dashboard/medecin/patients" },
                  { label: "Recherche publique", href: "/search" },
                  { label: "Profil", href: "/dashboard/medecin/profile" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-start gap-2 rounded-lg border border-cyan-100 bg-white p-3 transition hover:border-cyan-200 hover:shadow-sm"
                  >
                    <Stethoscope className="h-3.5 w-3.5 text-cyan-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700">{item.label}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
