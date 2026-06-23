-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN "doctorSpaceId" TEXT;

-- Backfill appointments missing doctorSpaceId
UPDATE "appointments" a
SET "doctorSpaceId" = ds."id"
FROM "doctor_spaces" ds
WHERE a."doctorSpaceId" IS NULL AND a."doctorId" = ds."doctorId";

-- Backfill medical_records from linked appointment
UPDATE "medical_records" mr
SET "doctorSpaceId" = a."doctorSpaceId"
FROM "appointments" a
WHERE mr."appointmentId" = a."id" AND a."doctorSpaceId" IS NOT NULL AND mr."doctorSpaceId" IS NULL;

-- Backfill medical_records from author doctor's space (notes sans RDV)
UPDATE "medical_records" mr
SET "doctorSpaceId" = ds."id"
FROM "users" u
INNER JOIN "doctors" d ON d."userId" = u."id"
INNER JOIN "doctor_spaces" ds ON ds."doctorId" = d."id"
WHERE mr."authorUserId" = u."id" AND mr."doctorSpaceId" IS NULL;

-- CreateIndex
CREATE INDEX "medical_records_patientId_doctorSpaceId_createdAt_idx" ON "medical_records"("patientId", "doctorSpaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
