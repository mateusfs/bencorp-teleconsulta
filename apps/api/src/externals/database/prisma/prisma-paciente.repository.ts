import { Injectable } from '@nestjs/common';
import {
  Atendimento as PrismaAtendimento,
  AtendimentoStatus as PrismaStatus,
  ClassificacaoRisco as PrismaRisco,
  DesfechoAtendimento as PrismaDesfecho,
  Prontuario as PrismaProntuario,
  ProntuarioAdendo as PrismaAdendo,
} from '@prisma/client';
import {
  ListarPacientesFilters,
  PacienteRepository,
} from '@/app/contracts/paciente.repository';
import {
  Atendimento,
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import { Paciente } from '@/entities/paciente';
import { Prontuario } from '@/entities/prontuario';
import { normalizeCpf } from '@/entities/periodo-fila';
import { DEFAULT_LIST_LIMIT } from '@/app/contracts/list-limits';
import { PrismaService } from './prisma.service';

type ProntuarioRow = PrismaProntuario & { adendos: PrismaAdendo[] };
type AtendimentoComProntuario = PrismaAtendimento & {
  prontuario: ProntuarioRow | null;
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

function toAtendimento(row: PrismaAtendimento): Atendimento {
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

function toProntuario(p: ProntuarioRow, patientId: string): Prontuario {
  return {
    id: p.id,
    atendimentoId: p.atendimentoId,
    patientId,
    queixa: p.queixa,
    anamnese: p.anamnese,
    conduta: p.conduta,
    prescricao: p.prescricao,
    complementoMedico: p.complementoMedico,
    paSistolica: p.paSistolica,
    paDiastolica: p.paDiastolica,
    fc: p.fc,
    temperatura: p.temperatura,
    spo2: p.spo2,
    riskClassification: toRisco(p.riskClassification),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    adendos: p.adendos.map((a) => ({
      id: a.id,
      prontuarioId: a.prontuarioId,
      authorId: a.authorId,
      texto: a.texto,
      createdAt: a.createdAt,
    })),
  };
}

@Injectable()
export class PrismaPacienteRepository implements PacienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ListarPacientesFilters): Promise<Paciente[]> {
    const q = filters.q?.trim();
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            ...(normalizeCpf(q).length > 0
              ? [{ cpf: { equals: normalizeCpf(q) } }]
              : []),
          ],
        }
      : {};

    const rows = await this.prisma.patient.findMany({
      where,
      orderBy: { name: 'asc' },
      take: filters.limit ?? DEFAULT_LIST_LIMIT,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      cpf: row.cpf,
      contact: row.contact,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findById(id: string): Promise<Paciente | null> {
    const row = await this.prisma.patient.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      cpf: row.cpf,
      contact: row.contact,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findHistoricoByPatientId(patientId: string): Promise<{
    atendimentos: Atendimento[];
    prontuarios: Prontuario[];
  }> {
    const atendimentos = (await this.prisma.atendimento.findMany({
      where: { patientId },
      orderBy: { queuedAt: 'desc' },
      include: {
        prontuario: {
          include: {
            adendos: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    })) as AtendimentoComProntuario[];

    const domainAtendimentos = atendimentos.map(toAtendimento);
    const prontuarios: Prontuario[] = [];
    for (const row of atendimentos) {
      if (!row.prontuario) continue;
      prontuarios.push(toProntuario(row.prontuario, patientId));
    }

    return { atendimentos: domainAtendimentos, prontuarios };
  }
}
