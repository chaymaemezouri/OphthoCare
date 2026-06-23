'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { addDays, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Video,
} from 'lucide-react';
import { Calendar as DateCalendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/alerts';
import { useAuth } from '@/hooks/use-auth';
import { doctorsApi, appointmentsApi } from '@/lib/api';
import type { DoctorPublicProfile } from '@/types/doctor';
import { getInitials } from '@/lib/utils/format';
import { LANDING_SHELL } from '@/components/marketing/landing-layout';
import { GlassPanel, SectionMesh } from '@/components/marketing/landing-visuals';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Slot = { startTime: string; endTime: string; available: boolean };

const STEPS = [
  { id: 1, label: 'Date' },
  { id: 2, label: 'Horaire' },
  { id: 3, label: 'Confirmation' },
] as const;

function photoUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

function formatMad(amount: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(
    amount,
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-0 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1 px-2 sm:px-4">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all',
                  done && 'bg-[#7EADD0] text-white',
                  active && !done && 'bg-[#B7A7FF]/90 text-white ring-4 ring-[#B7A7FF]/20',
                  !done && !active && 'border border-[#E8EAED] bg-white/80 text-[#999999]',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] font-bold uppercase tracking-[0.2em] sm:block',
                  active ? 'text-[#555555]' : 'text-[#999999]',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div className={cn('h-px w-6 sm:w-12', done ? 'bg-[#7EADD0]/60' : 'bg-[#E8EAED]')} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

const btnPrimary =
  'rounded-full border border-[#7EADD0]/40 bg-white/90 font-medium text-[#7EADD0] shadow-none hover:border-[#7EADD0] hover:bg-[#7EADD0]/10';
const btnOutline =
  'rounded-full border-[#E8EAED] bg-white/80 text-[#555555] shadow-none hover:border-[#7EADD0]/40 hover:bg-[#7EADD0]/5';

export function BookDoctorFlow({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [doctor, setDoctor] = useState<DoctorPublicProfile | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [photoFailed, setPhotoFailed] = useState(false);

  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(() => addDays(startOfDay(new Date()), 1));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [visitType, setVisitType] = useState<'in_person' | 'video'>(
    searchParams.get('type') === 'video' ? 'video' : 'in_person',
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setVisitType(searchParams.get('type') === 'video' ? 'video' : 'in_person');
  }, [searchParams]);

  useEffect(() => {
    if (!doctorId) return;
    setDoctorLoading(true);
    void doctorsApi
      .getPublicProfile(doctorId)
      .then((p) => {
        setDoctor(p);
        setPhotoFailed(false);
      })
      .catch(() => setDoctor(null))
      .finally(() => setDoctorLoading(false));
  }, [doctorId]);

  const ymd = useMemo(() => (date ? format(date, 'yyyy-MM-dd') : ''), [date]);

  const loadSlots = useCallback(async () => {
    if (!doctorId || !ymd) return;
    setSlotsLoading(true);
    setMsg(null);
    try {
      const res = (await doctorsApi.getAvailability(doctorId, ymd)) as {
        slots: Slot[];
        slotDurationMinutes?: number;
      };
      setSlots(res.slots ?? []);
      if (res.slotDurationMinutes) setSlotDuration(res.slotDurationMinutes);
    } catch {
      setSlots([]);
      setMsg('Impossible de charger les créneaux pour cette date.');
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, ymd]);

  useEffect(() => {
    if (date) void loadSlots();
  }, [date, loadSlots]);

  const availableSlots = useMemo(() => slots.filter((s) => s.available), [slots]);

  const pickDate = (d: Date) => {
    setDate(d);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleBook = async () => {
    const returnPath = `/book/${doctorId}${visitType === 'video' ? '?type=video' : ''}`;
    if (!user || user.role !== 'patient') {
      router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}&intent=patient`);
      return;
    }
    if (!selectedSlot || !ymd) return;
    setSaving(true);
    setMsg(null);
    try {
      await appointmentsApi.create({
        doctorId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim() || undefined,
        type: visitType,
        slotDate: ymd,
      });
      setStep(4);
    } catch {
      setMsg('Ce créneau n’est plus disponible. Choisissez un autre horaire.');
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  if (doctorLoading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-white via-white to-[#F8F8F6]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-white via-white to-[#F8F8F6] px-4">
        <GlassPanel tint="neutral" className="max-w-md p-10 text-center">
          <p className="text-lg font-medium text-[#555555]">Médecin introuvable</p>
          <Button className={cn('mt-6', btnPrimary)} asChild>
            <Link href="/search">Retour à l&apos;annuaire</Link>
          </Button>
        </GlassPanel>
      </div>
    );
  }

  const img = photoFailed ? undefined : photoUrl(doctor.profilePhotoUrl);
  const specialty = doctor.specialtyName ?? doctor.specialtyCode;
  const fullName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;

  if (step === 4) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-[#F8F8F6] px-4 py-16">
        <SectionMesh variant="mixed" className="opacity-80" />
        <div className="relative mx-auto max-w-lg">
          <GlassPanel tint="blue" className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-[#7EADD0]/25 via-[#B7A7FF]/15 to-white px-8 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#7EADD0]/30 bg-white/90 text-[#7EADD0] shadow-sm backdrop-blur-sm">
                <Check className="h-8 w-8" strokeWidth={2} />
              </div>
              <h1 className="mt-4 text-2xl font-medium tracking-[-0.02em] text-[#555555]">Demande envoyée</h1>
              <p className="mt-2 text-sm text-[#77777D]">Le cabinet confirmera votre rendez-vous sous peu.</p>
            </div>
            <div className="space-y-4 p-8 text-sm text-[#555555]">
              {selectedSlot && date ? (
                <div className="rounded-[20px] border border-[#E8EAED]/80 bg-white/60 p-4 backdrop-blur-sm">
                  <p className="font-medium text-[#555555]">{fullName}</p>
                  <p className="mt-1 capitalize text-[#77777D]">
                    {format(date, 'EEEE d MMMM yyyy', { locale: fr })} ·{' '}
                    {format(new Date(selectedSlot.startTime), 'HH:mm')} –{' '}
                    {format(new Date(selectedSlot.endTime), 'HH:mm')}
                  </p>
                  <p className="mt-1 text-[#999999]">
                    {visitType === 'video' ? 'Téléconsultation' : 'Au cabinet'} · {specialty}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className={cn('flex-1', btnPrimary)} asChild>
                  <Link href="/dashboard/patient/bookings">Mes rendez-vous</Link>
                </Button>
                <Button variant="outline" className={cn('flex-1', btnOutline)} asChild>
                  <Link href={`/doctor/${doctorId}`}>Fiche médecin</Link>
                </Button>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-[#F8F8F6] pb-20">
      <SectionMesh variant="mixed" className="opacity-80" />

      <div className={cn(LANDING_SHELL, 'relative pt-6 sm:pt-8')}>
        <nav className="mb-8 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#999999]">
          <Link
            href={`/doctor/${doctorId}`}
            className="inline-flex items-center gap-1 transition hover:text-[#7EADD0]"
          >
            <ChevronLeft className="h-4 w-4" />
            Dr. {doctor.user.lastName}
          </Link>
          <span className="text-[#E8EAED]">/</span>
          <span className="text-[#555555]">Réservation</span>
        </nav>

        <div className="mb-10">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.32em] text-[#7EADD0]">
            Prendre rendez-vous
          </p>
          <StepIndicator current={step} />
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-12">
          <div className="min-w-0">
            {msg ? (
              <div
                className="mb-4 rounded-[20px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950"
                role="alert"
              >
                {msg}
              </div>
            ) : null}

            {step === 1 ? (
              <GlassPanel tint="blue" className="p-6 sm:p-8">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">
                  Choisissez une date
                </h2>
                <p className="mt-2 text-sm text-[#77777D]">
                  Les créneaux affichés correspondent aux horaires du cabinet.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 7].map((offset) => {
                    const d = addDays(startOfDay(new Date()), offset);
                    const label =
                      offset === 0 ? "Aujourd'hui" : offset === 1 ? 'Demain' : format(d, 'EEE d MMM', { locale: fr });
                    const selected = date && format(date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                    return (
                      <button
                        key={offset}
                        type="button"
                        onClick={() => pickDate(d)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                          selected
                            ? 'border-[#7EADD0]/50 bg-[#7EADD0]/10 text-[#555555]'
                            : 'border-[#E8EAED] bg-white/70 text-[#77777D] hover:border-[#7EADD0]/35 hover:text-[#555555]',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center">
                  <DateCalendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && pickDate(d)}
                    locale={fr}
                    disabled={(d) => d < startOfDay(new Date())}
                    className="rounded-[20px] border border-[#E8EAED]/80 bg-white/60 p-2 backdrop-blur-sm"
                  />
                </div>
              </GlassPanel>
            ) : null}

            {step === 2 ? (
              <GlassPanel tint="blue" className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">
                      Choisissez un horaire
                    </h2>
                    <p className="mt-2 capitalize text-sm text-[#77777D]">
                      {date ? format(date, 'EEEE d MMMM yyyy', { locale: fr }) : ''} · {slotDuration} min / créneau
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full text-[#77777D] hover:bg-[#7EADD0]/10" onClick={() => setStep(1)}>
                    Changer la date
                  </Button>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-[#77777D]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#7EADD0]" />
                    Chargement des créneaux…
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-medium text-[#555555]">Aucun créneau libre ce jour-là.</p>
                    <Button variant="outline" className={cn('mt-4', btnOutline)} onClick={() => setStep(1)}>
                      Autre date
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {availableSlots.map((s) => {
                      const sel =
                        selectedSlot?.startTime === s.startTime && selectedSlot?.endTime === s.endTime;
                      return (
                        <button
                          key={s.startTime}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={cn(
                            'rounded-[14px] border py-3 text-sm font-medium tabular-nums transition',
                            sel
                              ? 'border-[#7EADD0] bg-[#7EADD0]/15 text-[#555555] shadow-sm'
                              : 'border-[#E8EAED] bg-white/70 text-[#555555] hover:border-[#7EADD0]/40 hover:bg-[#7EADD0]/5',
                          )}
                        >
                          {format(new Date(s.startTime), 'HH:mm')}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-8 flex gap-3">
                  <Button variant="outline" className={btnOutline} onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button className={cn('flex-1 sm:flex-none sm:px-8', btnPrimary)} disabled={!selectedSlot} onClick={() => setStep(3)}>
                    Continuer
                  </Button>
                </div>
              </GlassPanel>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <GlassPanel tint="neutral" className="p-6 sm:p-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">
                    Type de consultation
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setVisitType('in_person')}
                      className={cn(
                        'flex items-start gap-4 rounded-[20px] border p-4 text-left transition',
                        visitType === 'in_person'
                          ? 'border-[#7EADD0]/50 bg-[#7EADD0]/10 ring-1 ring-[#7EADD0]/20'
                          : 'border-[#E8EAED] bg-white/60 hover:border-[#7EADD0]/30',
                      )}
                    >
                      <Building2 className="h-6 w-6 shrink-0 text-[#7EADD0]" />
                      <div>
                        <p className="font-medium text-[#555555]">Au cabinet</p>
                        <p className="mt-1 text-xs text-[#77777D]">{doctor.city} — présentiel</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitType('video')}
                      className={cn(
                        'flex items-start gap-4 rounded-[20px] border p-4 text-left transition',
                        visitType === 'video'
                          ? 'border-[#B7A7FF]/50 bg-[#B7A7FF]/10 ring-1 ring-[#B7A7FF]/20'
                          : 'border-[#E8EAED] bg-white/60 hover:border-[#B7A7FF]/30',
                      )}
                    >
                      <Video className="h-6 w-6 shrink-0 text-[#B7A7FF]" />
                      <div>
                        <p className="font-medium text-[#555555]">Téléconsultation</p>
                        <p className="mt-1 text-xs text-[#77777D]">Lien vidéo après confirmation</p>
                      </div>
                    </button>
                  </div>
                </GlassPanel>

                <GlassPanel tint="neutral" className="p-6 sm:p-8">
                  <Label htmlFor="reason" className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">
                    Motif de consultation (optionnel)
                  </Label>
                  <textarea
                    id="reason"
                    placeholder="Ex. contrôle annuel, gêne visuelle, renouvellement ordonnance…"
                    className="mt-3 min-h-[100px] w-full resize-y rounded-[16px] border border-[#E8EAED] bg-white/70 px-4 py-3 text-sm text-[#555555] placeholder:text-[#999999] focus:border-[#7EADD0]/50 focus:outline-none focus:ring-2 focus:ring-[#7EADD0]/15"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </GlassPanel>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" className={btnOutline} onClick={() => setStep(2)}>
                    Retour
                  </Button>
                  <Button className={cn('flex-1 py-6 text-base', btnPrimary)} disabled={saving || authLoading} onClick={() => void handleBook()}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      'Confirmer la demande de RDV'
                    )}
                  </Button>
                </div>
                {!authLoading && (!user || user.role !== 'patient') ? (
                  <p className="text-center text-xs text-[#999999]">
                    Connexion patient requise — vous serez redirigé pour vous identifier.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Sidebar récap */}
          <aside className="lg:sticky lg:top-24">
            <GlassPanel tint="purple" className="overflow-hidden p-0">
              <div className="relative h-28">
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setPhotoFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F8F8F6] via-white to-[#F0F7FC]">
                    <span className="text-3xl font-light tracking-[0.15em] text-[#111111]/15">
                      {getInitials(doctor.user.firstName, doctor.user.lastName)}
                    </span>
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#555555]/50 via-transparent to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/75">{specialty}</p>
                  <p className="mt-0.5 text-sm font-medium leading-tight text-white">{fullName}</p>
                </div>
              </div>

              <div className="space-y-4 p-5 text-sm">
                <div className="flex items-start gap-2 text-[#77777D]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7EADD0]" />
                  <span>
                    {doctor.street}, {doctor.postalCode} {doctor.city}
                  </span>
                </div>
                <div className="rounded-[16px] border border-[#E8EAED]/80 bg-white/60 p-4 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#999999]">Tarif indicatif</p>
                  <p className="mt-1 text-xl font-medium tabular-nums text-[#7EADD0]">{formatMad(doctor.consultationPrice)}</p>
                </div>

                {(step >= 2 && date) || selectedSlot ? (
                  <div className="space-y-2 border-t border-[#E8EAED]/80 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#999999]">Votre choix</p>
                    {date ? (
                      <p className="flex items-center gap-2 font-medium capitalize text-[#555555]">
                        <Calendar className="h-4 w-4 text-[#7EADD0]" />
                        {format(date, 'EEE d MMM yyyy', { locale: fr })}
                      </p>
                    ) : null}
                    {selectedSlot ? (
                      <p className="flex items-center gap-2 font-medium text-[#555555]">
                        <Clock className="h-4 w-4 text-[#7EADD0]" />
                        {format(new Date(selectedSlot.startTime), 'HH:mm')} –{' '}
                        {format(new Date(selectedSlot.endTime), 'HH:mm')}
                      </p>
                    ) : (
                      <p className="text-[#999999]">Horaire à choisir</p>
                    )}
                    {step >= 3 ? (
                      <p className="text-[#77777D]">{visitType === 'video' ? 'Téléconsultation' : 'Présentiel'}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </GlassPanel>
          </aside>
        </div>
      </div>
    </div>
  );
}
