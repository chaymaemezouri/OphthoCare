'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Calendar as CalendarUi } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRequireAuth } from '@/hooks/use-auth';
import { appointmentsApi, doctorsApi } from '@/lib/api';
import type { Appointment, Doctor } from '@/types';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientPageShell } from '@/components/patient/patient-page-shell';
import { PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { patientPageClass } from '@/components/patient/patient-dashboard-shell';

type Slot = { startTime: string; endTime: string; available: boolean };

export default function RescheduleAppointmentPage() {
  useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const appointmentId = typeof params?.appointmentId === 'string' ? params.appointmentId : '';

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const siteId = useMemo(() => {
    const sid = appt?.siteId ?? (appt as Appointment & { siteId?: string })?.siteId;
    if (sid && String(sid).trim()) return String(sid).trim();
    const sites = doctor?.sites ?? doctor?.practiceSites;
    const primary = sites?.find((s) => 'isPrimary' in s && s.isPrimary);
    return primary?.id ?? sites?.[0]?.id ?? '';
  }, [appt, doctor]);

  const durationMin = useMemo(() => {
    if (!appt) return 30;
    const ms = new Date(appt.endTime).getTime() - new Date(appt.startTime).getTime();
    return Math.max(15, Math.round(ms / 60000) || 30);
  }, [appt]);

  const ymd = useMemo(() => (date ? format(date, 'yyyy-MM-dd') : ''), [date]);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const a = (await appointmentsApi.getById(appointmentId)) as Appointment;
        if (cancelled) return;
        setAppt(a);
        const d = await doctorsApi.getById(a.doctor.id);
        if (cancelled) return;
        setDoctor(d as Doctor);
      } catch {
        if (!cancelled) {
          setLoadErr('Rendez-vous introuvable ou accès refusé.');
          setAppt(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const loadSlots = useCallback(async () => {
    if (!appt || !doctor || !siteId || !ymd) return;
    setSlotsLoading(true);
    setMsg(null);
    try {
      const res = (await doctorsApi.getSiteAvailability(appt.doctor.id, siteId, ymd, durationMin)) as {
        slots: Slot[];
      };
      setSlots(res.slots ?? []);
      setSelectedSlot(null);
    } catch {
      setSlots([]);
      setMsg('Impossible de charger les créneaux pour cette date.');
    } finally {
      setSlotsLoading(false);
    }
  }, [appt, doctor, siteId, ymd, durationMin]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const availableSlots = useMemo(() => slots.filter((s) => s.available), [slots]);

  const submit = async () => {
    if (!appointmentId || !selectedSlot) return;
    setSaving(true);
    setMsg(null);
    try {
      await appointmentsApi.reschedulePatient(appointmentId, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        siteId: siteId || undefined,
        slotDate: ymd,
      });
      router.push('/dashboard/patient/bookings');
    } catch {
      setMsg('Déplacement impossible (créneau pris ou règle métier). Choisissez un autre horaire.');
    } finally {
      setSaving(false);
    }
  };

  if (!appointmentId) {
    return <p className="p-6 text-sm text-zinc-600">Lien invalide.</p>;
  }

  if (loadErr) {
    return (
      <PatientPageShell className="space-y-4">
        <p className="text-sm text-red-800">{loadErr}</p>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/dashboard/patient/bookings">Retour aux rendez-vous</Link>
        </Button>
      </PatientPageShell>
    );
  }

  if (!appt) {
    return (
      <PatientPageShell>
        <p className="text-sm text-slate-600">Chargement du rendez-vous…</p>
      </PatientPageShell>
    );
  }

  if (!doctor) {
    return (
      <PatientPageShell>
        <p className="text-sm text-slate-600">Chargement du praticien…</p>
      </PatientPageShell>
    );
  }

  const st = String(appt.status);
  if (st !== 'pending' && st !== 'confirmed') {
    return (
      <PatientPageShell className="space-y-4">
        <p className="text-sm text-slate-700">Ce rendez-vous ne peut plus être déplacé depuis l’espace patient.</p>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/dashboard/patient/bookings">Retour</Link>
        </Button>
      </PatientPageShell>
    );
  }

  if (!siteId) {
    return (
      <PatientPageShell className="space-y-4">
        <p className="text-sm text-amber-900">
          Aucun site de consultation n’est associé à ce praticien : contactez le cabinet pour modifier le créneau.
        </p>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/dashboard/patient/bookings">Retour</Link>
        </Button>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-9 gap-1.5 rounded-lg text-slate-600"
        onClick={() => router.push('/dashboard/patient/bookings')}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Mes rendez-vous
      </Button>

      <PatientPageHeader
        variant="compact"
        title="Déplacer mon rendez-vous"
        description={`Choisissez un nouveau créneau chez ${[doctor.user.firstName, doctor.user.lastName].filter(Boolean).join(' ') || doctor.user.email} — même durée (${durationMin} min), sans repasser par la recherche.`}
      />

      <div className={PATIENT_CARD + ' p-4 sm:p-6'}>
        <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          Créneau actuel :{' '}
          <span className="font-medium text-zinc-900">
            {format(new Date(appt.startTime), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </span>
        </p>

        <div className="grid gap-6 md:grid-cols-[1fr,1.1fr]">
          <div>
            <Label className="text-xs text-zinc-600">Nouvelle date</Label>
            <CalendarUi mode="single" selected={date} onSelect={setDate} className="mt-2 rounded-xl border border-zinc-200/80 p-2" />
          </div>
          <div>
            <Label className="text-xs text-zinc-600">Créneaux disponibles</Label>
            <div className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-2">
              {slotsLoading ? (
                <p className="p-4 text-sm text-zinc-500">Chargement…</p>
              ) : !ymd ? (
                <p className="p-4 text-sm text-zinc-500">Choisissez une date.</p>
              ) : availableSlots.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">Aucun créneau libre ce jour-là.</p>
              ) : (
                availableSlots.map((s) => {
                  const active =
                    selectedSlot?.startTime === s.startTime && selectedSlot?.endTime === s.endTime;
                  return (
                    <button
                      key={`${s.startTime}-${s.endTime}`}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-200'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {format(new Date(s.startTime), 'HH:mm')} – {format(new Date(s.endTime), 'HH:mm')}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {msg ? <p className="mt-4 text-sm text-rose-700">{msg}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" className="rounded-lg bg-blue-600 text-white hover:bg-blue-700" disabled={!selectedSlot || saving} onClick={() => void submit()}>
            {saving ? 'Enregistrement…' : 'Confirmer le nouveau créneau'}
          </Button>
          <Button type="button" variant="outline" className="rounded-lg border-zinc-200" asChild>
            <Link href={`/book/${appt.doctor.id}`}>Autre parcours (recherche)</Link>
          </Button>
        </div>
      </div>
    </PatientPageShell>
  );
}
