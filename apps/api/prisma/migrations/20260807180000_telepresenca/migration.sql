-- CreateEnum
CREATE TYPE "ChatAuthorKind" AS ENUM ('PROFISSIONAL', 'PACIENTE');

-- CreateTable
CREATE TABLE "PatientInviteLink" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "authorKind" "ChatAuthorKind" NOT NULL,
    "authorUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientInviteLink_tokenHash_key" ON "PatientInviteLink"("tokenHash");

-- CreateIndex
CREATE INDEX "PatientInviteLink_atendimentoId_idx" ON "PatientInviteLink"("atendimentoId");

-- CreateIndex
CREATE INDEX "ChatMessage_atendimentoId_createdAt_idx" ON "ChatMessage"("atendimentoId", "createdAt");

-- AddForeignKey
ALTER TABLE "PatientInviteLink" ADD CONSTRAINT "PatientInviteLink_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInviteLink" ADD CONSTRAINT "PatientInviteLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
