-- CreateEnum
CREATE TYPE "TraineeSessionType" AS ENUM ('chat', 'quiz', 'exam_explanation');

-- CreateEnum
CREATE TYPE "TraineeSessionStatus" AS ENUM ('in_progress', 'completed');

-- CreateTable
CREATE TABLE "trainee_learning_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "type" "TraineeSessionType" NOT NULL,
    "status" "TraineeSessionStatus" NOT NULL DEFAULT 'in_progress',
    "title" TEXT,
    "patientId" TEXT,
    "topic" TEXT,
    "messages" JSONB,
    "quizData" JSONB,
    "userAnswers" JSONB,
    "scorePercent" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "trainee_learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trainee_learning_sessions_userId_createdAt_idx" ON "trainee_learning_sessions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "trainee_learning_sessions_doctorSpaceId_userId_type_idx" ON "trainee_learning_sessions"("doctorSpaceId", "userId", "type");

-- AddForeignKey
ALTER TABLE "trainee_learning_sessions" ADD CONSTRAINT "trainee_learning_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainee_learning_sessions" ADD CONSTRAINT "trainee_learning_sessions_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainee_learning_sessions" ADD CONSTRAINT "trainee_learning_sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
