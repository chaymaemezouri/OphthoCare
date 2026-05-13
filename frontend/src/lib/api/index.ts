import apiClient from './client';
import type { AuthTokens, User } from '@/types';

export const authApi = {
  register: async (email: string, password: string, role: string, firstName?: string, lastName?: string) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      role,
      firstName,
      lastName,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  logout: async () => {
    // Clear tokens
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },
};

export const usersApi = {
  getAll: async (skip = 0, take = 10) => {
    const response = await apiClient.get('/users', {
      params: { skip, take },
    });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export const doctorsApi = {
  search: async (filters: any) => {
    const response = await apiClient.get('/doctors/search', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  getAll: async (skip = 0, take = 10) => {
    const response = await apiClient.get('/doctors', {
      params: { skip, take },
    });
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/doctors', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/doctors/${id}`, data);
    return response.data;
  },

  getAvailability: async (doctorId: string, date: string) => {
    const response = await apiClient.get(`/doctors/${doctorId}/availability`, {
      params: { date },
    });
    return response.data;
  },
};

export const patientsApi = {
  getById: async (id: string) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/patients', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/patients/${id}`, data);
    return response.data;
  },

  getMedicalRecords: async (patientId: string) => {
    const response = await apiClient.get(`/patients/${patientId}/medical-records`);
    return response.data;
  },
};

export const appointmentsApi = {
  getAll: async (skip = 0, take = 10) => {
    const response = await apiClient.get('/appointments', {
      params: { skip, take },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  getByDoctor: async (doctorId: string) => {
    const response = await apiClient.get('/appointments', {
      params: { doctorId },
    });
    return response.data;
  },

  getByPatient: async (patientId: string) => {
    const response = await apiClient.get('/appointments', {
      params: { patientId },
    });
    return response.data;
  },
};

export const specialtiesApi = {
  getAll: async () => {
    const response = await apiClient.get('/specialties');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/specialties/${id}`);
    return response.data;
  },
};

export const consultationsApi = {
  getById: async (id: string) => {
    const response = await apiClient.get(`/consultations/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/consultations', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/consultations/${id}`, data);
    return response.data;
  },

  getByPatient: async (patientId: string) => {
    const response = await apiClient.get('/consultations', {
      params: { patientId },
    });
    return response.data;
  },

  getByDoctor: async (doctorId: string) => {
    const response = await apiClient.get('/consultations', {
      params: { doctorId },
    });
    return response.data;
  },
};
