export const ROUTES = {
  // Public routes
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    SEARCH: '/search',
    DOCTOR_PROFILE: (id: string) => `/doctor/${id}`,
  },

  // Protected routes - Patient
  DASHBOARD: {
    PATIENT_HOME: '/dashboard/patient',
    PATIENT_BOOKINGS: '/dashboard/patient/bookings',
    PATIENT_MEDICAL_RECORDS: '/dashboard/patient/medical-records',
  },

  // Protected routes - Doctor
  DOCTOR: {
    HOME: (id: string) => `/dashboard/doctor/${id}`,
    CALENDAR: (id: string) => `/dashboard/doctor/${id}/calendar`,
    PATIENTS: (id: string) => `/dashboard/doctor/${id}/patients`,
    CONSULTATIONS: (id: string) => `/dashboard/doctor/${id}/consultations`,
    PRESCRIPTIONS: (id: string) => `/dashboard/doctor/${id}/prescriptions`,
  },

  // API routes
  API: {
    AUTH: '/api/auth',
  },
};
