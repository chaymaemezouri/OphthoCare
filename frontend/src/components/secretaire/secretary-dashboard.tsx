"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, parseISO, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  Euro,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { doctorsApi, appointmentsApi } from "@/lib/api";
import type { DoctorMeAppointmentRow } from "@/types/doctor";
import type { DoctorBillingResponse } from "@/types/doctor-billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CabinetMap, type CabinetRoom } from "@/components/medical/cabinet-map";
import { cn } from "@/lib/utils";

const ROOM_NAMES = ["Salle d'attente", "Examen 1", "Examen 2", "Consultation A", "Consultation B", "OCT / Imagerie"];

function patientName(a: DoctorMeAppointmentRow) {
  const u = a.patient.user;
  if (!u) return "Patient";
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "Patient";
}

function patientPhone(a: DoctorMeAppointmentRow) {
  return a.patient.user?.phoneNumber?.trim() || null;
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "En attente";
    case "confirmed":
      return "Arrivé / confirmé";
    case "in_progress":
      return "En consultation";
    case "completed":
      return "Terminé";
    case "no_show":
      return "Absent";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

function formatMoney(amount: number, currency: string) {
  if (currency === "MAD") return `${Math.round(amount).toLocaleString("fr-FR")} MAD`;
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

export function SecretaryDashboard() {
  const [appointments, setAppointments] = useState<DoctorMeAppointmentRow[]>([]);
  const [billing, setBilling] = useState<DoctorBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 59, 999);

      const [appts, bill] = await Promise.all([
        doctorsApi.getMyAppointments(start.toISOString(), end.toISOString()),
        doctorsApi.getMyBilling("day").catch(() => null),
      ]);
      setAppointments(Array.isArray(appts) ? appts : []);
      setBilling(bill);
    } catch {
      toast.error("Impossible de charger l'accueil cabinet");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = useMemo(() => {
    const d = new Date();
    return appointments.filter((a) => isSameDay(parseISO(a.startTime), d) && a.status !== "cancelled");
  }, [appointments]);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return appointments.filter((a) => isSameDay(parseISO(a.startTime), d) && a.status !== "cancelled");
  }, [appointments]);

  const waiting = useMemo(
    () =>
      today
        .filter((a) => a.status === "pending" || a.status === "confirmed")
        .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()),
    [today],
  );

  const inProgress = useMemo(() => today.filter((a) => a.status === "in_progress"), [today]);

  const pendingConfirm = useMemo(() => today.filter((a) => a.status === "pending").length, [today]);

  const completedToday = useMemo(() => today.filter((a) => a.status === "completed").length, [today]);

  const currency = billing?.currency ?? "MAD";

  const stats = useMemo(
    () => [
      {
        title: "RDV aujourd'hui",
        value: String(today.length),
        hint: `${completedToday} terminé(s)`,
        icon: Calendar,
        color: "text-slate-600",
      },
      {
        title: "En salle d'attente",
        value: String(waiting.length),
        hint: `${inProgress.length} en consultation`,
        icon: Clock,
        color: "text-orange-600",
      },
      {
        title: "À confirmer (accueil)",
        value: String(pendingConfirm),
        hint: pendingConfirm ? "Enregistrer l'arrivée" : "Tout est à jour",
        icon: AlertCircle,
        color: pendingConfirm ? "text-rose-600" : "text-slate-400",
      },
      {
        title: "Recettes du jour",
        value: billing ? formatMoney(billing.summary.todayRevenue, currency) : "—",
        hint: billing ? `${billing.summary.unpaidCount} impayé(s)` : "Facturation",
        icon: Euro,
        color: "text-emerald-600",
      },
    ],
    [billing, completedToday, currency, inProgress.length, pendingConfirm, today.length, waiting.length],
  );

  const cabinetRooms: CabinetRoom[] = useMemo(() => {
    const rooms: CabinetRoom[] = ROOM_NAMES.map((name, i) => ({
      id: String(i + 1),
      name,
      status: "available" as const,
    }));
    inProgress.forEach((a, idx) => {
      if (idx >= rooms.length) return;
      const start = parseISO(a.startTime);
      const mins = Math.max(0, differenceInMinutes(new Date(), start));
      rooms[idx] = {
        id: rooms[idx].id,
        name: rooms[idx].name,
        patient: patientName(a),
        status: a.reason?.toLowerCase().includes("urgent") ? "urgent" : "occupied",
        timeInRoom: `${mins} min`,
      };
    });
    return rooms;
  }, [inProgress]);

  const handleCheckIn = async (a: DoctorMeAppointmentRow) => {
    if (a.status !== "pending") return;
    setActingId(a.id);
    try {
      await appointmentsApi.checkIn(a.id);
      toast.success(`${patientName(a)} — arrivée enregistrée`);
      await load();
    } catch {
      toast.error("Échec enregistrement arrivée");
    } finally {
      setActingId(null);
    }
  };

  const handleSendPreConsultation = async (a: DoctorMeAppointmentRow) => {
    if (a.status === "cancelled" || a.status === "completed" || a.status === "no_show") return;
    setActingId(a.id);
    try {
      await appointmentsApi.sendPreConsultationLink(a.id);
      toast.success(`Lien pré-consultation envoyé à ${patientName(a)}`);
    } catch {
      toast.error("Impossible d’envoyer le lien pré-consultation");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Espace accueil</h2>
          <p className="text-[13px] font-medium text-slate-500">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })} — flux patients, rappels et encaissements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-slate-200 bg-white px-4 text-[12px] font-bold"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-4 w-4 text-slate-400" />
            Actualiser
          </Button>
          <Link
            href="/dashboard/secretaire/patients"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-900 hover:bg-slate-50"
          >
            <Users className="mr-2 h-4 w-4 text-slate-400" />
            Dossiers
          </Link>
          <Link
            href="/dashboard/secretaire/agenda"
            className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-6 text-[12px] font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Agenda &amp; RDV
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="border-slate-100 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50", s.color)}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.title}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8 h-auto w-full justify-start gap-8 rounded-none border-b border-slate-100 bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900"
          >
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="reminders"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900"
          >
            Rappels ({tomorrow.length})
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="rounded-none border-b-2 border-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900"
          >
            Facturation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in space-y-8 fade-in duration-300">
          <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <CabinetMap rooms={cabinetRooms} waitingCount={waiting.length} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-50 bg-slate-50/40 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">Patients du jour</CardTitle>
                    <Badge className="border-none bg-orange-50 text-[10px] font-bold uppercase text-orange-600">
                      {waiting.length + inProgress.length} actifs
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {today.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-slate-500">Aucun rendez-vous aujourd&apos;hui.</p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {today.map((a) => {
                        const start = parseISO(a.startTime);
                        const waitMins =
                          a.status === "pending" || a.status === "confirmed"
                            ? Math.max(0, differenceInMinutes(new Date(), start))
                            : 0;
                        const tel = patientPhone(a);
                        return (
                          <div
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/50"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-center">
                                <span className="text-[11px] font-bold text-slate-900">{format(start, "HH:mm")}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{patientName(a)}</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {statusLabel(a.status)}
                                  {a.reason ? ` · ${a.reason}` : ""}
                                </p>
                                {tel ? (
                                  <a href={`tel:${tel.replace(/\s/g, "")}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900">
                                    <Phone className="h-3 w-3" />
                                    {tel}
                                  </a>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {(a.status === "pending" || a.status === "confirmed") && waitMins > 15 ? (
                                <span className="text-[10px] font-bold uppercase text-orange-600">+{waitMins} min</span>
                              ) : null}
                              <Link
                                href={`/dashboard/secretaire/patients/${a.patient.id}`}
                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold hover:bg-slate-50"
                              >
                                Dossier
                              </Link>
                              {a.status !== "cancelled" &&
                              a.status !== "completed" &&
                              a.status !== "no_show" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 rounded-lg text-xs"
                                  disabled={actingId === a.id}
                                  onClick={() => void handleSendPreConsultation(a)}
                                >
                                  Pré-consult.
                                </Button>
                              ) : null}
                              {a.status === "pending" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-9 rounded-lg bg-slate-900 text-xs text-white"
                                  disabled={actingId === a.id}
                                  onClick={() => void handleCheckIn(a)}
                                >
                                  {actingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Arrivée"}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border-slate-100 bg-slate-900 p-6 text-white shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions rapides</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <Link href="/dashboard/secretaire/agenda" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10">
                      Agenda du médecin
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/secretaire/gestion" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10">
                      Encaissements &amp; reçus
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/secretaire/comm" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10">
                      Téléconsultation
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                </ul>
              </Card>

              <Card className="rounded-2xl border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MessageSquare className="h-4 w-4 text-rose-500" />
                  À traiter
                </h3>
                {pendingConfirm === 0 && waiting.length === 0 ? (
                  <p className="text-sm text-slate-500">Rien en attente pour le moment.</p>
                ) : (
                  <ul className="space-y-2 text-[13px] text-slate-600">
                    {pendingConfirm > 0 ? (
                      <li>
                        <strong>{pendingConfirm}</strong> patient(s) à enregistrer à l&apos;accueil
                      </li>
                    ) : null}
                    {billing && billing.summary.unpaidCount > 0 ? (
                      <li>
                        <Link href="/dashboard/secretaire/gestion" className="font-semibold text-slate-900 underline">
                          {billing.summary.unpaidCount} paiement(s) en attente
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reminders" className="animate-in space-y-6 fade-in duration-300">
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-sm font-bold">Rendez-vous de demain</CardTitle>
              <p className="text-xs text-slate-500">Contactez les patients pour confirmer ou rappeler le créneau.</p>
            </CardHeader>
            <CardContent className="p-0">
              {tomorrow.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">Aucun RDV demain.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {tomorrow.map((a) => {
                    const tel = patientPhone(a);
                    return (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{patientName(a)}</p>
                          <p className="text-xs text-slate-500">
                            {format(parseISO(a.startTime), "EEEE d MMM · HH:mm", { locale: fr })} — {statusLabel(a.status)}
                          </p>
                          {tel ? <p className="text-xs text-slate-600">{tel}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          {tel ? (
                            <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs" asChild>
                              <a href={`tel:${tel.replace(/\s/g, "")}`}>Appeler</a>
                            </Button>
                          ) : null}
                          <Button size="sm" className="h-9 rounded-lg bg-slate-900 text-xs text-white" asChild>
                            <Link href={`/dashboard/secretaire/patients/${a.patient.id}`}>Fiche</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="animate-in space-y-6 fade-in duration-300">
          {billing ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-slate-100">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-bold uppercase text-slate-400">Encaissé aujourd&apos;hui</p>
                    <p className="mt-1 text-xl font-bold">{formatMoney(billing.summary.todayRevenue, currency)}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-100">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-bold uppercase text-slate-400">Impayés</p>
                    <p className="mt-1 text-xl font-bold text-orange-600">
                      {formatMoney(billing.summary.unpaidTotal, currency)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-100">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-bold uppercase text-slate-400">Reçus du jour</p>
                    <p className="mt-1 text-xl font-bold">{billing.summary.receiptsInPeriod}</p>
                  </CardContent>
                </Card>
              </div>
              <Link
                href="/dashboard/secretaire/gestion"
                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ouvrir la facturation complète
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-500">Facturation indisponible.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
