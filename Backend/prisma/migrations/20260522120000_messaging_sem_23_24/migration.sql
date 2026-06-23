-- Sem 23-24 : messagerie cabinet-patient

CREATE TYPE "BroadcastRecipientFilter" AS ENUM ('ALL', 'ACTIVE_LAST_30D', 'CHRONIC');

CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorSpaceId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCountDoctor" INTEGER NOT NULL DEFAULT 0,
    "unreadCountPatient" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broadcast_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctorSpaceId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recipientFilter" "BroadcastRecipientFilter" NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "broadcast_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_patientId_doctorSpaceId_key" ON "conversations"("patientId", "doctorSpaceId");
CREATE INDEX "conversations_doctorSpaceId_lastMessageAt_idx" ON "conversations"("doctorSpaceId", "lastMessageAt");
CREATE INDEX "conversations_patientId_lastMessageAt_idx" ON "conversations"("patientId", "lastMessageAt");
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
CREATE INDEX "messages_conversationId_id_idx" ON "messages"("conversationId", "id");
CREATE INDEX "broadcast_logs_doctorSpaceId_sentAt_idx" ON "broadcast_logs"("doctorSpaceId", "sentAt");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "broadcast_logs" ADD CONSTRAINT "broadcast_logs_doctorSpaceId_fkey" FOREIGN KEY ("doctorSpaceId") REFERENCES "doctor_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
