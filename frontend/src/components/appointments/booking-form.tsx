'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Doctor } from '@/types';
import { appointmentsApi } from '@/lib/api';

interface BookingFormProps {
  doctor: Doctor;
  onSuccess?: () => void;
}

function resolveSiteId(d: Doctor): string | undefined {
  const s = d.sites?.find((x) => x.isPrimary) ?? d.sites?.[0];
  if (s?.id) return s.id;
  const p = d.practiceSites?.find((x) => x.isPrimary) ?? d.practiceSites?.[0];
  return p?.id;
}

type Slot = { startTime: string; endTime: string };

export function BookingForm({ doctor, onSuccess }: BookingFormProps) {
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const siteId = useMemo(() => resolveSiteId(doctor), [doctor]);
  const duration = doctor.slotDurationMinutes ?? 30;

  const loadSlots = useCallback(async () => {
    if (!selectedDate || !siteId) return;
    setSlotsLoading(true);
    setError('');
    try {
      const data = (await appointmentsApi.getSlots({
        doctorId: doctor.id,
        siteId,
        date: selectedDate,
        duration,
      })) as { slots?: Slot[] };
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
    } catch {
      setSlots([]);
      setError('Impossible de charger les créneaux pour cette date.');
    } finally {
      setSlotsLoading(false);
    }
  }, [doctor.id, siteId, selectedDate, duration]);

  useEffect(() => {
    if (step === 'time' && selectedDate && siteId) void loadSlots();
  }, [step, selectedDate, siteId, loadSlots]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('time');
    setError('');
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep('confirm');
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !siteId) return;
    setIsSubmitting(true);
    setError('');
    try {
      await appointmentsApi.create({
        doctorId: doctor.id,
        siteId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        slotDate: selectedDate,
      });
      onSuccess?.();
    } catch {
      setError('Erreur lors de la prise de rendez-vous (créneau peut-être pris entre-temps).');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

  const formatTimeLabel = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!siteId) {
    return (
      <div className="rounded-lg bg-amber-50 p-6 text-sm text-amber-900 shadow">
        Ce praticien n’a pas encore de cabinet en ligne configuré pour la réservation. Contactez le cabinet.
      </div>
    );
  }

  if (step === 'date') {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-6 text-xl font-bold">1. Sélectionnez une date</h3>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {getNextSevenDays().map((date) => (
            <button
              key={formatDate(date)}
              type="button"
              onClick={() => handleDateSelect(formatDate(date))}
              className="rounded-lg border-2 border-gray-300 p-3 transition hover:border-blue-500 hover:bg-blue-50"
            >
              <p className="text-sm font-semibold">{formatDateDisplay(date).split(' ')[0]}</p>
              <p className="text-sm text-gray-600">
                {date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'short' })}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'time') {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setStep('date')}
            className="mb-4 font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Changer la date
          </button>

          <h3 className="text-xl font-bold">2. Sélectionnez un créneau</h3>
          <p className="text-gray-600">{selectedDate}</p>
        </div>

        {slotsLoading ? (
          <p className="text-sm text-gray-500">Chargement des disponibilités…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-600">Aucun créneau libre ce jour-là.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                onClick={() => handleSlotSelect(slot)}
                className="rounded-lg border-2 border-gray-300 p-3 font-semibold transition hover:border-blue-500 hover:bg-blue-50"
              >
                {formatTimeLabel(slot.startTime)} – {formatTimeLabel(slot.endTime)}
              </button>
            ))}
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setStep('time')}
          className="mb-4 font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Changer le créneau
        </button>

        <h3 className="text-xl font-bold">3. Confirmez votre rendez-vous</h3>
      </div>

      <div className="mb-6 space-y-4 rounded-lg bg-gray-50 p-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Médecin:</span>
          <span className="font-semibold">
            Dr. {doctor.user.firstName} {doctor.user.lastName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Spécialité:</span>
          <span className="font-semibold">{doctor.specialtyCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span className="font-semibold">{selectedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Créneau:</span>
          <span className="font-semibold">
            {selectedSlot
              ? `${formatTimeLabel(selectedSlot.startTime)} – ${formatTimeLabel(selectedSlot.endTime)}`
              : '—'}
          </span>
        </div>
        <div className="flex justify-between border-t pt-4">
          <span className="text-gray-600">Tarif indicatif:</span>
          <span className="text-lg font-bold">{doctor.consultationPrice} MAD</span>
        </div>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">{error}</div> : null}

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isSubmitting || !selectedSlot}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {isSubmitting ? 'Confirmation...' : 'Confirmer le rendez-vous'}
      </Button>
    </div>
  );
}
