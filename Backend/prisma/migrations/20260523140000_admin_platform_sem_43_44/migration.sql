-- Sem 43-44: Admin platform (audit, security, reviews)

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'super_admin';

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;

-- CreateEnum
CREATE TYPE "PlatformAuditAction" AS ENUM (
  'VIEW_PATIENT',
  'CREATE_CONSULTATION',
  'UPDATE_CONSULTATION',
  'CLOSE_CONSULTATION',
  'GENERATE_PRESCRIPTION',
  'VIEW_MEDICAL_RECORD',
  'EXPORT_DOCUMENT',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'OTHER'
);

CREATE TYPE "DoctorReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "doctorSpaceId" TEXT,
    "action" "PlatformAuditAction" NOT NULL,
    "entityIdHash" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "failed_login_attempts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    CONSTRAINT "failed_login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "active_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "refreshTokenId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_reviews" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "DoctorReviewStatus" NOT NULL DEFAULT 'pending',
    "rejectReason" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    CONSTRAINT "doctor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_audit_logs_userId_createdAt_idx" ON "platform_audit_logs"("userId", "createdAt");
CREATE INDEX "platform_audit_logs_doctorSpaceId_createdAt_idx" ON "platform_audit_logs"("doctorSpaceId", "createdAt");
CREATE INDEX "platform_audit_logs_action_createdAt_idx" ON "platform_audit_logs"("action", "createdAt");
CREATE INDEX "failed_login_attempts_ip_createdAt_idx" ON "failed_login_attempts"("ip", "createdAt");
CREATE INDEX "failed_login_attempts_email_createdAt_idx" ON "failed_login_attempts"("email", "createdAt");
CREATE UNIQUE INDEX "active_sessions_refreshTokenId_key" ON "active_sessions"("refreshTokenId");
CREATE INDEX "active_sessions_userId_createdAt_idx" ON "active_sessions"("userId", "createdAt");
CREATE INDEX "doctor_reviews_status_createdAt_idx" ON "doctor_reviews"("status", "createdAt");
CREATE INDEX "doctor_reviews_doctorId_status_idx" ON "doctor_reviews"("doctorId", "status");

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_refreshTokenId_fkey" FOREIGN KEY ("refreshTokenId") REFERENCES "refresh_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
