import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

export type ConsultationDto = {
  id: string;
  patientId: string;
  specialtyCode: string;
  structuredData: Record<string, unknown>;
  observations?: string | null;
  diagnosis?: string | null;
  plan?: string | null;
  status: string;
  startAt?: string | null;
  closedAt?: string | null;
  durationSeconds?: number | null;
  suggestedPreConsultation?: unknown;
};

export async function fetchConsultation(id: string) {
  const { data } = await apiClient.get<ConsultationDto>(API_ENDPOINTS.CONSULTATIONS.GET(id));
  return data;
}

export async function createConsultation(body: {
  patientId: string;
  appointmentId?: string;
  specialtyCode?: string;
}) {
  const { data } = await apiClient.post<ConsultationDto>(API_ENDPOINTS.CONSULTATIONS.CREATE, body);
  return data;
}

export async function patchConsultation(
  id: string,
  body: Partial<{
    structuredData: Record<string, unknown>;
    observations: string;
    diagnosis: string;
    plan: string;
    prescriptionIds: string[];
  }>,
) {
  const { data } = await apiClient.patch<ConsultationDto>(API_ENDPOINTS.CONSULTATIONS.UPDATE(id), body);
  return data;
}

export async function closeConsultation(id: string) {
  const { data } = await apiClient.post<ConsultationDto>(API_ENDPOINTS.CONSULTATIONS.CLOSE(id));
  return data;
}

export async function importPreConsultation(id: string, preFormId: string) {
  const { data } = await apiClient.post<ConsultationDto>(API_ENDPOINTS.CONSULTATIONS.IMPORT_PRE(id), {
    preFormId,
  });
  return data;
}

export async function compareConsultations(id1: string, id2: string) {
  const { data } = await apiClient.get(API_ENDPOINTS.CONSULTATIONS.COMPARE, {
    params: { id1, id2 },
  });
  return data as {
    consultationA: { id: string; createdAt: string; closedAt?: string | null; specialtyCode: string };
    consultationB: { id: string; createdAt: string; closedAt?: string | null; specialtyCode: string };
    diff: Record<string, { from: unknown; to: unknown }>;
  };
}

export async function fetchVitalsTimeline(patientId: string) {
  const { data } = await apiClient.get<{ patientId: string; points: Array<{ date: string; consultationId: string; values: Record<string, number | string | null> }> }>(
    API_ENDPOINTS.CONSULTATIONS.VITALS_TIMELINE,
    { params: { patientId } },
  );
  return data;
}

export async function fetchSpecialtyTemplate(code: string) {
  const { data } = await apiClient.get<{
    code: string;
    name: string | null;
    examTypes: string[];
    fields: import('@/lib/medical/specialty-field.types').SpecialtyField[];
  }>(API_ENDPOINTS.SPECIALTIES.TEMPLATE(code));
  return data;
}
