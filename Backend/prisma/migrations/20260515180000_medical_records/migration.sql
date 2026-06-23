-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "specialtyCode" TEXT NOT NULL,
    "title" TEXT,
    "narrative" TEXT,
    "structuredData" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_record_versions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicalRecordId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "editedByUserId" TEXT NOT NULL,
    "changeSummary" TEXT,

    CONSTRAINT "medical_record_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_medical_audits" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" TEXT NOT NULL,
    "editorUserId" TEXT NOT NULL,
    "previousPayload" JSONB,
    "newPayload" JSONB,
    "summary" TEXT,

    CONSTRAINT "patient_medical_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_records_patientId_createdAt_idx" ON "medical_records"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "medical_records_authorUserId_idx" ON "medical_records"("authorUserId");

-- CreateIndex
CREATE INDEX "medical_record_versions_medicalRecordId_createdAt_idx" ON "medical_record_versions"("medicalRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_medical_audits_patientId_createdAt_idx" ON "patient_medical_audits"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_versions" ADD CONSTRAINT "medical_record_versions_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_versions" ADD CONSTRAINT "medical_record_versions_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medical_audits" ADD CONSTRAINT "patient_medical_audits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medical_audits" ADD CONSTRAINT "patient_medical_audits_editorUserId_fkey" FOREIGN KEY ("editorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
