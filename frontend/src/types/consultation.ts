import type { Appointment } from './appointment';
import type { Doctor } from './doctor';
import type { Patient } from './patient';

export interface Consultation {
  id: string;
  doctor: Doctor;
  patient: Patient;
  appointment?: Appointment;
  consultationDate: string;
  symptoms?: string;
  diagnosis?: string;
  clinicalData?: Record<string, unknown>;
  treatment?: string;
  duration?: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationDto {
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  symptoms?: string;
  diagnosis?: string;
}

/** Réponse GET /consultations/:id (module consultations Nest). */
export interface ConsultationApiDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  specialtyCode: string;
  structuredData: Record<string, unknown>;
  observations: string | null;
  diagnosis: string | null;
  plan: string | null;
  prescriptionIds: string[];
  startAt: string | null;
  closedAt: string | null;
  durationSeconds?: number | null;
  receipt: {
    id: string;
    amount: unknown;
    currency: string;
    payload?: unknown;
    createdAt: string;
  } | null;
  appointment: { id: string; startTime: string; preConsultationFormId?: string | null } | null;
  suggestedPreConsultation?: {
    id: string;
    responses?: Record<string, unknown>;
    specialtyCode?: string | null;
    createdAt?: string;
  } | null;
}
