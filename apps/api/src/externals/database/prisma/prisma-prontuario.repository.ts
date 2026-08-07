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
    const data: {
      queixa?: string;
      anamnese?: string;
      conduta?: string;
      prescricao?: string;
      complementoMedico?: string;
      paSistolica?: number | null;
      paDiastolica?: number | null;
      fc?: number | null;
      temperatura?: number | null;
      spo2?: number | null;
      riskClassification?: ClassificacaoRisco | null;
    } = {};

    if (input.queixa !== undefined) data.queixa = input.queixa;
    if (input.anamnese !== undefined) data.anamnese = input.anamnese;
    if (input.conduta !== undefined) data.conduta = input.conduta;
    if (input.prescricao !== undefined) data.prescricao = input.prescricao;
    if (input.complementoMedico !== undefined) {
      data.complementoMedico = input.complementoMedico;
    }
    if (input.paSistolica !== undefined) data.paSistolica = input.paSistolica;
    if (input.paDiastolica !== undefined) {
      data.paDiastolica = input.paDiastolica;
    }
    if (input.fc !== undefined) data.fc = input.fc;
    if (input.temperatura !== undefined) data.temperatura = input.temperatura;
    if (input.spo2 !== undefined) data.spo2 = input.spo2;
    if (input.riskClassification !== undefined) {
      data.riskClassification = input.riskClassification;
    }

    const row = await this.prisma.prontuario.update({
      where: { id },
      data,
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
