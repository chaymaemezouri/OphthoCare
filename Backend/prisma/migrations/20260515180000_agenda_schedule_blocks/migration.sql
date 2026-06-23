-- CreateEnum
CREATE TYPE "ScheduleBlockKind" AS ENUM ('absence', 'closure', 'vacation');

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "kind" "ScheduleBlockKind" NOT NULL DEFAULT 'absence',
    "note" TEXT,
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_blocks_doctorId_startTime_idx" ON "schedule_blocks"("doctorId", "startTime");

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
