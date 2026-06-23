import apiClient from './client';

export type MedicationSearchRow = {
  id: string;
  name: string;
  genericName: string | null;
  form: string | null;
  dosages: string[];
};

export type PrescriptionDoc = {
  id: string;
  createdAt: string;
  patientId: string;
  consultationId: string | null;
  type: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  pdfUrl: string | null;
  pdfStatus: string;
  verificationUuid: string;
};

export type PaymentReceiptDoc = {
  id: string;
  createdAt: string;
  patientId: string;
  sequentialNumber: string;
  actType: string;
  actLabel: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  pdfUrl: string | null;
  pdfStatus: string;
};

export type ReportDoc = {
  id: string;
  createdAt: string;
  patientId: string;
  title: string;
  content: string;
  reportType: string;
  pdfUrl: string | null;
  pdfStatus: string;
  shareToken: string | null;
  sharedAt: string | null;
};

export type DocumentListItem = {
  id: string;
  kind: 'prescription' | 'report' | 'receipt';
  title: string;
  patientId: string;
  createdAt: string;
  pdfUrl: string | null;
  pdfStatus: string;
};

export const documentsApi = {
  searchMedications: async (q: string) => {
    const res = await apiClient.get('/documents/medications/search', { params: { q } });
    return res.data as MedicationSearchRow[];
  },

  createPrescription: async (body: {
    patientId: string;
    consultationId?: string;
    type?: string;
    medications: PrescriptionDoc['medications'];
  }) => {
    const res = await apiClient.post('/prescriptions', body);
    return res.data as PrescriptionDoc;
  },

  getPrescription: async (id: string) => {
    const res = await apiClient.get(`/prescriptions/${encodeURIComponent(id)}`);
    return res.data as PrescriptionDoc;
  },

  listPrescriptionsPatient: async (patientId: string) => {
    const res = await apiClient.get(`/prescriptions/patient/${encodeURIComponent(patientId)}`);
    return res.data as PrescriptionDoc[];
  },

  sendPrescription: async (id: string) => {
    const res = await apiClient.post(`/prescriptions/${encodeURIComponent(id)}/send`);
    return res.data as { sent: boolean; pdfUrl: string | null };
  },

  createReceipt: async (body: {
    patientId: string;
    consultationId?: string;
    actType: string;
    actLabel: string;
    amount: number;
    currency?: string;
    status?: string;
    paymentMethod?: string;
  }) => {
    const res = await apiClient.post('/receipts', body);
    return res.data as PaymentReceiptDoc;
  },

  patchReceipt: async (id: string, body: { status?: string; paymentMethod?: string }) => {
    const res = await apiClient.patch(`/receipts/${encodeURIComponent(id)}`, body);
    return res.data as PaymentReceiptDoc;
  },

  listReceiptsPatient: async (patientId: string) => {
    const res = await apiClient.get(`/receipts/patient/${encodeURIComponent(patientId)}`);
    return res.data as PaymentReceiptDoc[];
  },

  receiptDayTotals: async () => {
    const res = await apiClient.get('/receipts/totals/today');
    return res.data as { billed: number; paid: number; pending: number; currency: string; count: number };
  },

  getReport: async (id: string) => {
    const res = await apiClient.get(`/reports/${encodeURIComponent(id)}`);
    return res.data as ReportDoc;
  },

  createReport: async (body: {
    patientId: string;
    consultationId?: string;
    title: string;
    content: string;
    reportType?: string;
  }) => {
    const res = await apiClient.post('/reports', body);
    return res.data as ReportDoc;
  },

  patchReport: async (id: string, body: { title?: string; content?: string; reportType?: string }) => {
    const res = await apiClient.patch(`/reports/${encodeURIComponent(id)}`, body);
    return res.data as ReportDoc;
  },

  shareReport: async (id: string) => {
    const res = await apiClient.post(`/reports/${encodeURIComponent(id)}/share`);
    return res.data as { shareUrl: string; shareToken: string };
  },

  sendReport: async (id: string) => {
    const res = await apiClient.patch(`/reports/${encodeURIComponent(id)}/send-to-patient`);
    return res.data as { sent: boolean; pdfUrl: string | null };
  },

  listDocuments: async (params?: { patientId?: string; type?: string; from?: string; to?: string }) => {
    const res = await apiClient.get('/documents/list', { params });
    return res.data as { items: DocumentListItem[] };
  },

  verifyPublic: async (type: string, uuid: string) => {
    const res = await apiClient.get(`/public/verify/${encodeURIComponent(type)}/${encodeURIComponent(uuid)}`);
    return res.data as { isValid: boolean; doctorName: string; documentDate: string };
  },
};
