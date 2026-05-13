'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppointmentItem, AppointmentSkeleton } from '@/components/appointments/appointment-item';
import { EmptyState } from '@/components/common/alerts';
import { useState, useEffect } from 'react';
import type { Appointment } from '@/types';

export default function BookingsPage() {
  const { user, requireAuth, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  requireAuth();

  useEffect(() => {
    // Simulate loading appointments
    const timer = setTimeout(() => {
      setAppointments([
        {
          id: '1',
          doctorId: 'doc1',
          patientId: user?.id || '',
          startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          type: 'in-person',
          reason: 'Consultation de routine',
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          doctor: {
            id: 'doc1',
            userId: 'user1',
            specialtyCode: 'ophthalmology',
            rating: 4.8,
            reviewCount: 150,
            consultationPrice: 200,
            city: 'Casablanca',
            address: 'Rue Mohamed V',
            workingHours: {},
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
              id: 'user1',
              email: 'doctor@example.com',
              firstName: 'Marie',
              lastName: 'Dupont',
              role: 'doctor',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Mes Rendez-vous</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Mes Rendez-vous</h1>

      {appointments.length === 0 ? (
        <EmptyState message="Aucun rendez-vous trouvé. Recherchez un médecin pour en prendre un." />
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentItem
              key={appointment.id}
              appointment={appointment}
              onCancel={(id) => {
                setAppointments(appointments.filter((a) => a.id !== id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
