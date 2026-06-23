'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import type { Doctor, UpdateDoctorMePayload } from '@/types';
import { doctorsApi } from '@/lib/api';

function formatDoctorProfileError(err: unknown): string {
  const ax = err as AxiosError<{ message?: string | string[] }>;
  const status = ax.response?.status;
  const raw = ax.response?.data?.message;
  const msg = Array.isArray(raw) ? raw.join(', ') : raw;
  if (status === 401) {
    return 'Session expirée — reconnectez-vous puis réessayez.';
  }
  if (status === 403) {
    return 'Accès refusé : ce compte n’est pas un profil médecin.';
  }
  if (status === 404) {
    return 'Profil médecin introuvable. Vérifiez que votre compte est bien enregistré comme médecin.';
  }
  if (typeof msg === 'string' && msg.trim()) return msg;
  return 'Impossible de charger le profil médecin (vérifiez que le serveur API tourne sur le port 3001).';
}

export function useDoctorProfile(enabled: boolean) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setDoctor(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await doctorsApi.getMe();
      setDoctor(d);
    } catch (e) {
      setError(formatDoctorProfileError(e));
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (payload: UpdateDoctorMePayload) => {
      const d = await doctorsApi.patchMe(payload);
      setDoctor(d);
      return d;
    },
    []
  );

  return { doctor, setDoctor, loading, error, reload: load, save };
}
