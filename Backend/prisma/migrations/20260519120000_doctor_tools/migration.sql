-- CreateEnum
CREATE TYPE "ReferralLetterStatus" AS ENUM ('draft', 'sent');

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "consultationId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "specialtyCode" TEXT,

    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referral_letters" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "consultationId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientSpecialty" TEXT,
    "recipientAddress" TEXT,
    "body" TEXT NOT NULL,
    "status" "ReferralLetterStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "referral_letters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_patient_messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctorSpaceId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "doctor_patient_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "patient_medical_images" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "consultationId" TEXT,
    "examType" TEXT,
    "title" TEXT,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "notes" TEXT,
    "aiAnalysis" JSONB,

    CONSTRAINT "patient_medical_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastDeliveryAt" TIMESTAMP(3),

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_delivery_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "responseCode" INTEGER,
    "error" TEXT,

    CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctorSpaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

CREATE INDEX "medical_reports_patientId_createdAt_idx" ON "medical_reports"("patientId", "createdAt");
CREATE INDEX "medical_reports_doctorSpaceId_createdAt_idx" ON "medical_reports"("doctorSpaceId", "createdAt");
CREATE INDEX "referral_letters_patientId_createdAt_idx" ON "referral_letters"("patientId", "createdAt");
CREATE INDEX "referral_letters_doctorSpaceId_createdAt_idx" ON "referral_letters"("doctorSpaceId", "createdAt");
CREATE INDEX "doctor_patient_messages_doctorSpaceId_createdAt_idx" ON "doctor_patient_messages"("doctorSpaceId", "createdAt");
CREATE INDEX "doctor_patient_messages_patientId_createdAt_idx" ON "doctor_patient_messages"("patientId", "createdAt");
CREATE INDEX "patient_medical_images_patientId_createdAt_idx" ON "patient_medical_images"("patientId", "createdAt");
CREATE INDEX "patient_medical_images_doctorSpaceId_createdAt_idx" ON "patient_medical_images"("doctorSpaceId", "createdAt");
CREATE INDEX "webhooks_doctorSpaceId_idx" ON "webhooks"("doctorSpaceId");
CREATE INDEX "webhook_delivery_logs_webhookId_createdAt_idx" ON "webhook_delivery_logs"("webhookId", "createdAt");
CREATE INDEX "api_keys_doctorSpaceId_idx" ON "api_keys"("doctorSpaceId");

ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_letters" ADD CONSTRAINT "referral_letters_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_letters" ADD CONSTRAINT "referral_letters_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_letters" ADD CONSTRAINT "referral_letters_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_letters" ADD CONSTRAINT "referral_letters_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_patient_messages" ADD CONSTRAINT "doctor_patient_messages_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_patient_messages" ADD CONSTRAINT "doctor_patient_messages_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_patient_messages" ADD CONSTRAINT "doctor_patient_messages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_medical_images" ADD CONSTRAINT "patient_medical_images_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_medical_images" ADD CONSTRAINT "patient_medical_images_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_medical_images" ADD CONSTRAINT "patient_medical_images_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_medical_images" ADD CONSTRAINT "patient_medical_images_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
