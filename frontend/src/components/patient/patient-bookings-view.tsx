'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePatientAppointments } from '@/hooks/use-patient-appointments';
import { AppointmentItem, AppointmentSkeleton } from '@/components/appointments/appointment-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientStatCard } from '@/components/patient/patient-stat-card';
import { patientPageClass, PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';
import { AppointmentStatus, AppointmentType } from '@/types';
import { formatShortDate } from '@/lib/utils/date';

type TabId = 'upcoming' | 'history' | 'all';

function isUpcomingActive(a: Appointment) {
  if (new Date(a.startTime).getTime() < Date.now()) return false;
  return !['completed', 'cancelled', 'no_show'].includes(String(a.status));
}

function isVideo(a: Appointment) {
  const t = String(a.type);
  return t === AppointmentType.VIDEO || t === 'video';
}

function doctorName(a: Appointment) {
  const u = a.doctor.user;
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return n ? `Dr. ${n}` : u.email || 'Médecin';
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

function matchesQuery(a: Appointment, q: string) {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const spec = (a.doctor.specialtyName ?? a.doctor.specialtyCode ?? '').toLowerCase();
  return doctorName(a).toLowerCase().includes(needle) || spec.includes(needle) || (a.reason ?? '').toLowerCase().includes(needle);
}

function groupByMonth(items: Appointment[]) {
  const map = new Map<string, Appointment[]>();
  for (const a of items) {
    const k = monthKey(a.startTime);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(a);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'history', label: 'Historique' },
  { id: 'all', label: 'Tous' },
];

export function PatientBookingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { appointments, setAppointments, loading, error, reload } = usePatientAppointments(user?.id);

  const tabParam = searchParams.get('tab');
  const activeTab: TabId =
    tabParam === 'history' || tabParam === 'all' ? tabParam : 'upcoming';

  const [query, setQuery] = useState('');

  const { upcoming, history, allSorted } = useMemo(() => {
    const up = appointments
      .filter(isUpcomingActive)
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    const hist = appointments
      .filter((a) => !isUpcomingActive(a))
      .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
    const all = [...appointments].sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
    return { upcoming: up, history: hist, allSorted: all };
  }, [appointments]);

  const filtered = useMemo(() => {
    const base =
      activeTab === 'upcoming' ? upcoming : activeTab === 'history' ? history : allSorted;
    return base.filter((a) => matchesQuery(a, query));
  }, [activeTab, upcoming, history, allSorted, query]);

  const historyGrouped = useMemo(
    () => (activeTab === 'history' ? groupByMonth(filtered) : []),
    [activeTab, filtered],
  );

  const next = upcoming[0];

  const setTab = (tab: TabId) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', tab);
    router.replace(`/dashboard/patient/bookings?${p.toString()}`, { scroll: false });
  };

  const onCancelled = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: AppointmentStatus.CANCELLED } : a)),
    );
  };

  const counts = { upcoming: upcoming.length, history: history.length, all: appointments.length };

  return (
    <div className={patientPageClass('space-y-6')}>
      <PatientPageHeader
        title="Mes rendez-vous"
        description={
          counts.upcoming > 0
            ? `${counts.upcoming} à venir · historique, recherche et exports calendrier`
            : 'Réservez, déplacez ou annulez vos consultations en ligne.'
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200"
              onClick={() => void reload()}
              disabled={loading}
            >
              <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} aria-hidden />
              Actualiser
            </Button>
            <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/search">
                <Search className="mr-1.5 h-4 w-4" aria-hidden />
                Réserver
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <PatientStatCard label="À venir" value={counts.upcoming} icon={CalendarDays} accent="blue" />
        <PatientStatCard label="Historique" value={counts.history} icon={Clock} accent="slate" />
        <PatientStatCard label="Total" value={counts.all} icon={SlidersHorizontal} accent="slate" />
      </div>

      {next ? (
        <div className={cn(PATIENT_CARD, 'flex items-center gap-4 p-4 sm:p-5')}>
          <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
            <span className="text-lg font-bold leading-none">{new Date(next.startTime).getDate()}</span>
            <span className="text-[9px] font-medium uppercase">
              {new Date(next.startTime).toLocaleDateString('fr-FR', { month: 'short' })}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Prochain rendez-vous</p>
            <p className="truncate font-semibold text-slate-900">{doctorName(next)}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <Clock className="h-3 w-3" aria-hidden />
              {formatShortDate(next.startTime)} · {formatTime(next.startTime)}
              {isVideo(next) ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                  <Video className="h-3 w-3" aria-hidden />
                  Visio
                </span>
              ) : null}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void reload()}>
            Réessayer
          </button>
        </p>
      ) : null}

      {/* Filtres */}
      <div className="space-y-3">
        <div className="flex gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition',
                activeTab === t.id
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {t.label}
              <span className="ml-1 tabular-nums text-slate-400">({counts[t.id]})</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un médecin, une spécialité…"
            className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-10"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <SlidersHorizontal
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* Liste */}
      {loading && !appointments.length ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyTab
          tab={activeTab}
          hasQuery={Boolean(query.trim())}
          onClear={() => setQuery('')}
        />
      ) : activeTab === 'history' ? (
        <div className="space-y-8">
          {historyGrouped.map(([key, items]) => (
            <section key={key} aria-labelledby={`month-${key}`}>
              <h2 id={`month-${key}`} className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {monthLabel(key)}
              </h2>
              <ul className="space-y-4">
                {items.map((a) => (
                  <li key={a.id}>
                    <AppointmentItem appointment={a} onCancelled={onCancelled} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((a, i) => (
            <li key={a.id}>
              {activeTab === 'upcoming' && i === 0 && !query.trim() ? (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-600/80">
                  Prochain rendez-vous
                </p>
              ) : null}
              <AppointmentItem appointment={a} onCancelled={onCancelled} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyTab({
  tab,
  hasQuery,
  onClear,
}: {
  tab: TabId;
  hasQuery: boolean;
  onClear: () => void;
}) {
  if (hasQuery) {
    return (
      <div className={cn(PATIENT_CARD, 'border-dashed px-6 py-12 text-center')}>
        <p className="text-sm font-medium text-slate-900">Aucun résultat</p>
        <p className="mt-1 text-xs text-slate-500">Essayez un autre nom ou spécialité.</p>
        <Button type="button" variant="outline" size="sm" className="mt-4 rounded-lg" onClick={onClear}>
          Effacer la recherche
        </Button>
      </div>
    );
  }

  const copy =
    tab === 'upcoming'
      ? { title: 'Aucun rendez-vous à venir', desc: 'Trouvez un praticien et choisissez un créneau.', cta: 'Prendre rendez-vous' }
      : tab === 'history'
        ? { title: 'Historique vide', desc: 'Vos consultations passées apparaîtront ici.', cta: 'Réserver une consultation' }
        : { title: 'Aucun rendez-vous', desc: 'Votre planning s’affichera dès la première réservation.', cta: 'Chercher un médecin' };

  return (
      <div className={cn(PATIENT_CARD, 'border-dashed px-6 py-14 text-center')}>
      <CalendarDays className="mx-auto h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden />
      <p className="mt-4 text-base font-semibold text-slate-900">{copy.title}</p>
      <p className="mt-1 text-sm text-slate-500">{copy.desc}</p>
      <Button asChild className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700">
        <Link href="/search">{copy.cta}</Link>
      </Button>
    </div>
  );
}

export function PatientBookingsLoading() {
  return (
    <div className={patientPageClass('space-y-6')}>
      <div className="h-28 animate-pulse rounded-xl bg-slate-200/80" />
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <AppointmentSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
