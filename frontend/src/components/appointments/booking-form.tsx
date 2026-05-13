'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Doctor } from '@/types';

interface BookingFormProps {
  doctor: Doctor;
  onSuccess?: () => void;
}

export function BookingForm({ doctor, onSuccess }: BookingFormProps) {
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const timeSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('time');
    setError('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
    setError('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // API call would go here
      // const response = await appointmentsApi.create({
      //   doctorId: doctor.id,
      //   appointmentDate: selectedDate,
      //   appointmentTime: selectedTime,
      // });

      // Simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Erreur lors de la prise de rendez-vous');
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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  if (step === 'date') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-6">1. Sélectionnez une date</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {getNextSevenDays().map((date) => (
            <button
              key={formatDate(date)}
              onClick={() => handleDateSelect(formatDate(date))}
              className="p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <p className="font-semibold text-sm">{formatDateDisplay(date).split(' ')[0]}</p>
              <p className="text-gray-600 text-sm">{date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'short' })}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'time') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <button
            onClick={() => setStep('date')}
            className="text-blue-600 hover:text-blue-800 font-semibold mb-4"
          >
            ← Changer la date
          </button>

          <h3 className="text-xl font-bold">2. Sélectionnez une heure</h3>
          <p className="text-gray-600">{selectedDate}</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => handleTimeSelect(time)}
              className="p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-semibold"
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <button
          onClick={() => setStep('time')}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-4"
        >
          ← Changer l'heure
        </button>

        <h3 className="text-xl font-bold">3. Confirmez votre rendez-vous</h3>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
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
          <span className="text-gray-600">Heure:</span>
          <span className="font-semibold">{selectedTime}</span>
        </div>
        <div className="border-t pt-4 flex justify-between">
          <span className="text-gray-600">Tarif:</span>
          <span className="font-bold text-lg">{doctor.consultationPrice} €</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">{error}</div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {isSubmitting ? 'Confirmation...' : 'Confirmer le rendez-vous'}
      </Button>
    </div>
  );
}
