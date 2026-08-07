-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ENFERMEIRO', 'MEDICO');

-- CreateEnum
CREATE TYPE "AtendimentoStatus" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "DesfechoAtendimento" AS ENUM ('ENCERRADO', 'ENCAMINHADO_MEDICO');

-- CreateEnum
CREATE TYPE "ClassificacaoRisco" AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "AtendimentoStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "riskClassification" "ClassificacaoRisco",
    "professionalId" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "desfecho" "DesfechoAtendimento",
    "encaminhadoDeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");

-- CreateIndex
CREATE INDEX "Atendimento_status_queuedAt_idx" ON "Atendimento"("status", "queuedAt");

-- CreateIndex
CREATE INDEX "Atendimento_professionalId_status_idx" ON "Atendimento"("professionalId", "status");

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_encaminhadoDeId_fkey" FOREIGN KEY ("encaminhadoDeId") REFERENCES "Atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
