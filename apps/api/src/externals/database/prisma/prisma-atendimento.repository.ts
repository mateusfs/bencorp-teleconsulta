import { Injectable } from '@nestjs/common';
import {
  Atendimento as PrismaAtendimento,
  AtendimentoStatus as PrismaStatus,
  ClassificacaoRisco as PrismaRisco,
  DesfechoAtendimento as PrismaDesfecho,
  Prisma,
} from '@prisma/client';
import {
  AtendimentoRepository,
  CreateAtendimentoInput,
  CreateEncaminhadoInput,
  FinalizeAtendimentoInput,
  ListarFilaFilters,
} from '@/app/contracts/atendimento.repository';
import {
  Atendimento,
  AtendimentoFilaItem,
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import { normalizeCpf, periodoToQueuedAtRange } from '@/entities/periodo-fila';
import { DEFAULT_LIST_LIMIT } from '@/app/contracts/list-limits';
import { PrismaService } from './prisma.service';

type RowWithPatient = PrismaAtendimento & {
  patient: { name: string; contact: string; cpf: string };
};

function toStatus(status: PrismaStatus): AtendimentoStatus {
  return AtendimentoStatus[status];
}

function toRisco(risk: PrismaRisco | null): ClassificacaoRisco | null {
  return risk ? ClassificacaoRisco[risk] : null;
}

function toDesfecho(
  desfecho: PrismaDesfecho | null,
): DesfechoAtendimento | null {
  return desfecho ? DesfechoAtendimento[desfecho] : null;
}

function toDomain(row: PrismaAtendimento): Atendimento {
  return {
    id: row.id,
    patientId: row.patientId,
    status: toStatus(row.status),
    riskClassification: toRisco(row.riskClassification),
    professionalId: row.professionalId,
    queuedAt: row.queuedAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    desfecho: toDesfecho(row.desfecho),
    encaminhadoDeId: row.encaminhadoDeId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toFilaItem(row: RowWithPatient, now: Date): AtendimentoFilaItem {
  const base = toDomain(row);
  return {
    ...base,
    patientName: row.patient.name,
    patientContact: row.patient.contact,
    patientCpf: row.patient.cpf,
    tempoEsperaSegundos: Math.max(
      0,
      Math.floor((now.getTime() - row.queuedAt.getTime()) / 1000),
    ),
  };
}

@Injectable()
export class PrismaAtendimentoRepository implements AtendimentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listFila(filters: ListarFilaFilters): Promise<AtendimentoFilaItem[]> {
    const now = filters.now ?? new Date();
    const where: Prisma.AtendimentoWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.encaminhadosOnly) {
      where.encaminhadoDeId = { not: null };
    }

    const range = periodoToQueuedAtRange(filters.periodo ?? 'TODOS', now);
    if (range) {
      where.queuedAt = {
        gte: range.gte,
        lt: range.lt,
      };
    }

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      const cpf = normalizeCpf(q);
      where.patient = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          ...(cpf.length > 0 ? [{ cpf: { equals: cpf } }] : []),
        ],
      };
    }

    const rows = await this.prisma.atendimento.findMany({
      where,
      include: { patient: true },
      orderBy: [{ status: 'asc' }, { queuedAt: 'asc' }],
      take: filters.limit ?? DEFAULT_LIST_LIMIT,
    });

    return rows.map((row) => toFilaItem(row, now));
  }

  async findById(id: string): Promise<Atendimento | null> {
    const row = await this.prisma.atendimento.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByIdWithPatient(id: string): Promise<AtendimentoFilaItem | null> {
    const row = await this.prisma.atendimento.findUnique({
      where: { id },
      include: { patient: true },
    });
    return row ? toFilaItem(row, new Date()) : null;
  }

  async create(input: CreateAtendimentoInput): Promise<Atendimento> {
    const cpf = normalizeCpf(input.patientCpf);
    const patient = await this.prisma.patient.upsert({
      where: { cpf },
      update: {
        name: input.patientName.trim(),
        contact: input.patientContact.trim(),
      },
      create: {
        name: input.patientName.trim(),
        cpf,
        contact: input.patientContact.trim(),
      },
    });

    const row = await this.prisma.atendimento.create({
      data: {
        patientId: patient.id,
        status: AtendimentoStatus.AGUARDANDO,
        riskClassification: input.riskClassification,
      },
    });
    return toDomain(row);
  }

  async findEmAndamentoByProfessional(
    professionalId: string,
  ): Promise<Atendimento | null> {
    const row = await this.prisma.atendimento.findFirst({
      where: {
        professionalId,
        status: AtendimentoStatus.EM_ANDAMENTO,
      },
    });
    return row ? toDomain(row) : null;
  }

  async claimAtomic(
    id: string,
    professionalId: string,
    startedAt: Date,
  ): Promise<Atendimento | null> {
    const result = await this.prisma.atendimento.updateMany({
      where: {
        id,
        status: AtendimentoStatus.AGUARDANDO,
        professionalId: null,
      },
      data: {
        status: AtendimentoStatus.EM_ANDAMENTO,
        professionalId,
        startedAt,
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.findById(id);
  }

  async cancel(id: string): Promise<Atendimento> {
    const row = await this.prisma.atendimento.update({
      where: { id },
      data: {
        status: AtendimentoStatus.CANCELADO,
      },
    });
    return toDomain(row);
  }

  async finalize(input: FinalizeAtendimentoInput): Promise<Atendimento> {
    const row = await this.prisma.atendimento.update({
      where: { id: input.id },
      data: {
        status: AtendimentoStatus.FINALIZADO,
        desfecho: input.desfecho,
        finishedAt: input.finishedAt,
      },
    });
    return toDomain(row);
  }

  async finalizeAndCreateEncaminhado(
    input: CreateEncaminhadoInput,
  ): Promise<{ parent: Atendimento; child: Atendimento }> {
    return this.prisma.$transaction(async (tx) => {
      const parentRow = await tx.atendimento.update({
        where: { id: input.from.id },
        data: {
          status: AtendimentoStatus.FINALIZADO,
          desfecho: DesfechoAtendimento.ENCAMINHADO_MEDICO,
          finishedAt: input.finishedAt,
        },
      });

      const childRow = await tx.atendimento.create({
        data: {
          patientId: input.from.patientId,
          status: AtendimentoStatus.AGUARDANDO,
          riskClassification: input.from.riskClassification,
          encaminhadoDeId: input.from.id,
        },
      });

      return {
        parent: toDomain(parentRow),
        child: toDomain(childRow),
      };
    });
  }

  async updateRiskClassification(
    id: string,
    risk: ClassificacaoRisco | null,
  ): Promise<Atendimento> {
    const row = await this.prisma.atendimento.update({
      where: { id },
      data: { riskClassification: risk },
    });
    return toDomain(row);
  }
}
