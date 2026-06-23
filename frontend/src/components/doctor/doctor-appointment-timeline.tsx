'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DOCTOR_ACCENT_BORDER, DOCTOR_STATUS } from '@/components/doctor/doctor-dashboard-shell';

export type DoctorTimelineItem = {
  id: string;
  startTime: string;
  endTime?: string;
  patientName: string;
  patientId: string;
  reason?: string | null;
  type?: string;
  status: string;
  appointmentId?: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'confirmed':
      return 'Confirmé';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    case 'no_show':
      return 'Absent';
    default:
      return status;
  }
}

function statusStyle(status: string): string {
  if (status === 'pending') return DOCTOR_STATUS.pending;
  if (status === 'confirmed') return DOCTOR_STATUS.confirmed;
  if (status === 'in_progress') return DOCTOR_STATUS.in_progress;
  if (status === 'completed') return DOCTOR_STATUS.completed;
  if (status === 'cancelled' || status === 'no_show') return DOCTOR_STATUS.cancelled;
  return DOCTOR_STATUS.default;
}

function typeLabel(type?: string): string {
  if (type === 'video') return 'Visio';
  if (type === 'in-person' || type === 'in_person') return 'Cabinet';
  return type ?? 'Consultation';
}

function isLive(start: string, end: string | undefined, status: string, now: number): boolean {
  if (status === 'in_progress') return true;
  if (!end) return false;
  const s = parseISO(start).getTime();
  const e = parseISO(end).getTime();
  return now >= s && now <= e;
}

function isNext(start: string, status: string, now: number): boolean {
  if (status === 'cancelled' || status === 'completed') return false;
  return parseISO(start).getTime() > now;
}

type Props = {
  items: DoctorTimelineItem[];
  emptyMessage?: string;
  showDate?: boolean;
  consultHref?: (item: DoctorTimelineItem) => string;
};

export function DoctorAppointmentTimeline({
  items,
  emptyMessage = 'Aucun rendez-vous.',
  showDate = false,
  consultHref,
}: Props) {
  const now = Date.now();
  const nextId = items.find((i) => isNext(i.startTime, i.status, now))?.id;

  if (items.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-500 sm:px-5">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const live = isLive(item.startTime, item.endTime, item.status, now);
        const isNextUp = item.id === nextId;
        const dossierHref = `/dashboard/medecin/patients/${item.patientId}`;
        const consultLink =
          consultHref?.(item) ??
          `${dossierHref}?tab=consultation${item.appointmentId ? `&appointmentId=${item.appointmentId}` : ''}`;

        return (
          <li
            key={item.id}
            className={cn(
              'group flex flex-col gap-3 px-4 py-3.5 transition sm:flex-row sm:items-center sm:gap-4 sm:px-5',
              (live || isNextUp) && cn('bg-slate-50/90', DOCTOR_ACCENT_BORDER),
              !live && !isNextUp && 'hover:bg-slate-50/60',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <div className="w-[4.5rem] shrink-0">
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {format(parseISO(item.startTime), 'HH:mm')}
                </p>
                {item.endTime ? (
                  <p className="text-[11px] tabular-nums text-slate-400">
                    {format(parseISO(item.endTime), 'HH:mm')}
                  </p>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-slate-900">{item.patientName}</p>
                  {live ? (
                    <span className="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-800">
                      Maintenant
                    </span>
                  ) : isNextUp ? (
                    <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Prochain
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.reason?.trim() || typeLabel(item.type)}
                  {showDate ? ` · ${format(parseISO(item.startTime), 'EEE d MMM', { locale: fr })}` : null}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 pl-[5.5rem] sm:pl-0">
              <span
                className={cn(
                  'rounded border px-2 py-0.5 text-[11px] font-medium',
                  statusStyle(item.status),
                )}
              >
                {statusLabel(item.status)}
              </span>
              <Button variant="ghost" size="sm" className="hidden h-8 text-xs text-slate-600 sm:inline-flex" asChild>
                <Link href={dossierHref}>Dossier</Link>
              </Button>
              <Button size="sm" className="h-8 rounded-md bg-slate-800 px-3 text-xs hover:bg-slate-900" asChild>
                <Link href={consultLink}>
                  Consulter
                  <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
