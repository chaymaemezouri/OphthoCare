-- AlterTable
ALTER TABLE "doctor_sites" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "doctor_spaces" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "medical_reports" ALTER COLUMN "verificationUuid" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tariffs" ALTER COLUMN "updatedAt" DROP DEFAULT;
