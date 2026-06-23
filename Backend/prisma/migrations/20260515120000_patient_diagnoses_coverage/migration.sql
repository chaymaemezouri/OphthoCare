-- AlterTable
ALTER TABLE "patients" ADD COLUMN "diagnoses" JSONB,
ADD COLUMN "cnssAffiliation" TEXT,
ADD COLUMN "amoRightsNumber" TEXT,
ADD COLUMN "mutuelleName" TEXT,
ADD COLUMN "mutuelleContractNumber" TEXT,
ADD COLUMN "coverageNotes" TEXT;
