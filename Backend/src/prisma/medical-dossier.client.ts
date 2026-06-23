import type { PrismaService } from './prisma.service';

/** Lignes retournées par findMany MedicalRecord (include aligné sur patients.service). */
export type ClinicalRecordRow = {
  id: string;
  patientId: string;
  createdAt: Date;
  updatedAt: Date;
  specialtyCode: string;
  title: string | null;
  narrative: string | null;
  structuredData: unknown;
  appointmentId: string | null;
  doctorSpaceId: string | null;
  author?: { firstName?: string | null; lastName?: string | null; email: string };
  appointment?: { id: string; startTime: Date } | null;
  _count?: { versions: number };
};

export type DossierAuditRow = {
  id: string;
  createdAt: Date;
  summary: string | null;
  editor: { firstName?: string | null; lastName?: string | null; email: string };
};

export type MedicalRecordVersionRow = {
  id: string;
  createdAt: Date;
  snapshot: unknown;
  changeSummary: string | null;
  editedBy: { firstName?: string | null; lastName?: string | null; email: string };
};

type MedicalRecordDelegate = {
  findMany(args: object): Promise<ClinicalRecordRow[]>;
};

type MedicalRecordWriteDelegate = {
  findMany(args: object): Promise<ClinicalRecordRow[]>;
  findFirst(args: object): Promise<unknown>;
  create(args: object): Promise<ClinicalRecordRow>;
  update(args: object): Promise<ClinicalRecordRow>;
  count(args: object): Promise<number>;
};

type MedicalRecordVersionDelegate = {
  findMany(args: object): Promise<MedicalRecordVersionRow[]>;
  create(args: object): Promise<unknown>;
};

type PatientMedicalAuditDelegate = {
  findMany(args: object): Promise<DossierAuditRow[]>;
  create(args: object): Promise<unknown>;
};

/** Accès délégué tant que `prisma generate` n’a pas régénéré le client (EPERM Windows). */
export function medicalRecordClient(prisma: PrismaService): MedicalRecordDelegate {
  return (prisma as unknown as { medicalRecord: MedicalRecordDelegate }).medicalRecord;
}

export function medicalRecordWriteClient(prisma: PrismaService): MedicalRecordWriteDelegate {
  return (prisma as unknown as { medicalRecord: MedicalRecordWriteDelegate }).medicalRecord;
}

export function medicalRecordVersionClient(prisma: PrismaService): MedicalRecordVersionDelegate {
  return (prisma as unknown as { medicalRecordVersion: MedicalRecordVersionDelegate }).medicalRecordVersion;
}

export function patientMedicalAuditClient(prisma: PrismaService): PatientMedicalAuditDelegate {
  return (prisma as unknown as { patientMedicalAudit: PatientMedicalAuditDelegate }).patientMedicalAudit;
}

/** Même délégué sur le client transactionnel Prisma. */
export function patientMedicalAuditTx(tx: object): PatientMedicalAuditDelegate {
  return (tx as { patientMedicalAudit: PatientMedicalAuditDelegate }).patientMedicalAudit;
}

export type ClinicalTransaction = {
  medicalRecord: Pick<MedicalRecordWriteDelegate, 'create' | 'update'>;
  medicalRecordVersion: Pick<MedicalRecordVersionDelegate, 'create'>;
  patientMedicalAudit: Pick<PatientMedicalAuditDelegate, 'create'>;
};

export function clinicalTransaction(tx: object): ClinicalTransaction {
  return tx as unknown as ClinicalTransaction;
}
