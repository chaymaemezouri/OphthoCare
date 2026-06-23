-- §2.4 Patient module: champs dossier, accès espace, consentements, lien secrétaire

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "insuranceCoverage" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "allergies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "antecedents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "bloodType" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergencyContact" JSONB;

CREATE TABLE IF NOT EXISTS "patient_doctor_accesses" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "firstVisit" TIMESTAMP(3) NOT NULL,
    "lastVisit" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_doctor_accesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_doctor_accesses_patientId_doctorSpaceId_key"
  ON "patient_doctor_accesses"("patientId", "doctorSpaceId");

CREATE INDEX IF NOT EXISTS "patient_doctor_accesses_doctorSpaceId_lastVisit_idx"
  ON "patient_doctor_accesses"("doctorSpaceId", "lastVisit");

ALTER TABLE "patient_doctor_accesses" ADD CONSTRAINT "patient_doctor_accesses_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_doctor_accesses" ADD CONSTRAINT "patient_doctor_accesses_doctorSpaceId_fkey"
  FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "patient_consents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_consents_patientId_type_key"
  ON "patient_consents"("patientId", "type");

CREATE INDEX IF NOT EXISTS "patient_consents_patientId_idx"
  ON "patient_consents"("patientId");

ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "secretary_doctor_spaces" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,

    CONSTRAINT "secretary_doctor_spaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "secretary_doctor_spaces_userId_key"
  ON "secretary_doctor_spaces"("userId");

CREATE INDEX IF NOT EXISTS "secretary_doctor_spaces_doctorSpaceId_idx"
  ON "secretary_doctor_spaces"("doctorSpaceId");

ALTER TABLE "secretary_doctor_spaces" ADD CONSTRAINT "secretary_doctor_spaces_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "secretary_doctor_spaces" ADD CONSTRAINT "secretary_doctor_spaces_doctorSpaceId_fkey"
  FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rétro-remplissage accès patient ↔ espace (RDV confirmés ou complétés)
INSERT INTO "patient_doctor_accesses" ("id", "createdAt", "updatedAt", "patientId", "doctorSpaceId", "firstVisit", "lastVisit")
SELECT gen_random_uuid()::text, NOW(), NOW(), sub."patient_id", sub."doctor_space_id", sub."min_st", sub."max_st"
FROM (
  SELECT
    a."patientId" AS "patient_id",
    ds."id" AS "doctor_space_id",
    MIN(a."startTime") AS "min_st",
    MAX(a."startTime") AS "max_st"
  FROM "appointments" a
  INNER JOIN "doctors" d ON d."id" = a."doctorId" AND d."deletedAt" IS NULL
  INNER JOIN "doctor_spaces" ds ON ds."doctorId" = d."id"
  WHERE a."deletedAt" IS NULL
    AND a."status"::text IN ('confirmed', 'completed')
  GROUP BY a."patientId", ds."id"
) AS sub
WHERE NOT EXISTS (
  SELECT 1 FROM "patient_doctor_accesses" pda
  WHERE pda."patientId" = sub."patient_id" AND pda."doctorSpaceId" = sub."doctor_space_id"
);
