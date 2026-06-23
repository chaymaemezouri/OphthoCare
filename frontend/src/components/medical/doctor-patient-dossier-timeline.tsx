'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  Stethoscope,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/lib/utils/date';
import { DOCTOR_CARD, DOCTOR_STATUS } from '@/components/doctor/doctor-dashboard-shell';
import type {
  ClinicalRecordSummary,
  DossierAuditSummary,
  MedicalAppointmentSummary,
} from '@/types/patient';

type TimelineRow =
  | { kind: 'appt'; at: string; appt: MedicalAppointmentSummary }
  | { kind: 'clinical'; at: string; rec: ClinicalRecordSummary }
  | { kind: 'audit'; at: string; audit: DossierAuditSummary };

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

function statusClass(status: string): string {
  if (status === 'pending') return DOCTOR_STATUS.pending;
  if (status === 'confirmed') return DOCTOR_STATUS.confirmed;
  if (status === 'in_progress') return DOCTOR_STATUS.in_progress;
  if (status === 'completed') return DOCTOR_STATUS.completed;
  if (status === 'cancelled' || status === 'no_show') return DOCTOR_STATUS.cancelled;
  return DOCTOR_STATUS.default;
}

function typeLabel(type: string): string {
  if (type === 'video') return 'Visio';
  if (type === 'in_person' || type === 'in-person') return 'Cabinet';
  return type;
}

function kindMeta(kind: TimelineRow['kind']): { label: string; icon: LucideIcon; tone: string } {
  if (kind === 'appt') {
    return { label: 'Rendez-vous', icon: Calendar, tone: 'border-cyan-200 bg-cyan-50 text-cyan-800' };
  }
  if (kind === 'clinical') {
    return { label: 'Note clinique', icon: Stethoscope, tone: 'border-slate-200 bg-slate-100 text-slate-800' };
  }
  return { label: 'Mise à jour dossier', icon: FileText, tone: 'border-amber-200 bg-amber-50 text-amber-900' };
}

function formatTimeRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), 'HH:mm');
    const e = format(parseISO(end), 'HH:mm');
    return `${s} – ${e}`;
  } catch {
    return formatShortDate(start);
  }
}

type Props = {
  rows: TimelineRow[];
  patientId: string;
  selectedRecordId?: string | null;
  onSelectRecord?: (rec: ClinicalRecordSummary) => void;
};

export function DoctorPatientDossierTimeline({
  rows,
  patientId,
  selectedRecordId,
  onSelectRecord,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-slate-500 sm:px-5">
        Aucun événement enregistré pour ce patient.
      </p>
    );
  }

  return (
    <ul className="relative divide-y divide-slate-100">
      {rows.map((row, idx) => {
        const meta = kindMeta(row.kind);
        const Icon = meta.icon;
        const dateLabel = formatShortDate(row.at);
        const fullDate = (() => {
          try {
            return format(parseISO(row.at), 'EEEE d MMMM yyyy', { locale: fr });
          } catch {
            return dateLabel;
          }
        })();

        if (row.kind === 'appt') {
          const a = row.appt;
          const title = a.reason?.trim() || typeLabel(a.type);
          const consultHref = `/dashboard/medecin/patients/${patientId}?tab=consultation&appointmentId=${a.id}`;

          return (
            <li key={`a-${a.id}-${idx}`} className="group flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                    meta.tone,
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase', meta.tone)}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-slate-400">{fullDate}</span>
                  </div>
                  <p className="mt-1 font-medium text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatTimeRange(a.startTime, a.endTime)} · {typeLabel(a.type)}
                    {a.doctor?.specialty ? ` · ${a.doctor.specialty}` : ''}
                  </p>
                  {a.notes?.trim() ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.notes}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                <span className={cn('rounded border px-2 py-0.5 text-[11px] font-medium', statusClass(a.status))}>
                  {statusLabel(a.status)}
                </span>
                <Link
                  href={consultHref}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-slate-800 px-3 text-xs font-medium text-white hover:bg-slate-900"
                >
                  Consulter
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          );
        }

        if (row.kind === 'clinical') {
          const c = row.rec;
          const selected = selectedRecordId === c.id;

          return (
            <li key={`c-${c.id}-${idx}`}>
              <button
                type="button"
                className={cn(
                  'group flex w-full flex-col gap-2 px-4 py-4 text-left transition sm:flex-row sm:items-center sm:gap-4 sm:px-5',
                  selected ? 'border-l-[3px] border-cyan-600 bg-cyan-50/40' : 'hover:bg-slate-50/80',
                )}
                onClick={() => onSelectRecord?.(c)}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase', meta.tone)}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">{fullDate}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-900">{c.title || 'Consultation'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.author.displayName}</p>
                    {c.narrative?.trim() ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{c.narrative}</p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 pl-11 text-xs text-slate-400 sm:pl-0">
                  {c.versionCount > 1 ? `${c.versionCount} versions` : 'Voir détail'}
                </span>
              </button>
            </li>
          );
        }

        const audit = row.audit;
        return (
          <li
            key={`u-${audit.id}-${idx}`}
            className="flex items-start gap-3 px-4 py-4 sm:px-5"
          >
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                meta.tone,
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase', meta.tone)}>
                  {meta.label}
                </span>
                <span className="text-xs text-slate-400">{fullDate}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{audit.summary || 'Modification du dossier'}</p>
              <p className="mt-0.5 text-xs text-slate-500">{audit.editor.displayName}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function buildTimelineRows(
  appts: MedicalAppointmentSummary[],
  clinical: ClinicalRecordSummary[],
  audits: DossierAuditSummary[],
): TimelineRow[] {
  return [
    ...appts.map((a) => ({ kind: 'appt' as const, at: a.startTime, appt: a })),
    ...clinical.map((c) => ({ kind: 'clinical' as const, at: c.createdAt, rec: c })),
    ...audits.map((x) => ({ kind: 'audit' as const, at: x.createdAt, audit: x })),
  ].sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
}
