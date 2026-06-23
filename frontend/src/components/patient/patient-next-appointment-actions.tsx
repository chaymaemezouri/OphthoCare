'use client';

import Link from 'next/link';
import { CalendarClock, ClipboardList, Video } from 'lucide-react';
import type { Appointment } from '@/types';
import { AppointmentStatus, AppointmentType } from '@/types';
import { Button } from '@/components/ui/button';

function isFutureActive(a: Appointment) {
  if (new Date(a.startTime).getTime() < Date.now()) return false;
  const s = String(a.status);
  return !['completed', 'cancelled', 'no_show'].includes(s);
}

function isVideo(a: Appointment) {
  const t = String(a.type);
  return t === AppointmentType.VIDEO || t === 'video';
}

function hasCabinet(a: Appointment) {
  return Boolean(String(a.doctorSpaceId ?? '').trim());
}

export function PatientNextAppointmentActions({ appointment }: { appointment: Appointment }) {
  if (!isFutureActive(appointment)) return null;

  const st = String(appointment.status);
  const cabinetOk = hasCabinet(appointment);
  const allowPreConsult =
    cabinetOk &&
    (st === AppointmentStatus.PENDING ||
      st === AppointmentStatus.CONFIRMED ||
      st === 'pending' ||
      st === 'confirmed' ||
      st === 'in_progress');
  const showPreConsult = allowPreConsult || Boolean(appointment.preConsultationFormId);
  const preConsultLabel = allowPreConsult
    ? appointment.preConsultationFormId
      ? 'Modifier la pré-consultation'
      : 'Pré-consultation'
    : 'Voir la pré-consultation';

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
      {isVideo(appointment) ? (
        <Button size="sm" className="rounded-lg bg-rose-600 text-white hover:bg-rose-700" asChild>
          <Link href={`/dashboard/patient/teleconsult/${appointment.id}`} className="inline-flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5" aria-hidden />
            Rejoindre la visio
          </Link>
        </Button>
      ) : null}
      {showPreConsult ? (
        <Button variant="outline" size="sm" className="rounded-lg border-blue-200 bg-blue-50/50 text-blue-900" asChild>
          <Link
            href={`/dashboard/patient/bookings/${appointment.id}/pre-consultation`}
            className="inline-flex items-center gap-1.5"
          >
            <ClipboardList className="h-3.5 w-3.5 opacity-80" aria-hidden />
            {preConsultLabel}
          </Link>
        </Button>
      ) : null}
      {allowPreConsult ? (
        <Button variant="outline" size="sm" className="rounded-lg border-zinc-200" asChild>
          <Link
            href={`/dashboard/patient/bookings/${appointment.id}/reschedule`}
            className="inline-flex items-center gap-1.5"
          >
            <CalendarClock className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Déplacer le RDV
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
