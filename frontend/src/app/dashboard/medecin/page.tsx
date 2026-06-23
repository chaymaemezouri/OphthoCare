"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Calendar, ChevronRight, RefreshCw, Stethoscope } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DoctorStatCard } from "@/components/doctor/doctor-stat-card";
import { DoctorSection } from "@/components/doctor/doctor-section";
import { DoctorAppointmentTimeline } from "@/components/doctor/doctor-appointment-timeline";
import {
  DOCTOR_ACCENT_BTN,
  DOCTOR_CARD,
  DOCTOR_OUTLINE_BTN,
  DOCTOR_PRIMARY_BTN,
} from "@/components/doctor/doctor-dashboard-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { useDoctorProfile } from "@/hooks/use-doctor-profile";
import { doctorsApi } from "@/lib/api";
import type { DoctorMeAppointmentRow } from "@/types/doctor";

function patientName(a: DoctorMeAppointmentRow): string {
  const u = a.patient.user;
  if (!u) return "Patient";
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "Patient";
}

function toTimelineRow(a: DoctorMeAppointmentRow) {
  return {
    id: a.id,
    startTime: a.startTime,
    endTime: a.endTime,
    patientName: patientName(a),
    patientId: a.patient.id,
    reason: a.reason,
    type: a.type,
    status: a.status,
    appointmentId: a.id,
  };
}

