import apiClient from './client';
import type { AuthTokens, User } from '@/types';

import type {
  ClinicalRecordSummary,
  DoctorAuthoredClinicalListResponse,
  Patient,
  PatientMedicalTimeline,
  RegisterPatientProfilePayload,
  VitalsTimelineResponse,
} from '@/types/patient';
import type { ConsultationApiDetail } from '@/types/consultation';
import type {
  Doctor,
  UpdateDoctorMePayload,
  DoctorMyPatientListResponse,
  DoctorMeAppointmentRow,
  DoctorSiteDetail,
  DoctorTariffListRow,
  DoctorPublicProfile,
} from '@/types/doctor';
import type { DoctorAnalyticsPeriod, DoctorAnalyticsResponse } from '@/types/doctor-analytics';
import type {
  BillingPeriod,
  DoctorBillingResponse,
  PaymentMethod,
  PaymentStatus,
} from '@/types/doctor-billing';
import type {
  CreateDoctorStaffResponse,
  DoctorStaffListResponse,
  DoctorStaffRole,
} from '@/types/doctor-staff';
import type { DoctorSearchResponse, SearchFilters } from '@/types/search';

export type LoginApiResponse =
  | AuthTokens
  | { twoFactorRequired: true; pendingToken: string; message?: string };

export const authApi = {
  register: async (payload: {
    email: string;
    password: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    lang?: 'fr' | 'ar' | 'en';
    patientProfile?: RegisterPatientProfilePayload;
  }) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginApiResponse> => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  loginTwoFactor: async (pendingToken: string, twoFactorCode: string): Promise<AuthTokens> => {
    const response = await apiClient.post('/auth/login', {
      pendingToken,
      twoFactorCode,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/password/forgot', { email });
    return response.data as { message: string; resetToken?: string };
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/password/reset', { token, newPassword });
    return response.data as { message: string };
  },

  /** Profil utilisateur connecté (guide §2.1 — équivalent enrichi de GET /users/me côté auth). */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data as User;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  logout: async () => {
    const rt =
      typeof window !== 'undefined' ? sessionStorage.getItem('refresh_token') : null;
    try {
      await apiClient.post('/auth/logout', { refreshToken: rt ?? undefined });
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /** POST /auth/2fa/sms/send-setup — envoie un code SMS pour activer la 2FA. */
  sendSms2faSetup: async (): Promise<{ message?: string }> => {
    const response = await apiClient.post('/auth/2fa/sms/send-setup');
    return response.data as { message?: string };
  },

  /** POST /auth/2fa/sms/enable — active la 2FA SMS après vérification du code. */
  enableSms2fa: async (code: string): Promise<{ twoFactorSmsEnabled?: boolean }> => {
    const response = await apiClient.post('/auth/2fa/sms/enable', { code });
    return response.data as { twoFactorSmsEnabled?: boolean };
  },

  /** POST /auth/2fa/sms/disable — désactive la 2FA SMS. */
  disableSms2fa: async (): Promise<{ twoFactorSmsEnabled?: boolean }> => {
    const response = await apiClient.post('/auth/2fa/sms/disable');
    return response.data as { twoFactorSmsEnabled?: boolean };
  },
};

export const usersApi = {
  getAll: async (skip = 0, take = 10) => {
    const response = await apiClient.get('/users', {
      params: { skip, take },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  patchMe: async (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phoneNumber'>> & { password?: string }) => {
    const response = await apiClient.patch('/users/me', data);
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
  search: async (filters: SearchFilters): Promise<DoctorSearchResponse> => {
    const params: Record<string, string | number | boolean> = {};
    const code = filters.specialtyCode ?? filters.specialty;
    if (code) params.specialtyCode = code;
    if (filters.city?.trim()) params.city = filters.city.trim();
    if (filters.q?.trim()) params.q = filters.q.trim();
    if (filters.minRating != null && filters.minRating > 0) params.minRating = filters.minRating;
    if (filters.maxPrice != null && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
    if (filters.isVerified === true) params.isVerified = true;
    if (filters.isCertified === true) params.isCertified = true;
    if (filters.availableOn) params.availableOn = filters.availableOn;
    if (filters.skip != null) params.skip = filters.skip;
    if (filters.take != null) params.take = filters.take;

    const response = await apiClient.get<DoctorSearchResponse>('/doctors/search', { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        items: data as Doctor[],
        total: data.length,
        skip: filters.skip ?? 0,
        take: filters.take ?? (data as Doctor[]).length,
        usedElasticsearch: false,
      };
    }
    return data;
  },

  searchSpecialties: async (): Promise<{ code: string; name: string }[]> => {
    const response = await apiClient.get('/doctors/search/specialties');
    return response.data as { code: string; name: string }[];
  },

  searchCities: async (): Promise<string[]> => {
    const response = await apiClient.get('/doctors/search/cities');
    return response.data as string[];
  },

  getById: async (id: string): Promise<Doctor> => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  getAll: async (skip = 0, take = 10) => {
    const response = await apiClient.get('/doctors', {
      params: { skip, take },
    });
    return response.data;
  },

  getMe: async (): Promise<Doctor> => {
    const response = await apiClient.get('/doctors/me');
    return response.data;
  },

  patchMe: async (data: UpdateDoctorMePayload): Promise<Doctor> => {
    const response = await apiClient.patch('/doctors/me', data);
    return response.data;
  },

  uploadProfilePhoto: async (file: File): Promise<{ profilePhotoUrl: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/doctors/me/photo', form);
    return response.data;
  },

  uploadProfilePhotoPatch: async (file: File): Promise<{ profilePhotoUrl: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.patch('/doctors/me/photo', form);
    return response.data;
  },

  getPublicProfile: async (id: string): Promise<DoctorPublicProfile> => {
    const response = await apiClient.get(`/doctors/${id}/public-profile`);
    return response.data;
  },

  getMySites: async (): Promise<DoctorSiteDetail[]> => {
    const response = await apiClient.get('/doctors/me/sites');
    return response.data;
  },

  createMySite: async (data: {
    name: string;
    city: string;
    street?: string;
    address?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
    phone?: string;
    partnerTypes?: string[];
    isPrimary?: boolean;
    displayOrder?: number;
    workingHours?: Record<string, unknown>;
  }): Promise<DoctorSiteDetail> => {
    const response = await apiClient.post('/doctors/me/sites', data);
    return response.data;
  },

  patchMySite: async (
    siteId: string,
    data: Partial<{
      name: string;
      street: string;
      address: string;
      postalCode: string;
      city: string;
      country: string;
      lat: number;
      lng: number;
      phone: string;
      partnerTypes: string[];
      isPrimary: boolean;
      displayOrder: number;
    }>,
  ): Promise<DoctorSiteDetail> => {
    const response = await apiClient.patch(`/doctors/me/sites/${siteId}`, data);
    return response.data;
  },

  deleteMySite: async (siteId: string): Promise<{ id: string; deleted: boolean }> => {
    const response = await apiClient.delete(`/doctors/me/sites/${siteId}`);
    return response.data;
  },

  patchMySiteWorkingHours: async (
    siteId: string,
    hours: { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }[],
  ): Promise<DoctorSiteDetail> => {
    const response = await apiClient.patch(`/doctors/me/sites/${siteId}/working-hours`, { hours });
    return response.data;
  },

  getMyTariffs: async (siteId?: string): Promise<DoctorTariffListRow[]> => {
    const response = await apiClient.get('/doctors/me/tariffs', {
      params: siteId ? { siteId } : {},
    });
    return response.data;
  },

  createMyTariff: async (data: {
    doctorSiteId: string;
    actType: string;
    label: string;
    amount: number;
    currency?: string;
    durationMinutes?: number;
  }) => {
    const response = await apiClient.post('/doctors/me/tariffs', data);
    return response.data;
  },

  patchMyTariff: async (
    tariffId: string,
    data: Partial<{
      actType: string;
      label: string;
      amount: number;
      currency: string;
      durationMinutes: number;
    }>,
  ) => {
    const response = await apiClient.patch(`/doctors/me/tariffs/${tariffId}`, data);
    return response.data;
  },

  uploadSignature: async (file: File): Promise<{ hasSignature: boolean }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.patch('/doctors/me/signature', form);
    return response.data;
  },

  importIcsWorkingHours: async (icsText: string) => {
    const response = await apiClient.post('/doctors/me/calendar/ics', { icsText });
    return response.data;
  },

  getMyAppointments: async (
    from?: string,
    to?: string,
  ): Promise<DoctorMeAppointmentRow[]> => {
    const response = await apiClient.get('/doctors/me/appointments', {
      params: { from, to },
    });
    return response.data;
  },

  getMyAnalytics: async (period: DoctorAnalyticsPeriod = 'month'): Promise<DoctorAnalyticsResponse> => {
    const response = await apiClient.get('/doctors/me/analytics', { params: { period } });
    return response.data as DoctorAnalyticsResponse;
  },

  getMyBilling: async (
    period: BillingPeriod = 'month',
    status?: PaymentStatus | 'all',
  ): Promise<DoctorBillingResponse> => {
    const response = await apiClient.get('/doctors/me/billing', {
      params: { period, status: status && status !== 'all' ? status : undefined },
    });
    return response.data as DoctorBillingResponse;
  },

  createBillingReceipt: async (body: {
    consultationId: string;
    amount?: number;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
  }) => {
    const response = await apiClient.post('/doctors/me/billing/receipts', body);
    return response.data;
  },

  updateBillingReceipt: async (
    receiptId: string,
    body: {
      paymentStatus: PaymentStatus;
      paymentMethod?: PaymentMethod;
      paidAmount?: number;
    },
  ) => {
    const response = await apiClient.patch(
      `/doctors/me/billing/receipts/${encodeURIComponent(receiptId)}`,
      body,
    );
    return response.data;
  },

  listMyStaff: async (): Promise<DoctorStaffListResponse> => {
    const response = await apiClient.get('/doctors/me/staff');
    return response.data as DoctorStaffListResponse;
  },

  createStaffMember: async (body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role: DoctorStaffRole;
    lang?: 'fr' | 'ar' | 'en';
  }): Promise<CreateDoctorStaffResponse> => {
    const response = await apiClient.post('/doctors/me/staff', body);
    return response.data as CreateDoctorStaffResponse;
  },

  updateStaffMember: async (
    userId: string,
    body: {
      isActive?: boolean;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      password?: string;
    },
  ) => {
    const response = await apiClient.patch(`/doctors/me/staff/${encodeURIComponent(userId)}`, body);
    return response.data;
  },

  removeStaffMember: async (userId: string) => {
    const response = await apiClient.delete(`/doctors/me/staff/${encodeURIComponent(userId)}`);
    return response.data as { userId: string; removed: boolean };
  },

  getMyPatients: async (params?: { q?: string; skip?: number; take?: number }): Promise<DoctorMyPatientListResponse> => {
    const response = await apiClient.get('/doctors/me/patients', {
      params: {
        q: params?.q,
        skip: params?.skip,
        take: params?.take,
      },
    });
    return response.data;
  },

  create: async (data: unknown) => {
    const response = await apiClient.post('/doctors', data);
    return response.data;
  },

  update: async (id: string, data: unknown) => {
    const response = await apiClient.put(`/doctors/${id}`, data);
    return response.data;
  },

  getAvailability: async (doctorId: string, date: string) => {
    const response = await apiClient.get(`/doctors/${doctorId}/availability`, {
      params: { date },
    });
    return response.data;
  },

  /** GET /doctors/availability?doctorId=&date= (équivalent public). */
  getAvailabilityByQuery: async (doctorId: string, date: string) => {
    const response = await apiClient.get('/doctors/availability', {
      params: { doctorId, date },
    });
    return response.data;
  },

  getSiteAvailability: async (doctorId: string, siteId: string, date: string, duration?: number) => {
    const response = await apiClient.get(`/doctors/${doctorId}/sites/${siteId}/availability`, {
      params: { date, ...(duration != null ? { duration } : {}) },
    });
    return response.data;
  },

  getAvailabilityMulti: async (doctorIds: string[], date: string) => {
    const response = await apiClient.get('/doctors/availability-multi', {
      params: { date, doctorIds: doctorIds.join(',') },
    });
    return response.data;
  },

  listMyScheduleBlocks: async (from?: string, to?: string) => {
    const response = await apiClient.get('/doctors/me/schedule-blocks', {
      params: { from, to },
    });
    return response.data;
  },

  createScheduleBlock: async (body: {
    startTime: string;
    endTime: string;
    kind?: string;
    note?: string;
  }) => {
    const response = await apiClient.post('/doctors/me/schedule-blocks', body);
    return response.data;
  },

  deleteScheduleBlock: async (blockId: string) => {
    const response = await apiClient.delete(`/doctors/me/schedule-blocks/${blockId}`);
    return response.data;
  },

  fetchMyAppointmentsIcsText: async () => {
    const response = await apiClient.get('/doctors/me/appointments.ics', {
      responseType: 'text',
    });
    return response.data as string;
  },

  postCalendarSyncStub: async (provider?: string) => {
    const response = await apiClient.post('/doctors/me/calendar-sync', { provider });
    return response.data;
  },
};

export const patientsApi = {
  getMe: async () => {
    const response = await apiClient.get('/patients/me');
    return response.data;
  },

  updateMe: async (data: {
    dateOfBirth?: string;
    gender?: string;
    nationalId?: string;
    phone?: string;
    medicalData?: Record<string, unknown>;
    insuranceProvider?: string;
    insuranceNumber?: string;
    insuranceCoverage?: string;
    address?: string;
    bloodType?: string;
    allergies?: string[];
    antecedents?: string[];
    emergencyContact?: { name: string; relation: string; phone: string };
    cnssAffiliation?: string;
    amoRightsNumber?: string;
    mutuelleName?: string;
    mutuelleContractNumber?: string;
    coverageNotes?: string;
    diagnoses?: Array<{ code: string; label: string; notes?: string; recordedAt?: string }>;
    familyMembers?: Array<{ name: string; relationship: string; dateOfBirth?: string }>;
  }) => {
    const response = await apiClient.put('/patients/me', data);
    return response.data;
  },

  getMyMedicalTimeline: async (): Promise<PatientMedicalTimeline> => {
    const response = await apiClient.get('/patients/me/medical-records');
    return response.data;
  },

  getMyReceipts: async () => {
    const response = await apiClient.get('/patients/me/receipts');
    return response.data as {
      receiptId: string;
      consultationId: string;
      amount: number;
      currency: string;
      createdAt: string;
      closedAt: string | null;
      specialtyCode: string;
      doctorDisplayName: string;
    }[];
  },

  getMyDocumentItems: async () => {
    const response = await apiClient.get('/patients/me/document-items');
    return response.data as {
      items: (
        | {
            id: string;
            title: string;
            url: string;
            kind: string;
            sourceType: 'consultation' | 'medical_record';
            sourceId: string;
            specialtyCode?: string;
            createdAt: string;
          }
        | {
            id: string;
            title: string;
            kind: string;
            sourceType: 'prescription_ref';
            sourceId: string;
            specialtyCode?: string;
            createdAt: string;
            ref: string;
          }
      )[];
    };
  },

  getMyNotifications: async () => {
    const response = await apiClient.get('/patients/me/notifications');
    return response.data as {
      unreadCount: number;
      items: {
        id: string;
        createdAt: string;
        readAt: string | null;
        kind: string;
        title: string;
        body?: string;
        linkPath?: string;
        meta?: unknown;
      }[];
    };
  },

  markNotificationRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/patients/me/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await apiClient.post('/patients/me/notifications/read-all');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  getMedicalTimelineByPatientId: async (patientId: string): Promise<PatientMedicalTimeline> => {
    const response = await apiClient.get(`/patients/${patientId}/medical-records`);
    return response.data;
  },

  /** GET /patients/:id/history — même charge utile que medical-records. */
  getHistory: async (patientId: string): Promise<PatientMedicalTimeline> => {
    const response = await apiClient.get(`/patients/${patientId}/history`);
    return response.data;
  },

  postConsent: async (patientId: string, body: { type: string; signedAt: string }) => {
    const response = await apiClient.post(`/patients/${patientId}/consent`, body);
    return response.data;
  },

  postDiagnosis: async (
    patientId: string,
    body: { code: string; label: string; notes?: string; recordedAt?: string },
  ) => {
    const response = await apiClient.post(`/patients/${patientId}/diagnoses`, body);
    return response.data;
  },

  patchDossier: async (
    patientId: string,
    data: {
      medicalData?: Record<string, unknown>;
      diagnoses?: Array<{ code: string; label: string; notes?: string; recordedAt?: string }>;
      summary?: string;
    },
  ) => {
    const response = await apiClient.patch(`/patients/${patientId}/dossier`, data);
    return response.data;
  },

  patchMedical: async (
    patientId: string,
    data: {
      medicalData?: Record<string, unknown>;
      diagnoses?: Array<{ code: string; label: string; notes?: string; recordedAt?: string }>;
      summary?: string;
    },
  ) => {
    const response = await apiClient.patch(`/patients/${patientId}/medical`, data);
    return response.data;
  },

  list: async (params?: { q?: string; skip?: number; take?: number }) => {
    const response = await apiClient.get('/patients', {
      params: {
        q: params?.q,
        skip: params?.skip,
        take: params?.take,
      },
    });
    return response.data as {
      items: Patient[];
      total: number;
      skip: number;
      take: number;
    };
  },

  lookup: async (q: string, take = 20) => {
    const response = await apiClient.get('/patients/lookup', {
      params: { q, take },
    });
    return response.data as { id: string; email?: string; firstName?: string | null; lastName?: string | null }[];
  },

  patchById: async (id: string, data: unknown) => {
    const response = await apiClient.patch(`/patients/${id}`, data);
    return response.data;
  },

  deleteById: async (id: string) => {
    const response = await apiClient.delete(`/patients/${id}`);
    return response.data;
  },
};

export const appointmentsApi = {
  getSlots: async (params: { doctorId: string; siteId: string; date: string; duration?: number }) => {
    const response = await apiClient.get('/appointments/slots', { params });
    return response.data;
  },

  getMine: async () => {
    const response = await apiClient.get('/appointments/me');
    return response.data;
  },

  getPatientMe: async () => {
    const response = await apiClient.get('/appointments/patient/me');
    return response.data;
  },

  list: async (params?: { from?: string; to?: string; status?: string }) => {
    const response = await apiClient.get('/appointments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: unknown) => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  update: async (id: string, data: unknown) => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  cancelWithReason: async (id: string, body?: { cancelReason?: string }) => {
    const response = await apiClient.patch(`/appointments/${id}/cancel`, body ?? {});
    return response.data;
  },

  getPatientPreConsultation: async (appointmentId: string) => {
    const response = await apiClient.get(`/appointments/patient/${appointmentId}/pre-consultation`);
    return response.data as {
      appointmentId: string;
      specialtyCode: string;
      doctorSpaceId: string | null;
      editable: boolean;
      form: {
        id: string;
        responses: Record<string, unknown>;
        specialtyCode?: string;
        updatedAt: string;
      } | null;
    };
  },

  putPatientPreConsultation: async (appointmentId: string, body: { responses: Record<string, unknown> }) => {
    const response = await apiClient.put(`/appointments/patient/${appointmentId}/pre-consultation`, body);
    return response.data as {
      form: { id: string; responses: Record<string, unknown>; specialtyCode?: string; updatedAt: string };
    };
  },

  reschedulePatient: async (
    appointmentId: string,
    body: { startTime: string; endTime: string; siteId?: string; slotDate?: string },
  ) => {
    const response = await apiClient.put(`/appointments/patient/${appointmentId}/reschedule`, body);
    return response.data;
  },

  confirm: async (id: string) => {
    const response = await apiClient.patch(`/appointments/${id}/confirm`);
    return response.data;
  },

  markNoShow: async (id: string) => {
    const response = await apiClient.patch(`/appointments/${id}/no-show`);
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await apiClient.patch(`/appointments/${id}/check-in`);
    return response.data;
  },

  sendPreConsultationLink: async (appointmentId: string) => {
    const response = await apiClient.post(
      `/appointments/doctor/${encodeURIComponent(appointmentId)}/send-pre-consultation-link`,
    );
    return response.data as {
      appointmentId: string;
      preConsultationFormId: string;
      linkPath: string;
      sent: boolean;
    };
  },

  startConsult: async (id: string) => {
    const response = await apiClient.patch(`/appointments/${id}/start`);
    return response.data;
  },

  completeConsult: async (id: string) => {
    const response = await apiClient.patch(`/appointments/${id}/complete`);
    return response.data;
  },

  getAll: async (skip = 0, take = 10) => {
    const response = await apiClient.get('/appointments', {
      params: { skip, take },
    });
    return response.data;
  },

  doctorCreate: async (data: {
    patientId: string;
    startTime: string;
    endTime: string;
    reason?: string;
    type?: 'in_person' | 'video';
  }) => {
    const body = {
      ...data,
      type: data.type === 'video' ? 'video' : 'in_person',
    };
    const response = await apiClient.post('/appointments/doctor', body);
    return response.data;
  },

  doctorPatch: async (
    id: string,
    data: {
      startTime?: string;
      endTime?: string;
      status?: string;
      type?: 'in_person' | 'video';
      notes?: string;
      reason?: string;
    },
  ) => {
    const body = {
      ...data,
      type: data.type === 'video' ? 'video' : data.type === 'in_person' ? 'in_person' : undefined,
    };
    const response = await apiClient.patch(`/appointments/doctor/${id}`, body);
    return response.data;
  },

  doctorMerge: async (keepId: string, removeId: string) => {
    const response = await apiClient.post('/appointments/doctor/merge', { keepId, removeId });
    return response.data;
  },

  doctorSplit: async (id: string, splitAt: string) => {
    const response = await apiClient.post(`/appointments/doctor/${id}/split`, { splitAt });
    return response.data;
  },

  doctorRemind: async (id: string) => {
    const response = await apiClient.post(`/appointments/doctor/${id}/remind`);
    return response.data;
  },

  getByDoctor: async (doctorId: string) => {
    const response = await apiClient.get('/appointments', {
      params: { doctorId },
    });
    return response.data;
  },

  /** @deprecated Utiliser getMine pour l’espace patient. */
  getByPatient: async (patientId: string) => {
    const response = await apiClient.get('/appointments', {
      params: { patientId },
    });
    return response.data;
  },
};

export const clinicalRecordsApi = {
  listMine: async (params?: {
    q?: string;
    skip?: number;
    take?: number;
  }): Promise<DoctorAuthoredClinicalListResponse> => {
    const response = await apiClient.get('/clinical-records/mine', {
      params: {
        q: params?.q,
        skip: params?.skip,
        take: params?.take,
      },
    });
    return response.data;
  },

  listForPatient: async (patientId: string) => {
    const response = await apiClient.get(`/clinical-records/for-patient/${patientId}`);
    return response.data as ClinicalRecordSummary[];
  },

  getTemplate: async (specialtyCode: string) => {
    const response = await apiClient.get(`/clinical-records/templates/${encodeURIComponent(specialtyCode)}`);
    return response.data as {
      specialtyCode: string;
      specialtyName?: string;
      template: unknown;
      specialtyOverrides: Record<string, unknown> | null;
    };
  },

  create: async (body: {
    patientId: string;
    appointmentId?: string;
    specialtyCode?: string;
    title?: string;
    narrative?: string;
    structuredData: Record<string, unknown>;
  }) => {
    const response = await apiClient.post('/clinical-records', body);
    return response.data;
  },

  update: async (
    id: string,
    body: {
      title?: string;
      narrative?: string;
      structuredData?: Record<string, unknown>;
      changeSummary?: string;
    },
  ) => {
    const response = await apiClient.patch(`/clinical-records/${id}`, body);
    return response.data;
  },

  getVersions: async (id: string) => {
    const response = await apiClient.get(`/clinical-records/${id}/versions`);
    return response.data as Array<{
      id: string;
      createdAt: string;
      snapshot: unknown;
      changeSummary?: string;
      editedBy: { displayName: string; email: string };
    }>;
  },

  importDossier: async (
    patientId: string,
    body: {
      medicalData?: Record<string, unknown>;
      diagnoses?: Array<{ code: string; label: string; notes?: string; recordedAt?: string }>;
      summary?: string;
      createClinicalTrace?: boolean;
    },
  ) => {
    const response = await apiClient.post(`/clinical-records/import/${patientId}`, body);
    return response.data as { imported: boolean; patientId?: string; message?: string };
  },
};

export type SpecialtyAdminRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  examTypes: string[];
  specificFields: unknown;
};

/** Liste catalogue (GET /specialties) — alignée sur le modèle Prisma. */
export type SpecialtyCatalogRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  examTypes: string[];
  specificFields: unknown;
  createdAt: string;
  updatedAt: string;
};

export const specialtiesApi = {
  getAll: async () => {
    const response = await apiClient.get('/specialties');
    return response.data as SpecialtyCatalogRow[];
  },

  getByCode: async (code: string) => {
    const response = await apiClient.get(`/specialties/${encodeURIComponent(code)}`);
    return response.data as SpecialtyAdminRow;
  },

  getTemplate: async (code: string) => {
    const response = await apiClient.get(`/specialties/${encodeURIComponent(code)}/template`);
    return response.data as { code: string; name: string | null; examTypes: string[]; fields: unknown[] };
  },

  createAdmin: async (body: {
    code: string;
    name: string;
    description?: string;
    icon?: string;
    examTypes: string[];
    specificFields: unknown[];
  }) => {
    const response = await apiClient.post('/specialties', body);
    return response.data as SpecialtyAdminRow;
  },

  patchAdmin: async (
    id: string,
    body: Partial<{
      name: string;
      description: string;
      icon: string;
      examTypes: string[];
      specificFields: unknown[];
    }>,
  ) => {
    const response = await apiClient.patch(`/specialties/${id}`, body);
    return response.data as SpecialtyAdminRow;
  },
};

export const consultationsApi = {
  listMinePatient: async (params?: { status?: string; from?: string; to?: string }) => {
    const response = await apiClient.get('/consultations/patient/mine', { params });
    return response.data as {
      id: string;
      createdAt: string;
      updatedAt: string;
      status: string;
      specialtyCode: string;
      closedAt: string | null;
      startAt: string | null;
      doctor: { id: string; displayName: string };
      appointment: { id: string; startTime: string } | null;
      receipt: {
        id: string;
        amount: number;
        currency: string;
        createdAt: string;
      } | null;
    }[];
  },

  getById: async (id: string): Promise<ConsultationApiDetail> => {
    const response = await apiClient.get(`/consultations/${id}`);
    return response.data;
  },

  getVitalsTimeline: async (patientId: string): Promise<VitalsTimelineResponse> => {
    const response = await apiClient.get('/consultations/vitals-timeline', {
      params: { patientId },
    });
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/consultations', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/consultations/${id}`, data);
    return response.data as ConsultationApiDetail;
  },

  start: async (id: string): Promise<ConsultationApiDetail> => {
    const response = await apiClient.post(`/consultations/${encodeURIComponent(id)}/start`);
    return response.data;
  },

  close: async (id: string): Promise<ConsultationApiDetail> => {
    const response = await apiClient.post(`/consultations/${encodeURIComponent(id)}/close`);
    return response.data;
  },

  importPreConsultation: async (id: string, preFormId: string): Promise<ConsultationApiDetail> => {
    const response = await apiClient.post(
      `/consultations/${encodeURIComponent(id)}/import-pre-consultation`,
      { preFormId },
    );
    return response.data;
  },

  compareConsultations: async (id1: string, id2: string) => {
    const response = await apiClient.get('/consultations/compare', {
      params: { id1, id2 },
    });
    return response.data as {
      consultationA: { id: string; createdAt: string; closedAt?: string | null; specialtyCode: string };
      consultationB: { id: string; createdAt: string; closedAt?: string | null; specialtyCode: string };
      diff: Record<string, { from: unknown; to: unknown }>;
    };
  },

  /** GET /consultations/by-patient/:patientId — consultations du patient dans l’espace cabinet. */
  listMinePrescriptions: async (params?: { skip?: number; take?: number; q?: string }) => {
    const response = await apiClient.get("/consultations/mine/prescriptions", { params });
    return response.data as {
      items: Array<{
        id: string;
        createdAt: string;
        updatedAt: string;
        status: string;
        specialtyCode: string;
        closedAt: string | null;
        plan: string | null;
        prescriptionIds: string[];
        patientId: string;
        patientDisplayName: string;
        patientDateOfBirth: string | null;
        doctorName: string;
        appointment: { id: string; startTime: string } | null;
      }>;
      total: number;
      stats: { monthTotal: number; draftCount: number };
    };
  },

  sharePrescriptionWithPatient: async (consultationId: string) => {
    const response = await apiClient.post(
      `/consultations/${encodeURIComponent(consultationId)}/share-prescription`,
    );
    return response.data as { sent: boolean; consultationId: string };
  },

  getByPatient: async (patientId: string) => {
    const response = await apiClient.get(`/consultations/by-patient/${encodeURIComponent(patientId)}`);
    return response.data as Array<{
      id: string;
      createdAt: string;
      updatedAt: string;
      status: string;
      specialtyCode: string;
      closedAt: string | null;
      startAt: string | null;
      plan: string | null;
      prescriptionIds: string[];
      doctorName: string;
      appointment: { id: string; startTime: string } | null;
    }>;
  },

  getByDoctor: async (doctorId: string) => {
    const response = await apiClient.get('/consultations', {
      params: { doctorId },
    });
    return response.data;
  },
};

export { doctorToolsApi } from './doctor-tools';
export { traineeLearningApi } from './trainee-learning';
export { adminApi } from './admin';
export type { AdminPlatformStats, AdminDoctorRow } from './admin';
