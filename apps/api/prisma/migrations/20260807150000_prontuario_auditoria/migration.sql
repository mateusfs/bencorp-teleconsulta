-- CreateTable
CREATE TABLE "Prontuario" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "queixa" TEXT NOT NULL DEFAULT '',
    "anamnese" TEXT NOT NULL DEFAULT '',
    "conduta" TEXT NOT NULL DEFAULT '',
    "prescricao" TEXT NOT NULL DEFAULT '',
    "complementoMedico" TEXT NOT NULL DEFAULT '',
    "paSistolica" INTEGER,
    "paDiastolica" INTEGER,
    "fc" INTEGER,
    "temperatura" DOUBLE PRECISION,
    "spo2" INTEGER,
    "riskClassification" "ClassificacaoRisco",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prontuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioAdendo" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProntuarioAdendo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaLeitura" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLeitura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prontuario_atendimentoId_key" ON "Prontuario"("atendimentoId");

-- CreateIndex
CREATE INDEX "ProntuarioAdendo_prontuarioId_createdAt_idx" ON "ProntuarioAdendo"("prontuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditoriaLeitura_prontuarioId_createdAt_idx" ON "AuditoriaLeitura"("prontuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditoriaLeitura_patientId_createdAt_idx" ON "AuditoriaLeitura"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioAdendo" ADD CONSTRAINT "ProntuarioAdendo_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioAdendo" ADD CONSTRAINT "ProntuarioAdendo_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLeitura" ADD CONSTRAINT "AuditoriaLeitura_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "Prontuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLeitura" ADD CONSTRAINT "AuditoriaLeitura_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLeitura" ADD CONSTRAINT "AuditoriaLeitura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
