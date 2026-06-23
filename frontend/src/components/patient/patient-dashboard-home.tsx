'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  Stethoscope,
  Video,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePatientAppointments } from '@/hooks/use-patient-appointments';
import { patientsApi, consultationsApi } from '@/lib/api';
import { formatShortDate } from '@/lib/utils/date';
import {
  downloadAppointmentIcs,
  openGoogleCalendarTemplate,
} from '@/lib/utils/patient-appointment-calendar';
import { Button } from '@/components/ui/button';
import { PatientNextAppointmentActions } from '@/components/patient/patient-next-appointment-actions';
import { PatientStatCard } from '@/components/patient/patient-stat-card';
import { patientPageClass, PATIENT_CARD, PATIENT_SECTION_TITLE } from '@/components/patient/patient-dashboard-shell';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';
import { AppointmentStatus, AppointmentType } from '@/types';

/* ——— helpers ——— */

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function doctorName(a: Appointment) {
  const u = a.doctor.user;
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return n ? `Dr. ${n}` : u.email || 'Médecin';
}

function initials(a: Appointment) {
  const u = a.doctor.user;
  const f = u.firstName?.[0] ?? '';
  const l = u.lastName?.[0] ?? '';
  return f && l ? `${f}${l}`.toUpperCase() : f ? f.toUpperCase() : '?';
}

function addressLine(a: Appointment) {
  const d = a.doctor;
  return [d.street, [d.postalCode, d.city].filter(Boolean).join(' ')].filter(Boolean).join(' — ') || d.city || null;
}

function isUpcoming(a: Appointment) {
  if (new Date(a.startTime).getTime() < Date.now()) return false;
  return !['completed', 'cancelled', 'no_show'].includes(String(a.status));
}

function isVideo(a: Appointment) {
  const t = String(a.type);
  return t === AppointmentType.VIDEO || t === 'video';
}

function hasCabinet(a: Appointment) {
  return Boolean(String(a.doctorSpaceId ?? '').trim());
}

function needsPreConsult(a: Appointment) {
  if (!hasCabinet(a) || !isUpcoming(a)) return false;
  const st = String(a.status);
  if (!['pending', 'confirmed', 'in_progress'].includes(st)) return false;
  return !a.preConsultationFormId;
}

function statusLabel(status: string) {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
    case 'confirmed':
      return 'Confirmé';
    case AppointmentStatus.PENDING:
    case 'pending':
      return 'En attente';
    case AppointmentStatus.IN_PROGRESS:
    case 'in_progress':
      return 'En cours';
    default:
      return status;
  }
}

