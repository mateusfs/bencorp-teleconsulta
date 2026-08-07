import { Injectable } from '@nestjs/common';
import {
  AuditoriaLeitura,
  AuditoriaLeituraRepository,
  RegistrarLeituraInput,
} from '@/app/contracts/auditoria-leitura.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAuditoriaLeituraRepository implements AuditoriaLeituraRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegistrarLeituraInput): Promise<AuditoriaLeitura> {
    const row = await this.prisma.auditoriaLeitura.create({
      data: {
        prontuarioId: input.prontuarioId,
        patientId: input.patientId,
        userId: input.userId,
        endpoint: input.endpoint,
      },
    });
    return {
      id: row.id,
      prontuarioId: row.prontuarioId,
      patientId: row.patientId,
      userId: row.userId,
      endpoint: row.endpoint,
      createdAt: row.createdAt,
    };
  }

  async listByProntuario(prontuarioId: string): Promise<AuditoriaLeitura[]> {
    const rows = await this.prisma.auditoriaLeitura.findMany({
      where: { prontuarioId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      prontuarioId: row.prontuarioId,
      patientId: row.patientId,
      userId: row.userId,
      endpoint: row.endpoint,
      createdAt: row.createdAt,
    }));
  }
}
