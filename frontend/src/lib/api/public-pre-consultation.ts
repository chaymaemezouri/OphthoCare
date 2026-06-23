import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const publicClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export type PublicPreConsultState = {
  token: string;
  appointmentId: string;
  appointmentStart: string;
  doctorName: string;
  specialtyName: string;
  specialtyCode: string;
  template: {
    code: string;
    name: string | null;
    fields: import('@/lib/medical/specialty-field.types').SpecialtyField[];
  };
  form: {
    id: string;
    responses: Record<string, unknown>;
    submitted: boolean;
    updatedAt: string;
  };
  editable: boolean;
};

export async function fetchPublicPreConsult(token: string) {
  const { data } = await publicClient.get<PublicPreConsultState>(
    `/public/pre-consultation/${encodeURIComponent(token)}`,
  );
  return data;
}

export async function submitPublicPreConsult(token: string, responses: Record<string, unknown>) {
  const { data } = await publicClient.put(`/public/pre-consultation/${encodeURIComponent(token)}`, {
    responses,
  });
  return data as { ok: boolean; submitted: boolean };
}
