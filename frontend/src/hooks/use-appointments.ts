'use client';

import { useCallback } from 'react';
import { useAppointmentStore } from '@/store/appointment-store';
import { appointmentsApi } from '@/lib/api';
import type { Appointment, CreateAppointmentDto } from '@/types';

export const useAppointments = () => {
  const {
    appointments,
    selectedAppointment,
    isLoading,
    setAppointments,
    setSelectedAppointment,
    setLoading,
    addAppointment,
    updateAppointment,
    removeAppointment,
  } = useAppointmentStore();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await appointmentsApi.getAll();
      setAppointments(response.data || []);
    } finally {
      setLoading(false);
    }
  }, [setAppointments, setLoading]);

  const createAppointment = useCallback(
    async (data: CreateAppointmentDto) => {
      setLoading(true);
      try {
        const response = await appointmentsApi.create(data);
        addAppointment(response);
        return response;
      } finally {
        setLoading(false);
      }
    },
    [addAppointment, setLoading]
  );

  const cancelAppointment = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        await appointmentsApi.cancel(id);
        removeAppointment(id);
      } finally {
        setLoading(false);
      }
    },
    [removeAppointment, setLoading]
  );

  const rescheduleAppointment = useCallback(
    async (id: string, newStartTime: string, newEndTime: string) => {
      setLoading(true);
      try {
        const response = await appointmentsApi.update(id, {
          startTime: newStartTime,
          endTime: newEndTime,
        });
        updateAppointment(id, response);
      } finally {
        setLoading(false);
      }
    },
    [updateAppointment, setLoading]
  );

  return {
    appointments,
    selectedAppointment,
    isLoading,
    fetchAppointments,
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    setSelectedAppointment,
  };
};
