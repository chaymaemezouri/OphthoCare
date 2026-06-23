'use client';

import { useCallback, useState } from 'react';
import { doctorsApi } from '@/lib/api';
import type { Doctor } from '@/types';

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async (skip = 0, take = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await doctorsApi.getAll(skip, take);
      const list = Array.isArray(response) ? response : (response as { data?: Doctor[] })?.data;
      setDoctors(list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDoctorById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await doctorsApi.getById(id);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAvailability = useCallback(async (doctorId: string, date: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await doctorsApi.getAvailability(doctorId, date);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    doctors,
    isLoading,
    error,
    fetchDoctors,
    fetchDoctorById,
    getAvailability,
  };
};
