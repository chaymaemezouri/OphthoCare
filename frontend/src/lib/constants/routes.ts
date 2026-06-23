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

  // Protected routes - Doctor (UI cabinet en français)
  DOCTOR: {
    HOME: () => `/dashboard/medecin`,
    AGENDA: () => `/dashboard/medecin/agenda`,
    PATIENTS: () => `/dashboard/medecin/patients`,
    CONSULTATIONS: () => `/dashboard/medecin/consultations`,
    PRESCRIPTIONS: () => `/dashboard/medecin/ordonnances`,
  },

  // API routes
  API: {
    AUTH: '/api/auth',
  },
};
