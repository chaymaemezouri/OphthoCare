export const APP_CONFIG = {
  APP_NAME: 'OphthoCare',
  APP_DESCRIPTION: 'Plateforme Médicale Universelle',
  APP_VERSION: '0.1.0',

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },

  // Specialties
  SPECIALTIES: {
    OPHTHALMOLOGY: 'ophthalmology',
    CARDIOLOGY: 'cardiology',
    DERMATOLOGY: 'dermatology',
    GENERAL: 'general-medicine',
  },

  // Roles
  ROLES: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    SECRETARY: 'secretary',
    TRAINEE: 'trainee',
  },

  // Appointment Types
  APPOINTMENT_TYPES: {
    IN_PERSON: 'in-person',
    VIDEO: 'video',
  },

  // Appointment Status
  APPOINTMENT_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
  },

  // UI
  UI: {
    SIDEBAR_WIDTH: 280,
    TOAST_DURATION: 3000,
  },
};
