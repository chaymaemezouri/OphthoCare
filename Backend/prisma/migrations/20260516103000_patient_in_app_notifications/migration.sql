-- Notifications in-app espace patient
CREATE TYPE "PatientInAppNotificationKind" AS ENUM ('appointment', 'receipt', 'document', 'cabinet_message', 'system');

CREATE TABLE "patient_in_app_notifications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "kind" "PatientInAppNotificationKind" NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkPath" TEXT,
    "meta" JSONB,

    CONSTRAINT "patient_in_app_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_in_app_notifications_patientId_createdAt_idx" ON "patient_in_app_notifications"("patientId", "createdAt");

ALTER TABLE "patient_in_app_notifications" ADD CONSTRAINT "patient_in_app_notifications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
