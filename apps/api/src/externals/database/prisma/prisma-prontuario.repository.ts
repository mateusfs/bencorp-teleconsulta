import { Injectable } from '@nestjs/common';
import {
  ClassificacaoRisco as PrismaRisco,
  Prontuario as PrismaProntuario,
  ProntuarioAdendo as PrismaAdendo,
} from '@prisma/client';
import {
  CreateProntuarioInput,
  ProntuarioRepository,
} from '@/app/contracts/prontuario.repository';
import { ClassificacaoRisco } from '@/entities/atendimento';
import {
  AtualizarProntuarioInput,
  Prontuario,
  ProntuarioAdendo,
} from '@/entities/prontuario';
import { PrismaService } from './prisma.service';

function toRisco(risk: PrismaRisco | null): ClassificacaoRisco | null {
  return risk ? ClassificacaoRisco[risk] : null;
}

function toAdendo(row: PrismaAdendo): ProntuarioAdendo {
  return {
    id: row.id,
    prontuarioId: row.prontuarioId,
    authorId: row.authorId,
    texto: row.texto,
    createdAt: row.createdAt,
  };
}

function toDomain(
  row: PrismaProntuario & {
    atendimento: { patientId: string };
    adendos: PrismaAdendo[];
  },
): Prontuario {
  return {
    id: row.id,
    atendimentoId: row.atendimentoId,
    patientId: row.atendimento.patientId,
    queixa: row.queixa,
    anamnese: row.anamnese,
    conduta: row.conduta,
    prescricao: row.prescricao,
    complementoMedico: row.complementoMedico,
    paSistolica: row.paSistolica,
    paDiastolica: row.paDiastolica,
    fc: row.fc,
    temperatura: row.temperatura,
    spo2: row.spo2,
    riskClassification: toRisco(row.riskClassification),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    adendos: row.adendos.map(toAdendo),
  };
}

const include = {
  atendimento: { select: { patientId: true } },
  adendos: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class PrismaProntuarioRepository implements ProntuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Prontuario | null> {
    const row = await this.prisma.prontuario.findUnique({
      where: { id },
      include,
    });
    return row ? toDomain(row) : null;
  }

  async findByAtendimentoId(atendimentoId: string): Promise<Prontuario | null> {
    const row = await this.prisma.prontuario.findUnique({
      where: { atendimentoId },
      include,
    });
    return row ? toDomain(row) : null;
  }

  async create(input: CreateProntuarioInput): Promise<Prontuario> {
    const row = await this.prisma.prontuario.create({
      data: {
        atendimentoId: input.atendimentoId,
        riskClassification: input.riskClassification ?? undefined,
      },
      include,
    });
    return toDomain(row);
  }

  async update(
    id: string,
    input: AtualizarProntuarioInput,
  ): Promise<Prontuario> {
    const row = await this.prisma.prontuario.update({
      where: { id },
      data: {
        queixa: input.queixa,
        anamnese: input.anamnese,
        conduta: input.conduta,
        prescricao: input.prescricao,
        complementoMedico: input.complementoMedico,
        paSistolica: input.paSistolica,
        paDiastolica: input.paDiastolica,
        fc: input.fc,
        temperatura: input.temperatura,
        spo2: input.spo2,
        riskClassification: input.riskClassification,
      },
      include,
    });
    return toDomain(row);
  }

  async addAdendo(
    prontuarioId: string,
    authorId: string,
    texto: string,
  ): Promise<ProntuarioAdendo> {
    const row = await this.prisma.prontuarioAdendo.create({
      data: { prontuarioId, authorId, texto },
    });
    return toAdendo(row);
  }
}
