export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  // Users
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // Doctors
  DOCTORS: {
    LIST: '/doctors',
    SEARCH: '/doctors/search',
    GET: (id: string) => `/doctors/${id}`,
    CREATE: '/doctors',
    UPDATE: (id: string) => `/doctors/${id}`,
    AVAILABILITY: (id: string) => `/doctors/${id}/availability`,
  },

  // Patients
  PATIENTS: {
    GET: (id: string) => `/patients/${id}`,
    CREATE: '/patients',
    UPDATE: (id: string) => `/patients/${id}`,
    MEDICAL_RECORDS: (id: string) => `/patients/${id}/medical-records`,
  },

  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments',
    GET: (id: string) => `/appointments/${id}`,
    CREATE: '/appointments',
    UPDATE: (id: string) => `/appointments/${id}`,
    CANCEL: (id: string) => `/appointments/${id}`,
    BY_DOCTOR: '/appointments?doctorId',
    BY_PATIENT: '/appointments?patientId',
  },

  // Specialties
  SPECIALTIES: {
    LIST: '/specialties',
    GET: (id: string) => `/specialties/${id}`,
  },

  // Consultations
  CONSULTATIONS: {
    GET: (id: string) => `/consultations/${id}`,
    CREATE: '/consultations',
    UPDATE: (id: string) => `/consultations/${id}`,
    BY_PATIENT: '/consultations?patientId',
    BY_DOCTOR: '/consultations?doctorId',
  },
};