function useCountdown(iso: string | null) {
  const [label, setLabel] = React.useState('');
  React.useEffect(() => {
    if (!iso) return;
    const tick = () => {
      const d = new Date(iso).getTime() - Date.now();
      if (d <= 0) {
        setLabel('');
        return;
      }
      const days = Math.floor(d / 86_400_000);
      const h = Math.floor((d % 86_400_000) / 3_600_000);
      const m = Math.floor((d % 3_600_000) / 60_000);
      setLabel(days > 0 ? `${days}j ${h}h` : h > 0 ? `${h}h ${m}min` : `${m} min`);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [iso]);
  return label;
}

function DateBadge({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div className="flex w-[5.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 py-4 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
        {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
      </span>
      <span className="text-4xl font-bold tabular-nums leading-none text-slate-900">{d.getDate()}</span>
      <span className="mt-1 text-xs font-medium capitalize text-slate-600">
        {d.toLocaleDateString('fr-FR', { month: 'short' })}
      </span>
    </div>
  );
}

type Task = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof ClipboardList;
  urgent?: boolean;
};

type ConsultPreview = {
  id: string;
  doctorDisplayName: string;
  status: string;
  updatedAt: string;
};

type NotifPreview = {
  id: string;
  title: string;
  createdAt: string;
  readAt: string | null;
  linkPath?: string;
};

/* ——— main ——— */

export function PatientDashboardHome() {
  const { user } = useAuth();
  const { appointments, loading, error, reload } = usePatientAppointments(user?.id);

  const [consult, setConsult] = React.useState<ConsultPreview | null>(null);
  const [notifs, setNotifs] = React.useState<NotifPreview[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [activityLoading, setActivityLoading] = React.useState(true);

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email?.split('@')[0] || 'vous';

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const { upcoming, past } = React.useMemo(() => {
    const up = appointments.filter(isUpcoming).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    const pa = appointments
      .filter((a) => !isUpcoming(a))
      .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime))
      .slice(0, 2);
    return { upcoming: up, past: pa };
  }, [appointments]);

  const next = upcoming[0];
  const countdown = useCountdown(next?.startTime ?? null);

  const tasks = React.useMemo((): Task[] => {
    const list: Task[] = [];
    if (next && needsPreConsult(next)) {
      list.push({
        id: 'preconsult',
        title: 'Questionnaire pré-consultation',
        description: 'À remplir avant votre rendez-vous',
        href: `/dashboard/patient/bookings/${next.id}/pre-consultation`,
        icon: ClipboardList,
        urgent: true,
      });
    }
    if (next && isVideo(next) && isUpcoming(next)) {
      const diff = new Date(next.startTime).getTime() - Date.now();
      if (diff > 0 && diff < 24 * 3_600_000) {
        list.push({
          id: 'video',
          title: 'Téléconsultation',
          description: diff < 3_600_000 ? 'Bientôt — préparez votre connexion' : 'Rendez-vous vidéo planifié',
          href: `/dashboard/patient/teleconsult/${next.id}`,
          icon: Video,
          urgent: diff < 3_600_000,
        });
      }
    }
    if (unread > 0) {
      list.push({
        id: 'notif',
        title: `${unread} notification${unread > 1 ? 's' : ''}`,
        description: 'À consulter dans vos alertes',
        href: '/dashboard/patient/notifications',
        icon: Bell,
      });
    }
    return list;
  }, [next, unread]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setActivityLoading(true);
      try {
        const [notifRes, consults] = await Promise.all([
          patientsApi.getMyNotifications(),
          consultationsApi.listMinePatient({}),
        ]);
        if (cancelled) return;
        setUnread(notifRes.unreadCount);
        setNotifs(notifRes.items.slice(0, 3));
        const rows = Array.isArray(consults) ? consults : [];
        const latest = rows.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
        if (latest) {
          setConsult({
            id: latest.id,
            doctorDisplayName: latest.doctor.displayName,
            status: latest.status,
            updatedAt: latest.updatedAt,
          });
        }
      } catch {
        if (!cancelled) {
          setUnread(0);
          setNotifs([]);
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={patientPageClass('space-y-6')}>
      {/* En-tête */}
      <section className={cn(PATIENT_CARD, 'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6')}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Tableau de bord</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
            {greeting}, {name}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {upcoming.length > 0
              ? `${upcoming.length} rendez-vous à venir — consultez vos actions et votre planning.`
              : 'Réservez une consultation ou explorez votre dossier de santé.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              Prendre RDV
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg border-slate-200" onClick={() => void reload()}>
            Actualiser
          </Button>
        </div>
      </section>

      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PatientStatCard
          label="RDV à venir"
          value={upcoming.length}
          hint={next ? `Prochain : ${formatShortDate(next.startTime)}` : 'Aucun planifié'}
          icon={CalendarPlus}
          href="/dashboard/patient/bookings"
          accent="blue"
        />
        <PatientStatCard
          label="Notifications"
          value={unread}
          hint={unread > 0 ? 'Non lues' : 'À jour'}
          icon={Bell}
          href="/dashboard/patient/notifications"
          accent={unread > 0 ? 'amber' : 'slate'}
        />
        <PatientStatCard
          label="Consultations"
          value={consult ? 1 : 0}
          hint={consult ? 'Dernière activité enregistrée' : 'Historique vide'}
          icon={Stethoscope}
          href="/dashboard/patient/consultations"
          accent="emerald"
        />
        <PatientStatCard
          label="Documents"
          value="—"
          hint="Ordonnances et pièces partagées"
          icon={FileText}
          href="/dashboard/patient/documents"
          accent="slate"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void reload()}>
            Réessayer
          </button>
        </p>
      ) : null}

      {/* À faire */}
      {tasks.length > 0 ? (
        <section aria-labelledby="tasks-heading">
          <h2 id="tasks-heading" className={cn(PATIENT_SECTION_TITLE, 'mb-3')}>
            À faire
          </h2>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow',
                    t.urgent ? 'border-amber-200/80 ring-1 ring-amber-100' : 'border-slate-200/80',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      t.urgent ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-700',
                    )}
                  >
                    <t.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Grille principale */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Prochain RDV */}
        <section className="lg:col-span-3" aria-labelledby="next-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="next-heading" className="text-sm font-semibold text-slate-900">
              Prochain rendez-vous
            </h2>
            <Link
              href="/dashboard/patient/bookings"
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Voir le planning
            </Link>
          </div>

          {loading && !appointments.length ? (
            <div className={cn(PATIENT_CARD, 'flex min-h-[240px] items-center justify-center')}>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
            </div>
          ) : !next ? (
            <div className={cn(PATIENT_CARD, 'border-dashed px-6 py-12 text-center')}>
              <p className="text-base font-semibold text-slate-900">Aucun rendez-vous à venir</p>
              <p className="mt-2 text-sm text-slate-500">Trouvez un praticien et choisissez un créneau en ligne.</p>
              <Button asChild className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700">
                <Link href="/search">Rechercher un médecin</Link>
              </Button>
            </div>
          ) : (
            <article className={cn(PATIENT_CARD, 'overflow-hidden p-0 shadow-sm')}>
              <div className="flex flex-col sm:flex-row">
                <div className="flex items-center justify-center bg-slate-50/80 p-5 sm:p-6">
                  <DateBadge iso={next.startTime} />
                </div>
                <div className="min-w-0 flex-1 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {countdown ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {countdown}
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-400">{statusLabel(String(next.status))}</span>
                    {isVideo(next) ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                        Visio
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                      {initials(next)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">{doctorName(next)}</h3>
                      <p className="text-sm text-slate-500">
                        {next.doctor.specialtyName ?? next.doctor.specialtyCode}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {formatTime(next.startTime)}
                        {addressLine(next) ? (
                          <span className="mt-1 block font-normal text-slate-500">
                            <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                            {addressLine(next)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {next.reason ? (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{next.reason}</p>
                  ) : null}

                  <PatientNextAppointmentActions appointment={next} />

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => openGoogleCalendarTemplate(next)}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Google Agenda
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => downloadAppointmentIcs(next)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Fichier .ics
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-lg text-xs text-blue-700" asChild>
                      <Link href={`/doctor/${next.doctor.id}`}>
                        Fiche du médecin
                        <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          )}
        </section>

        {/* Activité */}
        <aside className="lg:col-span-2" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="mb-3 text-sm font-semibold text-slate-900">
            Activité récente
          </h2>
          <div className={cn(PATIENT_CARD, 'space-y-4 p-4')}>
            {activityLoading ? (
              <p className="py-8 text-center text-xs text-slate-400">Chargement…</p>
            ) : (
              <>
                {consult ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dernière consultation</p>
                    <Link
                      href={`/dashboard/patient/consultations?open=${consult.id}`}
                      className="mt-2 flex items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Stethoscope className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{consult.doctorDisplayName}</p>
                        <p className="text-xs text-slate-500">
                          {consult.status === 'completed' ? 'Clôturée' : 'En cours'} ·{' '}
                          {formatShortDate(consult.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Aucune consultation enregistrée pour le moment.</p>
                )}

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notifications</p>
                    {unread > 0 ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    ) : null}
                  </div>
                  {notifs.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Rien de nouveau.</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {notifs.map((n) => (
                        <li key={n.id}>
                          <Link
                            href={n.linkPath || '/dashboard/patient/notifications'}
                            className={cn(
                              'block rounded-lg px-2 py-2 text-xs transition hover:bg-slate-50',
                              !n.readAt && 'bg-blue-50/60',
                            )}
                          >
                            <p className="font-medium text-slate-800 line-clamp-2">{n.title}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">{formatShortDate(n.createdAt)}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/dashboard/patient/notifications"
                    className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Toutes les alertes
                  </Link>
                </div>

                <Link
                  href="/dashboard/patient/documents"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <FileText className="h-4 w-4 text-blue-600" aria-hidden />
                  <span className="font-medium text-slate-800">Ordonnances & documents</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Planning à venir */}
      {upcoming.length > 1 ? (
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="mb-3 text-sm font-semibold text-slate-900">
            Autres rendez-vous
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.slice(1, 5).map((a) => (
              <Link
                key={a.id}
                href="/dashboard/patient/bookings"
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
              >
                <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-800">
                  <span className="text-[10px] font-bold leading-none">
                    {new Date(a.startTime).getDate()}
                  </span>
                  <span className="text-[8px] uppercase opacity-80">
                    {new Date(a.startTime).toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{doctorName(a)}</p>
                  <p className="text-xs text-slate-500">
                    {formatShortDate(a.startTime)} · {formatTime(a.startTime)}
                  </p>
                </div>
                <CalendarPlus className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Passé récent */}
      {past.length > 0 ? (
        <section aria-labelledby="past-heading" className="border-t border-slate-200/80 pt-6">
          <h2 id="past-heading" className="mb-3 text-xs font-medium text-slate-400">
            Dernières visites
          </h2>
          <ul className="flex flex-wrap gap-2">
            {past.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/doctor/${a.doctor.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-blue-200 hover:text-blue-800"
                >
                  <span className="font-semibold text-slate-800">{doctorName(a)}</span>
                  <span className="text-slate-400">· {formatShortDate(a.startTime)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
