import { randomUUID } from 'node:crypto';
import {
  AtendimentoRepository,
  CreateAtendimentoInput,
  CreateEncaminhadoInput,
  FinalizeAtendimentoInput,
  ListarFilaFilters,
} from '@/app/contracts/atendimento.repository';
import { RoomTokenRevoker } from '@/app/contracts/room-token-revoker';
import {
  Atendimento,
  AtendimentoFilaItem,
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import { normalizeCpf, periodoToQueuedAtRange } from '@/entities/periodo-fila';
import { DEFAULT_LIST_LIMIT } from '@/app/contracts/list-limits';

type Stored = Atendimento & {
  patientName: string;
  patientContact: string;
  patientCpf: string;
};

export class InMemoryAtendimentoRepository implements AtendimentoRepository {
  private readonly items = new Map<string, Stored>();

  seed(item: Stored): void {
    this.items.set(item.id, item);
  }

  async listFila(filters: ListarFilaFilters): Promise<AtendimentoFilaItem[]> {
    await Promise.resolve();
    const now = filters.now ?? new Date();
    const range = periodoToQueuedAtRange(filters.periodo ?? 'TODOS', now);
    let list = [...this.items.values()];

    if (filters.status) {
      list = list.filter((item) => item.status === filters.status);
    }
    if (filters.encaminhadosOnly) {
      list = list.filter((item) => item.encaminhadoDeId !== null);
    }
    if (range?.gte) {
      list = list.filter((item) => item.queuedAt >= range.gte!);
    }
    if (range?.lt) {
      list = list.filter((item) => item.queuedAt < range.lt!);
    }
    if (filters.q?.trim()) {
      const q = filters.q.trim().toLowerCase();
      const cpf = normalizeCpf(filters.q);
      list = list.filter(
        (item) =>
          item.patientName.toLowerCase().includes(q) ||
          (cpf.length > 0 && item.patientCpf === cpf),
      );
    }

    return list
      .map((item) => ({
        ...item,
        tempoEsperaSegundos: Math.max(
          0,
          Math.floor((now.getTime() - item.queuedAt.getTime()) / 1000),
        ),
      }))
      .slice(0, filters.limit ?? DEFAULT_LIST_LIMIT);
  }

  async findById(id: string): Promise<Atendimento | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    return item ? this.strip(item) : null;
  }

  async findByIdWithPatient(id: string): Promise<AtendimentoFilaItem | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item) {
      return null;
    }
    return {
      ...item,
      tempoEsperaSegundos: Math.max(
        0,
        Math.floor((Date.now() - item.queuedAt.getTime()) / 1000),
      ),
    };
  }

  async create(input: CreateAtendimentoInput): Promise<Atendimento> {
    await Promise.resolve();
    const now = new Date();
    const stored: Stored = {
      id: randomUUID(),
      patientId: randomUUID(),
      status: AtendimentoStatus.AGUARDANDO,
      riskClassification: input.riskClassification ?? null,
      professionalId: null,
      queuedAt: now,
      startedAt: null,
      finishedAt: null,
      desfecho: null,
      encaminhadoDeId: null,
      createdAt: now,
      updatedAt: now,
      patientName: input.patientName,
      patientContact: input.patientContact,
      patientCpf: normalizeCpf(input.patientCpf),
    };
    this.items.set(stored.id, stored);
    return this.strip(stored);
  }

  async findEmAndamentoByProfessional(
    professionalId: string,
  ): Promise<Atendimento | null> {
    await Promise.resolve();
    const found = [...this.items.values()].find(
      (item) =>
        item.professionalId === professionalId &&
        item.status === AtendimentoStatus.EM_ANDAMENTO,
    );
    return found ? this.strip(found) : null;
  }

  async claimAtomic(
    id: string,
    professionalId: string,
    startedAt: Date,
  ): Promise<Atendimento | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (
      !item ||
      item.status !== AtendimentoStatus.AGUARDANDO ||
      item.professionalId !== null
    ) {
      return null;
    }
    item.status = AtendimentoStatus.EM_ANDAMENTO;
    item.professionalId = professionalId;
    item.startedAt = startedAt;
    item.updatedAt = startedAt;
    return this.strip(item);
  }

  async cancel(id: string): Promise<Atendimento> {
    await Promise.resolve();
    const item = this.items.get(id)!;
    item.status = AtendimentoStatus.CANCELADO;
    item.updatedAt = new Date();
    return this.strip(item);
  }

  async finalize(input: FinalizeAtendimentoInput): Promise<Atendimento> {
    await Promise.resolve();
    const item = this.items.get(input.id)!;
    item.status = AtendimentoStatus.FINALIZADO;
    item.desfecho = input.desfecho;
    item.finishedAt = input.finishedAt;
    item.updatedAt = input.finishedAt;
    return this.strip(item);
  }

  async finalizeAndCreateEncaminhado(
    input: CreateEncaminhadoInput,
  ): Promise<{ parent: Atendimento; child: Atendimento }> {
    await Promise.resolve();
    const parent = this.items.get(input.from.id)!;
    parent.status = AtendimentoStatus.FINALIZADO;
    parent.desfecho = DesfechoAtendimento.ENCAMINHADO_MEDICO;
    parent.finishedAt = input.finishedAt;
    parent.updatedAt = input.finishedAt;

    const now = new Date();
    const child: Stored = {
      id: randomUUID(),
      patientId: parent.patientId,
      status: AtendimentoStatus.AGUARDANDO,
      riskClassification: parent.riskClassification,
      professionalId: null,
      queuedAt: now,
      startedAt: null,
      finishedAt: null,
      desfecho: null,
      encaminhadoDeId: parent.id,
      createdAt: now,
      updatedAt: now,
      patientName: parent.patientName,
      patientContact: parent.patientContact,
      patientCpf: parent.patientCpf,
    };
    this.items.set(child.id, child);
    return { parent: this.strip(parent), child: this.strip(child) };
  }

  async updateRiskClassification(
    id: string,
    risk: ClassificacaoRisco | null,
  ): Promise<Atendimento> {
    await Promise.resolve();
    const item = this.items.get(id)!;
    item.riskClassification = risk;
    item.updatedAt = new Date();
    return this.strip(item);
  }

  private strip(item: Stored): Atendimento {
    return {
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
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

export function buildAtendimento(overrides: Partial<Stored> = {}): Stored {
  const now = new Date();
  return {
    id: overrides.id ?? randomUUID(),
    patientId: overrides.patientId ?? randomUUID(),
    status: overrides.status ?? AtendimentoStatus.AGUARDANDO,
    riskClassification: overrides.riskClassification ?? null,
    professionalId: overrides.professionalId ?? null,
    queuedAt: overrides.queuedAt ?? now,
    startedAt: overrides.startedAt ?? null,
    finishedAt: overrides.finishedAt ?? null,
    desfecho: overrides.desfecho ?? null,
    encaminhadoDeId: overrides.encaminhadoDeId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    patientName: overrides.patientName ?? 'Paciente Teste',
    patientContact: overrides.patientContact ?? '11999990000',
    patientCpf: overrides.patientCpf ?? '39053344705',
  };
}

export class SpyRoomTokenRevoker implements RoomTokenRevoker {
  readonly revoked: string[] = [];

  revokeAllForAtendimento(atendimentoId: string): Promise<void> {
    this.revoked.push(atendimentoId);
    return Promise.resolve();
  }
}
