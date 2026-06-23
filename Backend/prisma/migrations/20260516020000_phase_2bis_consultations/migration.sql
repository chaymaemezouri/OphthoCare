-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('draft', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "trainee_doctor_spaces" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,

    CONSTRAINT "trainee_doctor_spaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trainee_doctor_spaces_userId_key" ON "trainee_doctor_spaces"("userId");
CREATE INDEX "trainee_doctor_spaces_doctorSpaceId_idx" ON "trainee_doctor_spaces"("doctorSpaceId");

ALTER TABLE "trainee_doctor_spaces" ADD CONSTRAINT "trainee_doctor_spaces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trainee_doctor_spaces" ADD CONSTRAINT "trainee_doctor_spaces_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable specialties
ALTER TABLE "specialties" ADD COLUMN "specificFields" JSONB;
ALTER TABLE "specialties" ADD COLUMN "examTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable pre_consultation_forms (before FK from appointments)
CREATE TABLE "pre_consultation_forms" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "specialtyCode" TEXT,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "originalSnapshot" JSONB,

    CONSTRAINT "pre_consultation_forms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pre_consultation_forms_patientId_doctorSpaceId_idx" ON "pre_consultation_forms"("patientId", "doctorSpaceId");

ALTER TABLE "pre_consultation_forms" ADD CONSTRAINT "pre_consultation_forms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pre_consultation_forms" ADD CONSTRAINT "pre_consultation_forms_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Link appointments.preConsultationFormId → pre_consultation_forms (nullable data must be valid or null)
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_preConsultationFormId_fkey";
UPDATE "appointments" SET "preConsultationFormId" = NULL WHERE "preConsultationFormId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "pre_consultation_forms" p WHERE p."id" = "appointments"."preConsultationFormId");
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_preConsultationFormId_fkey" FOREIGN KEY ("preConsultationFormId") REFERENCES "pre_consultation_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable consultations
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "specialtyCode" TEXT NOT NULL,
    "structuredData" JSONB NOT NULL DEFAULT '{}',
    "observations" TEXT,
    "diagnosis" TEXT,
    "plan" TEXT,
    "prescriptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ConsultationStatus" NOT NULL DEFAULT 'draft',
    "startAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "preConsultationFormId" TEXT,
    "importAudit" JSONB,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultations_patientId_createdAt_idx" ON "consultations"("patientId", "createdAt");
CREATE INDEX "consultations_doctorSpaceId_status_idx" ON "consultations"("doctorSpaceId", "status");
CREATE INDEX "consultations_doctorId_createdAt_idx" ON "consultations"("doctorId", "createdAt");

ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_preConsultationFormId_fkey" FOREIGN KEY ("preConsultationFormId") REFERENCES "pre_consultation_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable consultation_receipts
CREATE TABLE "consultation_receipts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consultationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "payload" JSONB,

    CONSTRAINT "consultation_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultation_receipts_consultationId_key" ON "consultation_receipts"("consultationId");

ALTER TABLE "consultation_receipts" ADD CONSTRAINT "consultation_receipts_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_preConsultationFormId_key" ON "appointments"("preConsultationFormId");
