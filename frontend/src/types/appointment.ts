import type { Doctor } from './doctor';
import type { Patient } from './patient';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  IN_PERSON = 'in-person',
  VIDEO = 'video',
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  patient: Patient;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  /** Formulaire pré-consultation lié par le cabinet (lecture côté dossier / consultation). */
  preConsultationFormId?: string | null;
  /** Cabinet du praticien (nécessaire pour créer / lier le questionnaire pré-consultation). */
  doctorSpaceId?: string | null;
  /** Site de consultation (créneau agenda). */
  siteId?: string | null;
  reason?: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  doctorId: string;
  startTime: string;
  endTime: string;
  reason?: string;
  type?: AppointmentType | string;
  slotDate?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  doctorId: string;
}

export interface AvailableDates {
  date: string;
  slots: TimeSlot[];
}
