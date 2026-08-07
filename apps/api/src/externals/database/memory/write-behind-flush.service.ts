import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '@/externals/database/prisma/prisma.service';
import { MemoryStore } from './memory-store';

@Injectable()
export class WriteBehindFlushService {
  private readonly logger = new Logger(WriteBehindFlushService.name);
  private flushing = false;

  constructor(
    private readonly store: MemoryStore,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  scheduleFlush(): void {
    if (!this.canFlush()) {
      return;
    }
    setImmediate(() => {
      void this.flush();
    });
  }

  async flush(): Promise<void> {
    if (!this.canFlush() || this.flushing) {
      return;
    }
    this.flushing = true;
    try {
      const prisma = this.prisma!;
      for (const user of this.store.users.values()) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            passwordHash: user.passwordHash,
            role: user.role,
            active: user.active,
          },
          create: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role,
            active: user.active,
          },
        });
      }

      for (const patient of this.store.patients.values()) {
        await prisma.patient.upsert({
          where: { cpf: patient.cpf },
          update: { name: patient.name, contact: patient.contact },
          create: {
            id: patient.id,
            name: patient.name,
            cpf: patient.cpf,
            contact: patient.contact,
          },
        });
      }

      for (const item of this.store.atendimentos.values()) {
        await prisma.atendimento.upsert({
          where: { id: item.id },
          update: {
            status: item.status,
            riskClassification: item.riskClassification,
            professionalId: item.professionalId,
            queuedAt: item.queuedAt,
            startedAt: item.startedAt,
            finishedAt: item.finishedAt,
            desfecho: item.desfecho,
            encaminhadoDeId: item.encaminhadoDeId,
          },
          create: {
            id: item.id,
            patientId: item.patientId,
            status: item.status,
            riskClassification: item.riskClassification,
            professionalId: item.professionalId,
            queuedAt: item.queuedAt,
            startedAt: item.startedAt,
            finishedAt: item.finishedAt,
            desfecho: item.desfecho,
            encaminhadoDeId: item.encaminhadoDeId,
          },
        });
      }

      for (const prontuario of this.store.prontuarios.values()) {
        await prisma.prontuario.upsert({
          where: { atendimentoId: prontuario.atendimentoId },
          update: {
            queixa: prontuario.queixa,
            anamnese: prontuario.anamnese,
            conduta: prontuario.conduta,
            prescricao: prontuario.prescricao,
            complementoMedico: prontuario.complementoMedico,
            paSistolica: prontuario.paSistolica,
            paDiastolica: prontuario.paDiastolica,
            fc: prontuario.fc,
            temperatura: prontuario.temperatura,
            spo2: prontuario.spo2,
            riskClassification: prontuario.riskClassification,
          },
          create: {
            id: prontuario.id,
            atendimentoId: prontuario.atendimentoId,
            queixa: prontuario.queixa,
            anamnese: prontuario.anamnese,
            conduta: prontuario.conduta,
            prescricao: prontuario.prescricao,
            complementoMedico: prontuario.complementoMedico,
            paSistolica: prontuario.paSistolica,
            paDiastolica: prontuario.paDiastolica,
            fc: prontuario.fc,
            temperatura: prontuario.temperatura,
            spo2: prontuario.spo2,
            riskClassification: prontuario.riskClassification,
          },
        });

        for (const adendo of prontuario.adendos) {
          const exists = await prisma.prontuarioAdendo.findUnique({
            where: { id: adendo.id },
          });
          if (!exists) {
            await prisma.prontuarioAdendo.create({
              data: {
                id: adendo.id,
                prontuarioId: prontuario.id,
                authorId: adendo.authorId,
                texto: adendo.texto,
                createdAt: adendo.createdAt,
              },
            });
          }
        }
      }

      this.store.clearDirty();
      this.logger.debug('Write-behind flush concluído');
    } catch (error) {
      this.logger.warn(
        `Write-behind flush falhou (memória permanece): ${String(error)}`,
      );
    } finally {
      this.flushing = false;
    }
  }

  private canFlush(): boolean {
    return Boolean(this.prisma?.isConnected() && this.store.dirty);
  }
}
