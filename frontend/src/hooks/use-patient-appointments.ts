'use client';

import { useCallback, useEffect, useState } from 'react';
import { appointmentsApi } from '@/lib/api';
import type { Appointment } from '@/types';

function normalizeAppointmentList(data: unknown): Appointment[] {
  if (Array.isArray(data)) return data as Appointment[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as Appointment[];
    if (Array.isArray(o.items)) return o.items as Appointment[];
  }
  return [];
}

export function usePatientAppointments(userId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setAppointments([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await appointmentsApi.getMine();
      setAppointments(normalizeAppointmentList(raw));
    } catch {
      setError('Impossible de charger vos rendez-vous.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { appointments, setAppointments, loading, error, reload };
}
