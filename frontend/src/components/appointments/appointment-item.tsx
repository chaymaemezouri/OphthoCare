'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarPlus,
  Calendar as CalendarIcon,
  CalendarClock,
  ClipboardList,
  Download,
  ExternalLink,
  MapPin,
  Video,
} from 'lucide-react';
import type { Appointment } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/utils/formatters';
import { downloadAppointmentIcs, openGoogleCalendarTemplate } from '@/lib/utils/patient-appointment-calendar';
import { appointmentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface AppointmentItemProps {
  appointment: Appointment;
  onCancelled?: (id: string) => void;
}

function statusUi(status: string) {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmé', className: 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' };
    case 'completed':
      return { label: 'Terminé', className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' };
    case 'cancelled':
      return { label: 'Annulé', className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' };
    case 'no_show':
      return { label: 'Absent', className: 'bg-rose-50 text-rose-800 ring-1 ring-rose-100' };
    case 'in_progress':
      return { label: 'En consultation', className: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100' };
    default:
      return { label: 'En attente', className: 'bg-amber-50 text-amber-900 ring-1 ring-amber-100' };
  }
}

function doctorTitle(a: Appointment) {
  const u = a.doctor.user;
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return n ? `Dr. ${n}` : u.email || 'Médecin';
}

function initials(a: Appointment) {
  const u = a.doctor.user;
  const f = u.firstName?.[0] ?? '';
  const l = u.lastName?.[0] ?? '';
  if (f && l) return `${f}${l}`.toUpperCase();
  if (f) return f.toUpperCase();
  return '?';
}

function addressLine(a: Appointment) {
  const d = a.doctor;
  const line = [d.street, [d.postalCode, d.city].filter(Boolean).join(' ')].filter(Boolean).join(' — ');
  return line || d.city || null;
}

function isFutureActive(a: Appointment) {
  if (new Date(a.startTime).getTime() < Date.now()) return false;
  const s = String(a.status);
  return !['completed', 'cancelled', 'no_show'].includes(s);
}

function hasDoctorSpace(a: Appointment) {
  return Boolean(String((a as Appointment & { doctorSpaceId?: string | null }).doctorSpaceId ?? '').trim());
}

function preConsultationHref(appointmentId: string) {
  return `/dashboard/patient/bookings/${appointmentId}/pre-consultation`;
}

export function AppointmentItem({ appointment: a, onCancelled }: AppointmentItemProps) {
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const stRaw = String(a.status);
  const st = statusUi(stRaw);
  const canCancel = stRaw === 'pending' || stRaw === 'confirmed';
  const inPerson = String(a.type) === 'in-person' || String(a.type) === 'in_person';
  const showCalendarActions = isFutureActive(a);
  const addr = addressLine(a);
  const cabinetOk = hasDoctorSpace(a);
  const allowPreConsultEdit =
    showCalendarActions &&
    cabinetOk &&
    (stRaw === 'pending' || stRaw === 'confirmed' || stRaw === 'in_progress');
  const showPreConsultLink = allowPreConsultEdit || Boolean(a.preConsultationFormId);
  const preConsultLabel = allowPreConsultEdit
    ? a.preConsultationFormId
      ? 'Modifier pré-consultation'
      : 'Pré-consultation'
    : 'Voir pré-consultation';

  const submitCancel = async () => {
    if (!canCancel || busy) return;
    setBusy(true);
    try {
      await appointmentsApi.cancelWithReason(a.id, {
        cancelReason: cancelReason.trim() || undefined,
      });
      setCancelOpen(false);
      setCancelReason('');
      onCancelled?.(a.id);
    } catch {
      window.alert("Annulation impossible pour l'instant.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <article className={cn(PATIENT_CARD, 'p-4 sm:p-5')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
              {initials(a)}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{doctorTitle(a)}</h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', st.className)}>
                  {st.label}
                </span>
              </div>
              <p className="text-sm text-slate-600">{a.doctor.specialtyName ?? a.doctor.specialtyCode}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CalendarIcon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                  {formatDateTime(a.startTime)}
                </span>
                <span className="tabular-nums">{formatCurrency(a.doctor.consultationPrice)}</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  {inPerson ? (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      Présentiel
                    </>
                  ) : (
                    <>
                      <Video className="h-3.5 w-3.5" />
                      Visio
                    </>
                  )}
                </span>
              </div>

              {addr ? <p className="text-xs text-slate-500">{addr}</p> : null}
              {a.reason ? (
                <p className="text-sm text-slate-600">
                  <span className="text-slate-400">Motif · </span>
                  {a.reason}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200" asChild>
              <Link href={`/doctor/${a.doctor.id}`}>Fiche praticien</Link>
            </Button>
            {showCalendarActions ? (
              <Button variant="outline" size="sm" className="rounded-lg border-slate-200" asChild>
                <Link href={`/book/${a.doctor.id}`}>Autres créneaux</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {(showPreConsultLink || (!inPerson && isFutureActive(a)) || allowPreConsultEdit) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {!inPerson && isFutureActive(a) ? (
              <Button size="sm" className="rounded-lg bg-rose-600 hover:bg-rose-700" asChild>
                <Link href={`/dashboard/patient/teleconsult/${a.id}`}>
                  <Video className="mr-1.5 h-3.5 w-3.5" />
                  Rejoindre la visio
                </Link>
              </Button>
            ) : null}
            {showPreConsultLink ? (
              <Button variant="outline" size="sm" className="rounded-lg border-blue-200 bg-blue-50/50 text-blue-900" asChild>
                <Link href={preConsultationHref(a.id)}>
                  <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                  {preConsultLabel}
                </Link>
              </Button>
            ) : null}
            {allowPreConsultEdit ? (
              <Button variant="outline" size="sm" className="rounded-lg border-slate-200" asChild>
                <Link href={`/dashboard/patient/bookings/${a.id}/reschedule`}>
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                  Déplacer
                </Link>
              </Button>
            ) : null}
          </div>
        )}

        {showCalendarActions && !cabinetOk ? (
          <p className="mt-2 text-xs text-amber-800">Pré-consultation indisponible pour ce rendez-vous.</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
          {showCalendarActions ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-slate-600 hover:text-blue-700"
                onClick={() => openGoogleCalendarTemplate(a)}
              >
                <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                Google Agenda
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-slate-600 hover:text-blue-700"
                onClick={() => downloadAppointmentIcs(a)}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                .ics
              </Button>
            </>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-8 rounded-lg text-rose-700 hover:bg-rose-50"
              onClick={() => setCancelOpen(true)}
            >
              Annuler le RDV
            </Button>
          ) : null}
        </div>
      </article>

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelReason('');
        }}
      >
        <DialogContent className="max-w-md sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Annuler ce rendez-vous ?</DialogTitle>
            <DialogDescription>Le cabinet sera notifié. Cette action est définitive.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor={`cancel-reason-${a.id}`} className="text-xs font-medium text-slate-600">
              Message au cabinet (facultatif)
            </label>
            <textarea
              id={`cancel-reason-${a.id}`}
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={2000}
              placeholder="Ex. empêchement de dernière minute…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setCancelOpen(false)}>
              Retour
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-rose-600 hover:bg-rose-700"
              disabled={busy}
              onClick={() => void submitCancel()}
            >
              {busy ? 'Annulation…' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AppointmentSkeleton() {
  return (
    <div className={cn(PATIENT_CARD, 'p-5')}>
      <div className="flex gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
