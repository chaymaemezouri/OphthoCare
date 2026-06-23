import apiClient from './client';

export type DoctorMessage = {
  id: string;
  createdAt: string;
  patientId: string;
  patientName: string;
  subject: string;
  body: string;
  readAt: string | null;
};

export type MedicalReport = {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  consultationId: string | null;
  title: string;
  content: string;
  specialtyCode: string | null;
};

export type ReferralLetter = {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  consultationId: string | null;
  recipientName: string;
  recipientSpecialty: string | null;
  recipientAddress: string | null;
  body: string;
  status: 'draft' | 'sent';
};

export type PatientMedicalImage = {
  id: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  consultationId: string | null;
  examType: string | null;
  title: string | null;
  fileUrl: string;
  mimeType: string | null;
  notes: string | null;
  aiAnalysis: unknown;
};

export type DoctorWebhook = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastDeliveryAt: string | null;
  createdAt: string;
};

export type DoctorApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

const base = '/doctor-tools';

export const doctorToolsApi = {
  listMessages: async (patientId?: string) => {
    const res = await apiClient.get(`${base}/messages`, {
      params: patientId ? { patientId } : undefined,
    });
    return res.data as { items: DoctorMessage[] };
  },

  sendMessage: async (body: { patientId: string; subject: string; body: string }) => {
    const res = await apiClient.post(`${base}/messages`, body);
    return res.data as DoctorMessage;
  },

  listReports: async (patientId?: string) => {
    const res = await apiClient.get(`${base}/reports`, {
      params: patientId ? { patientId } : undefined,
    });
    return res.data as { items: MedicalReport[] };
  },

  createReport: async (body: {
    patientId: string;
    title: string;
    content: string;
    consultationId?: string;
    specialtyCode?: string;
  }) => {
    const res = await apiClient.post(`${base}/reports`, body);
    return res.data as MedicalReport;
  },

  updateReport: async (
    id: string,
    body: { title?: string; content?: string; specialtyCode?: string },
  ) => {
    const res = await apiClient.patch(`${base}/reports/${encodeURIComponent(id)}`, body);
    return res.data as MedicalReport;
  },

  listReferrals: async (patientId?: string) => {
    const res = await apiClient.get(`${base}/referral-letters`, {
      params: patientId ? { patientId } : undefined,
    });
    return res.data as { items: ReferralLetter[] };
  },

  createReferral: async (body: {
    patientId: string;
    recipientName: string;
    body: string;
    recipientSpecialty?: string;
    recipientAddress?: string;
    consultationId?: string;
  }) => {
    const res = await apiClient.post(`${base}/referral-letters`, body);
    return res.data as ReferralLetter;
  },

  sendReferral: async (id: string) => {
    const res = await apiClient.post(`${base}/referral-letters/${encodeURIComponent(id)}/send`);
    return res.data as ReferralLetter;
  },

  listMedicalImages: async (patientId: string) => {
    const res = await apiClient.get(`${base}/medical-images`, { params: { patientId } });
    return res.data as { items: PatientMedicalImage[] };
  },

  uploadMedicalImage: async (
    patientId: string,
    file: File,
    meta?: { examType?: string; title?: string; notes?: string; consultationId?: string },
  ) => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post(`${base}/medical-images`, form, {
      params: { patientId, ...meta },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as PatientMedicalImage;
  },

  analyzeMedicalImage: async (id: string) => {
    const res = await apiClient.post(`${base}/medical-images/${encodeURIComponent(id)}/analyze`);
    return res.data as PatientMedicalImage;
  },

  aiChat: async (body: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    patientId?: string;
    context?: string;
  }) => {
    const res = await apiClient.post(`${base}/ai/chat`, body);
    return res.data as { provider: string; reply: string; disclaimer: string | null };
  },

  listWebhooks: async () => {
    const res = await apiClient.get(`${base}/webhooks`);
    return res.data as { items: DoctorWebhook[] };
  },

  createWebhook: async (body: { url: string; events: string[]; secret?: string }) => {
    const res = await apiClient.post(`${base}/webhooks`, body);
    return res.data as DoctorWebhook & { secret: string };
  },

  deleteWebhook: async (id: string) => {
    const res = await apiClient.delete(`${base}/webhooks/${encodeURIComponent(id)}`);
    return res.data;
  },

  testWebhook: async (id: string) => {
    const res = await apiClient.post(`${base}/webhooks/${encodeURIComponent(id)}/test`);
    return res.data;
  },

  webhookLogs: async (id: string) => {
    const res = await apiClient.get(`${base}/webhooks/${encodeURIComponent(id)}/logs`);
    return res.data as {
      items: { id: string; createdAt: string; event: string; status: string; responseCode?: number }[];
    };
  },

  listApiKeys: async () => {
    const res = await apiClient.get(`${base}/api-keys`);
    return res.data as { items: DoctorApiKey[] };
  },

  createApiKey: async (label: string) => {
    const res = await apiClient.post(`${base}/api-keys`, { label });
    return res.data as DoctorApiKey & { apiKey: string };
  },

  revokeApiKey: async (id: string) => {
    const res = await apiClient.delete(`${base}/api-keys/${encodeURIComponent(id)}`);
    return res.data;
  },
};
