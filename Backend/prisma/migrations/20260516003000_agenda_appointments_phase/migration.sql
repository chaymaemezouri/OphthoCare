-- CreateEnum
CREATE TYPE "AppointmentVisitKind" AS ENUM ('new_visit', 'followup', 'emergency', 'teleconsult');

-- AlterEnum (PostgreSQL: nouvelle valeur en fin de liste)
ALTER TYPE "AppointmentStatus" ADD VALUE 'in_progress';

-- AlterEnum
ALTER TYPE "ScheduleBlockKind" ADD VALUE 'break_pause';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "visitKind" "AppointmentVisitKind" NOT NULL DEFAULT 'new_visit';
ALTER TABLE "appointments" ADD COLUMN "doctorSpaceId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "doctorSiteId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "familyMemberId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "appointments" ADD COLUMN "cancelledByUserId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "preConsultationFormId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "reminderDayBeforeSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "appointments" ADD COLUMN "reminderTwoHourSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "schedule_blocks" ADD COLUMN "doctorSpaceId" TEXT;
ALTER TABLE "schedule_blocks" ADD COLUMN "doctorSiteId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_doctorSiteId_startTime_idx" ON "appointments"("doctorSiteId", "startTime");
CREATE INDEX "appointments_doctorSpaceId_startTime_idx" ON "appointments"("doctorSpaceId", "startTime");
CREATE INDEX "schedule_blocks_doctorSiteId_startTime_idx" ON "schedule_blocks"("doctorSiteId", "startTime");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorSiteId_fkey" FOREIGN KEY ("doctorSiteId") REFERENCES "doctor_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_doctorSiteId_fkey" FOREIGN KEY ("doctorSiteId") REFERENCES "doctor_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
