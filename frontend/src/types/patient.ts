import type { User } from './user';

export interface MedicalData {
  allergies?: string[];
  bloodGroup?: string;
  chronicDiseases?: string[];
  medications?: Array<{ name: string; dosage: string; duration: string }>;
}

/** Diagnostic CIM-10 déclaré par le patient (côté dossier administratif / antécédents). */
export interface Cim10Diagnosis {
  code: string;
  label: string;
  notes?: string;
  recordedAt?: string;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  dateOfBirth?: string;
}

/** Contact d’urgence (profil patient). */
export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Patient {
  id: string;
  user: User;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  medicalData?: MedicalData;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceCoverage?: string;
  address?: string;
  phone?: string;
  allergies?: string[];
  antecedents?: string[];
  bloodType?: string;
  emergencyContact?: EmergencyContact;
  cnssAffiliation?: string;
  amoRightsNumber?: string;
  mutuelleName?: string;
  mutuelleContractNumber?: string;
  coverageNotes?: string;
  diagnoses?: Cim10Diagnosis[];
  familyMembers?: FamilyMember[];
  createdAt: string;
  updatedAt: string;
  /** Présent sur GET /patients (liste espace médecin / secrétaire). */
  spaceFirstVisit?: string;
  spaceLastVisit?: string;
}

export interface CreatePatientDto {
  dateOfBirth?: string;
  gender?: string;
  medicalData?: MedicalData;
}

export interface RegisterPatientProfilePayload {
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  medicalData?: MedicalData;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceCoverage?: string;
  address?: string;
  phone?: string;
  bloodType?: string;
  allergies?: string[];
  antecedents?: string[];
  emergencyContact?: EmergencyContact;
  cnssAffiliation?: string;
  amoRightsNumber?: string;
  mutuelleName?: string;
  mutuelleContractNumber?: string;
  coverageNotes?: string;
  diagnoses?: Cim10Diagnosis[];
  familyMembers?: FamilyMember[];
}

export interface MedicalAppointmentSummary {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason?: string;
  notes?: string;
  /** Consultation clinique liée au RDV (si le cabinet en a ouvert une). */
  consultationId?: string;
  doctor: {
    id: string;
    displayName: string;
    specialty: string;
    city: string;
  };
}

/** Entrée clinique structurée (médecin) avec versioning côté API */
export interface ClinicalRecordSummary {
  id: string;
  patientId?: string;
  createdAt: string;
  updatedAt: string;
  specialtyCode: string;
  title?: string;
  narrative?: string;
  structuredData: Record<string, unknown>;
  appointmentId?: string;
  appointmentStart?: string;
  author: { displayName: string; email: string };
  versionCount: number;
  /** Présent sur GET /clinical-records/mine */
  patientDisplayName?: string;
}

/** Liste des entrées cliniques rédigées par le médecin connecté. */
export interface DoctorAuthoredClinicalListResponse {
  items: ClinicalRecordSummary[];
  total: number;
  skip: number;
  take: number;
  stats: { monthTotal: number; draftCount: number };
}

/** Journal des mises à jour du dossier administratif / antécédents */
export interface DossierAuditSummary {
  id: string;
  createdAt: string;
  summary?: string;
  editor: { displayName: string; email: string };
}

export interface PatientMedicalTimeline {
  patientId: string;
  declaredDiagnoses: Cim10Diagnosis[];
  appointmentSummaries: MedicalAppointmentSummary[];
  clinicalRecords?: ClinicalRecordSummary[];
  dossierAudits?: DossierAuditSummary[];
}

/** Point de constantes issues des consultations clôturées (GET /consultations/vitals-timeline). */
export interface VitalTimelinePoint {
  date: string;
  consultationId: string;
  values: Record<string, number | string | null>;
}

export interface VitalsTimelineResponse {
  patientId: string;
  points: VitalTimelinePoint[];
}