export default function MedecinDashboard() {
  const router = useRouter();
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === "doctor";
  const { doctor, loading: doctorLoading, reload: reloadDoctor } = useDoctorProfile(Boolean(user) && isDoctor);
  const [appointments, setAppointments] = useState<DoctorMeAppointmentRow[]>([]);
  const [apptError, setApptError] = useState<string | null>(null);
  const [apptLoading, setApptLoading] = useState(false);

  useEffect(() => {
    if (!isDoctor && user && !authLoading) {
      router.replace("/unauthorized");
    }
  }, [isDoctor, user, authLoading, router]);

  const loadAppointments = useCallback(async () => {
    if (!isDoctor) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);
    setApptError(null);
    setApptLoading(true);
    try {
      const rows = (await doctorsApi.getMyAppointments(start.toISOString(), end.toISOString())) as DoctorMeAppointmentRow[];
      setAppointments(Array.isArray(rows) ? rows : []);
    } catch {
      setApptError("Impossible de charger les rendez-vous.");
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  }, [isDoctor]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const todayAppointments = useMemo(() => {
    const d = new Date();
    return appointments
      .filter((a) => isSameDay(parseISO(a.startTime), d) && a.status !== "cancelled")
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
  }, [appointments]);

  const upcomingOtherDays = useMemo(() => {
    const n = Date.now();
    const d = new Date();
    return appointments
      .filter(
        (a) =>
          a.status !== "cancelled" &&
          !isSameDay(parseISO(a.startTime), d) &&
          parseISO(a.startTime).getTime() >= n,
      )
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
      .slice(0, 8);
  }, [appointments]);

  const pendingToConfirm = useMemo(() => appointments.filter((a) => a.status === "pending").length, [appointments]);

  const completedToday = todayAppointments.filter((a) => a.status === "completed").length;
  const totalToday = todayAppointments.length;
  const progressPct = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  const currency = doctor?.preferredCurrency ?? "MAD";
  const revenueEstimate =
    doctor && completedToday > 0 ? completedToday * Number(doctor.consultationPrice ?? 0) : 0;

  if (authLoading || (isDoctor && doctorLoading)) {
    return (
      <DashboardLayout role="medecin">
        <DoctorPageShell>
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
            Chargement…
          </div>
        </DoctorPageShell>
      </DashboardLayout>
    );
  }

  if (!isDoctor) return null;

  const greetingName = user?.firstName || doctor?.user.firstName || "Docteur";
  const specialty = doctor?.specialtyName ?? doctor?.specialtyCode ?? "Ophtalmologie";

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-5">
        <DoctorPageHeader
          meta={`${specialty}${doctor?.city ? ` · ${doctor.city}` : ""}`}
          title={`Dr. ${greetingName}`}
          description={
            totalToday > 0
              ? `${totalToday} rendez-vous aujourd'hui — ${completedToday} terminé(s).`
              : "Aucun rendez-vous planifié aujourd'hui."
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={DOCTOR_OUTLINE_BTN}
                disabled={apptLoading}
                onClick={() => {
                  void loadAppointments();
                  void reloadDoctor();
                }}
              >
                <RefreshCw className={cn("mr-1.5 h-4 w-4", apptLoading && "animate-spin")} />
                Actualiser
              </Button>
              <Button size="sm" className={DOCTOR_PRIMARY_BTN} asChild>
                <Link href="/dashboard/medecin/consultations">
                  <Stethoscope className="mr-1.5 h-4 w-4" />
                  Ouvrir la file
                </Link>
              </Button>
            </>
          }
        />

        {apptError ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {apptError}{" "}
              <button type="button" className="font-medium underline" onClick={() => void loadAppointments()}>
                Réessayer
              </button>
            </span>
          </div>
        ) : null}

        {pendingToConfirm > 0 ? (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-950">
              <span className="font-semibold">{pendingToConfirm}</span> demande{pendingToConfirm > 1 ? "s" : ""} de
              rendez-vous en attente de confirmation.
            </p>
            <Button size="sm" variant="outline" className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100" asChild>
              <Link href="/dashboard/medecin/agenda">Traiter dans l&apos;agenda</Link>
            </Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DoctorStatCard
            label="RDV aujourd'hui"
            value={String(totalToday)}
            detail={totalToday ? `${progressPct} % effectués` : undefined}
            highlight={totalToday > 0}
          />
          <DoctorStatCard
            label="En attente de validation"
            value={String(pendingToConfirm)}
            detail={pendingToConfirm ? "À confirmer dans l'agenda" : "Rien en attente"}
            highlight={pendingToConfirm > 0}
          />
          <DoctorStatCard
            label="14 prochains jours"
            value={String(appointments.filter((a) => a.status !== "cancelled").length)}
            detail="Rendez-vous actifs"
          />
          <DoctorStatCard
            label="Honoraires du jour"
            value={
              revenueEstimate > 0
                ? new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(
                    revenueEstimate,
                  )
                : "—"
            }
            detail={
              doctor?.consultationPrice
                ? `${Number(doctor.consultationPrice).toLocaleString("fr-FR")} ${currency} / consultation`
                : undefined
            }
          />
        </div>

        {totalToday > 0 ? (
          <div className={cn(DOCTOR_CARD, "px-4 py-3 sm:px-5")}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Progression du jour</span>
              <span className="tabular-nums text-slate-500">
                {completedToday}/{totalToday}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <DoctorSection
              title="Planning du jour"
              description="Ordre chronologique — accès direct au dossier et à la consultation."
              action={{ label: "Agenda complet", href: "/dashboard/medecin/agenda" }}
            >
              <DoctorAppointmentTimeline
                items={todayAppointments.map(toTimelineRow)}
                emptyMessage="Aucun rendez-vous aujourd'hui. Consultez l'agenda pour planifier."
              />
            </DoctorSection>

            {upcomingOtherDays.length > 0 ? (
              <DoctorSection
                title="À venir"
                description="Prochains rendez-vous hors journée courante."
                action={{ label: "Tout voir", href: "/dashboard/medecin/agenda" }}
              >
                <DoctorAppointmentTimeline
                  items={upcomingOtherDays.map(toTimelineRow)}
                  showDate
                  emptyMessage=""
                />
              </DoctorSection>
            ) : null}
          </div>

          <aside className="space-y-5">
            <DoctorSection title="Accès rapide" description="Raccourcis les plus utilisés." padded>
              <ul className="space-y-1">
                {[
                  { href: "/dashboard/medecin/agenda", label: "Agenda & créneaux", icon: Calendar },
                  { href: "/dashboard/medecin/patients", label: "Rechercher un patient", icon: Stethoscope },
                  { href: "/dashboard/medecin/ordonnances", label: "Ordonnances", icon: ChevronRight },
                  { href: "/dashboard/medecin/comm", label: "Messages patients", icon: ChevronRight },
                  { href: "/dashboard/medecin/gestion", label: "Facturation", icon: ChevronRight },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className="font-medium">{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </DoctorSection>

            {doctor?.id ? (
              <DoctorSection title="Profil en ligne" description="Visible par les patients sur la recherche." padded>
                <p className="text-sm text-slate-600">
                  {doctor.city ? `${doctor.city} · ` : ""}
                  {specialty}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button size="sm" className={DOCTOR_ACCENT_BTN} asChild>
                    <Link href={`/doctor/${doctor.id}`} target="_blank" rel="noreferrer">
                      Voir la fiche publique
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className={DOCTOR_OUTLINE_BTN} asChild>
                    <Link href="/dashboard/medecin/profile">Modifier le profil</Link>
                  </Button>
                </div>
              </DoctorSection>
            ) : null}
          </aside>
        </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
