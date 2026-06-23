-- AlterTable
ALTER TABLE "doctors" ADD COLUMN "orderNumber" TEXT,
ADD COLUMN "preferredCurrency" TEXT NOT NULL DEFAULT 'MAD',
ADD COLUMN "isCertified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "signatureUrl" TEXT;

-- CreateTable
CREATE TABLE "doctor_spaces" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "doctor_spaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "doctor_spaces_doctorId_key" ON "doctor_spaces"("doctorId");

ALTER TABLE "doctor_spaces" ADD CONSTRAINT "doctor_spaces_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "doctor_sites" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "doctorSpaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'MA',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "phone" TEXT,
    "partnerTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "doctor_sites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "doctor_sites_doctorSpaceId_idx" ON "doctor_sites"("doctorSpaceId");

ALTER TABLE "doctor_sites" ADD CONSTRAINT "doctor_sites_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "site_working_hours" (
    "id" TEXT NOT NULL,
    "doctorSiteId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "site_working_hours_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_working_hours_doctorSiteId_dayOfWeek_idx" ON "site_working_hours"("doctorSiteId", "dayOfWeek");

ALTER TABLE "site_working_hours" ADD CONSTRAINT "site_working_hours_doctorSiteId_fkey" FOREIGN KEY ("doctorSiteId") REFERENCES "doctor_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "tariffs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "doctorSiteId" TEXT NOT NULL,
    "actType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "durationMinutes" INTEGER,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tariffs_doctorSiteId_idx" ON "tariffs"("doctorSiteId");

ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_doctorSiteId_fkey" FOREIGN KEY ("doctorSiteId") REFERENCES "doctor_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
