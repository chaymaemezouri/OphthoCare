import type { Appointment } from '@/types';

function doctorLabel(a: Appointment): string {
  const u = a.doctor.user;
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return n ? `Dr. ${n}` : u.email || 'Médecin';
}

function icsTimestamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function locationLine(a: Appointment): string {
  const d = a.doctor;
  const parts = [d.street, [d.postalCode, d.city].filter(Boolean).join(' ')].filter(Boolean);
  return parts.join(', ');
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Ouvre Google Agenda avec un événement prérempli (nouvel onglet). */
export function openGoogleCalendarTemplate(a: Appointment): void {
  const start = icsTimestamp(a.startTime);
  const end = icsTimestamp(a.endTime);
  const text = encodeURIComponent(`Consultation — ${doctorLabel(a)}`);
  const loc = encodeURIComponent(locationLine(a));
  const details = encodeURIComponent(a.reason ? `Motif : ${a.reason}` : '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&location=${loc}&details=${details}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Télécharge un fichier .ics pour le rendez-vous. */
export function downloadAppointmentIcs(a: Appointment): void {
  const uid = `${a.id}@care.local`;
  const dtStamp = icsTimestamp(new Date().toISOString());
  const dtStart = icsTimestamp(a.startTime);
  const dtEnd = icsTimestamp(a.endTime);
  const summary = icsEscape(`Consultation — ${doctorLabel(a)}`);
  const desc = a.reason ? icsEscape(`Motif : ${a.reason}`) : '';
  const loc = icsEscape(locationLine(a));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OphthoCare//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    loc ? `LOCATION:${loc}` : '',
    desc ? `DESCRIPTION:${desc}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  const ics = lines.join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = `rdv-${a.id.slice(0, 8)}.ics`;
  el.click();
  URL.revokeObjectURL(url);
}
