-- AlterTable
ALTER TABLE "pre_consultation_forms" ADD COLUMN "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pre_consultation_forms_publicToken_key" ON "pre_consultation_forms"("publicToken");
