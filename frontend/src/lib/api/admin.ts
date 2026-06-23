import apiClient from './client';

export type AdminPlatformStats = {
  doctors: { total: number; active: number; certified: number; suspended: number };
  patients: { total: number; newThisMonth: number };
  appointments: { total: number; thisWeek: number; thisMonth: number };
  registrations: { doctorsThisMonth: number; patientsThisMonth: number };
  consultations: { todayCount: number; totalCount: number };
  attendanceRatePercent: number | null;
  registrationTrend: { month: string; doctors: number; patients: number }[];
  systemHealth: {
    uptimePercent: number;
    queueJobs: { waiting: number; active: number; failed: number };
    sentryErrorRatePercent: number;
  };
};

export type AdminDoctorRow = {
  id: string;
  profilePhotoUrl: string | null;
  displayName: string;
  email?: string;
  specialtyCode: string;
  specialtyName: string;
  city: string;
  isCertified: boolean;
  isSuspended: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  appointmentCount: number;
  consultationCount: number;
};

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get<AdminPlatformStats>('/admin/stats');
    return res.data;
  },

  listDoctors: async (params?: {
    specialty?: string;
    city?: string;
    isCertified?: boolean;
    status?: 'active' | 'suspended' | 'all';
    skip?: number;
    take?: number;
  }) => {
    const res = await apiClient.get<{ total: number; items: AdminDoctorRow[] }>('/admin/doctors', {
      params,
    });
    return res.data;
  },

  getDoctorStats: async (id: string) => {
    const res = await apiClient.get(`/admin/doctors/${id}/stats`);
    return res.data as {
      doctorId: string;
      consultationCount: number;
      appointmentCount: number;
      averageRating: number;
      reviewCount: number;
    };
  },

  certifyDoctor: async (id: string) => {
    const res = await apiClient.patch(`/admin/doctors/${id}/certify`);
    return res.data;
  },

  suspendDoctor: async (id: string, reason: string) => {
    const res = await apiClient.patch(`/admin/doctors/${id}/suspend`, { reason });
    return res.data;
  },

  unsuspendDoctor: async (id: string) => {
    const res = await apiClient.patch(`/admin/doctors/${id}/unsuspend`);
    return res.data;
  },

  listSpecialties: async () => {
    const res = await apiClient.get('/admin/specialties');
    return res.data as Array<{
      id: string;
      code: string;
      name: string;
      icon: string | null;
      doctorCount: number;
      configuredFieldsCount: number;
    }>;
  },

  listAuditLogs: async (params?: {
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    take?: number;
  }) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data as {
      page: number;
      total: number;
      items: Array<{
        id: string;
        action: string;
        userEmail?: string;
        userDisplayName?: string;
        entityIdHash?: string;
        ip?: string;
        createdAt: string;
      }>;
    };
  },

  failedLogins: async () => {
    const res = await apiClient.get('/admin/security/failed-logins');
    return res.data as Array<{
      ip: string;
      emails: string[];
      count: number;
      lastAttemptAt: string;
    }>;
  },

  activeSessions: async () => {
    const res = await apiClient.get('/admin/security/sessions');
    return res.data as Array<{
      id: string;
      userEmail: string;
      userDisplayName: string;
      role: string;
      ip?: string;
      browser?: string;
      createdAt: string;
    }>;
  },

  revokeSession: async (sessionId: string) => {
    const res = await apiClient.delete(`/admin/security/sessions/${sessionId}`);
    return res.data;
  },

  pendingReviews: async (params?: {
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
    minRating?: number;
  }) => {
    const res = await apiClient.get('/admin/moderation/reviews', { params });
    return res.data as Array<{
      id: string;
      rating: number;
      comment: string;
      createdAt: string;
      patientLabel: string;
      doctor: { id: string; displayName: string; specialtyName: string };
    }>;
  },

  approveReview: async (id: string) => {
    const res = await apiClient.patch(`/admin/moderation/reviews/${id}/approve`);
    return res.data;
  },

  rejectReview: async (id: string, reason?: string) => {
    const res = await apiClient.patch(`/admin/moderation/reviews/${id}/reject`, { reason });
    return res.data;
  },
};
