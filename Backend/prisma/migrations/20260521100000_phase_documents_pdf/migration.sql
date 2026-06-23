-- Sem 21-22 : documents PDF (ordonnances, reçus, comptes rendus)

CREATE TYPE "PdfGenerationStatus" AS ENUM ('pending', 'ready', 'failed');
CREATE TYPE "PrescriptionDocumentType" AS ENUM ('STANDARD', 'OPTIC', 'KINE', 'WORK_STOPPAGE', 'DIET');
CREATE TYPE "ClinicalReportDocumentType" AS ENUM ('CONSULTATION', 'CERTIFICATE', 'REFERRAL', 'DISCHARGE', 'WORK_STOPPAGE');
CREATE TYPE "PaymentReceiptStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'CANCELLED');
CREATE TYPE "PaymentReceiptMethod" AS ENUM ('CASH', 'CARD', 'INSURANCE', 'WIRE');

ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "reportType" "ClinicalReportDocumentType" NOT NULL DEFAULT 'CONSULTATION';
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "pdfStorageKey" TEXT;
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "pdfStatus" "PdfGenerationStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "verificationUuid" TEXT;
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "sharedAt" TIMESTAMP(3);
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "sentToPatientAt" TIMESTAMP(3);
ALTER TABLE "medical_reports" ADD COLUMN IF NOT EXISTS "documentFooterNumber" TEXT;

UPDATE "medical_reports" SET "verificationUuid" = gen_random_uuid()::text WHERE "verificationUuid" IS NULL;
ALTER TABLE "medical_reports" ALTER COLUMN "verificationUuid" SET NOT NULL;
ALTER TABLE "medical_reports" ALTER COLUMN "verificationUuid" SET DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX IF NOT EXISTS "medical_reports_verificationUuid_key" ON "medical_reports"("verificationUuid");
CREATE UNIQUE INDEX IF NOT EXISTS "medical_reports_shareToken_key" ON "medical_reports"("shareToken");

CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consultationId" TEXT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "type" "PrescriptionDocumentType" NOT NULL DEFAULT 'STANDARD',
    "medications" JSONB NOT NULL DEFAULT '[]',
    "pdfStorageKey" TEXT,
    "pdfUrl" TEXT,
    "pdfStatus" "PdfGenerationStatus" NOT NULL DEFAULT 'pending',
    "verificationUuid" TEXT NOT NULL,
    "documentFooterNumber" TEXT,
    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_receipts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consultationId" TEXT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "sequentialNumber" TEXT NOT NULL,
    "actType" TEXT NOT NULL,
    "actLabel" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "status" "PaymentReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentReceiptMethod",
    "pdfStorageKey" TEXT,
    "pdfUrl" TEXT,
    "pdfStatus" "PdfGenerationStatus" NOT NULL DEFAULT 'pending',
    "verificationUuid" TEXT NOT NULL,
    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_space_receipt_counters" (
    "doctorSpaceId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "doctor_space_receipt_counters_pkey" PRIMARY KEY ("doctorSpaceId","year")
);

CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "form" TEXT,
    "dosages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "countryTags" TEXT[] DEFAULT ARRAY['FR', 'MA']::TEXT[],
    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prescriptions_verificationUuid_key" ON "prescriptions"("verificationUuid");
CREATE UNIQUE INDEX "payment_receipts_verificationUuid_key" ON "payment_receipts"("verificationUuid");
CREATE UNIQUE INDEX "payment_receipts_doctorSpaceId_sequentialNumber_key" ON "payment_receipts"("doctorSpaceId", "sequentialNumber");
CREATE INDEX "prescriptions_patientId_createdAt_idx" ON "prescriptions"("patientId", "createdAt");
CREATE INDEX "prescriptions_doctorSpaceId_createdAt_idx" ON "prescriptions"("doctorSpaceId", "createdAt");
CREATE INDEX "payment_receipts_patientId_createdAt_idx" ON "payment_receipts"("patientId", "createdAt");
CREATE INDEX "payment_receipts_doctorSpaceId_createdAt_idx" ON "payment_receipts"("doctorSpaceId", "createdAt");
CREATE INDEX "medications_name_idx" ON "medications"("name");

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_space_receipt_counters" ADD CONSTRAINT "doctor_space_receipt_counters_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
