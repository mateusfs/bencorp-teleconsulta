import { Injectable } from '@nestjs/common';
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
import { MemoryAtendimento, MemoryStore } from './memory-store';

@Injectable()
export class MemoryAtendimentoRepository implements AtendimentoRepository {
  constructor(private readonly store: MemoryStore) {}

  async listFila(filters: ListarFilaFilters): Promise<AtendimentoFilaItem[]> {
    await Promise.resolve();
    const now = filters.now ?? new Date();
    const range = periodoToQueuedAtRange(filters.periodo ?? 'TODOS', now);
    let list = [...this.store.atendimentos.values()];

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
      .map((item) => this.toFila(item, now))
      .slice(0, filters.limit ?? DEFAULT_LIST_LIMIT);
  }

  async findById(id: string): Promise<Atendimento | null> {
    await Promise.resolve();
    const item = this.store.atendimentos.get(id);
    return item ? this.store.stripAtendimento(item) : null;
  }

  async findByIdWithPatient(id: string): Promise<AtendimentoFilaItem | null> {
    await Promise.resolve();
    const item = this.store.atendimentos.get(id);
    return item ? this.toFila(item, new Date()) : null;
  }

  async create(input: CreateAtendimentoInput): Promise<Atendimento> {
    await Promise.resolve();
    const now = new Date();
    const cpf = normalizeCpf(input.patientCpf);
    let patient = [...this.store.patients.values()].find((p) => p.cpf === cpf);
    if (!patient) {
      patient = {
        id: this.store.newId(),
        name: input.patientName.trim(),
        cpf,
        contact: input.patientContact.trim(),
        createdAt: now,
        updatedAt: now,
      };
      this.store.patients.set(patient.id, patient);
    } else {
      patient.name = input.patientName.trim();
      patient.contact = input.patientContact.trim();
      patient.updatedAt = now;
    }

    const stored: MemoryAtendimento = {
      id: this.store.newId(),
      patientId: patient.id,
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
      patientName: patient.name,
      patientContact: patient.contact,
      patientCpf: patient.cpf,
    };
    this.store.atendimentos.set(stored.id, stored);
    this.store.markDirty();
    return this.store.stripAtendimento(stored);
  }

  async findEmAndamentoByProfessional(
    professionalId: string,
  ): Promise<Atendimento | null> {
    await Promise.resolve();
    const found = [...this.store.atendimentos.values()].find(
      (item) =>
        item.professionalId === professionalId &&
        item.status === AtendimentoStatus.EM_ANDAMENTO,
    );
    return found ? this.store.stripAtendimento(found) : null;
  }

  async claimAtomic(
    id: string,
    professionalId: string,
    startedAt: Date,
  ): Promise<Atendimento | null> {
    await Promise.resolve();
    const item = this.store.atendimentos.get(id);
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
    this.store.markDirty();
    return this.store.stripAtendimento(item);
  }

  async cancel(id: string): Promise<Atendimento> {
    await Promise.resolve();
    const item = this.store.atendimentos.get(id)!;
    item.status = AtendimentoStatus.CANCELADO;
    item.updatedAt = new Date();
    this.store.markDirty();
    return this.store.stripAtendimento(item);
  }

  async finalize(input: FinalizeAtendimentoInput): Promise<Atendimento> {
    await Promise.resolve();
    const item = this.store.atendimentos.get(input.id)!;
    item.status = AtendimentoStatus.FINALIZADO;
    item.desfecho = input.desfecho;
    item.finishedAt = input.finishedAt;
    item.updatedAt = input.finishedAt;
    this.store.markDirty();
    return this.store.stripAtendimento(item);
  }

  async finalizeAndCreateEncaminhado(
    input: CreateEncaminhadoInput,
  ): Promise<{ parent: Atendimento; child: Atendimento }> {
    await Promise.resolve();
    const parent = this.store.atendimentos.get(input.from.id)!;
    parent.status = AtendimentoStatus.FINALIZADO;
    parent.desfecho = DesfechoAtendimento.ENCAMINHADO_MEDICO;
    parent.finishedAt = input.finishedAt;
    parent.updatedAt = input.finishedAt;

    const now = new Date();
    const child: MemoryAtendimento = {
      id: this.store.newId(),
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
    this.store.atendimentos.set(child.id, child);
    this.store.markDirty();
    return {
      parent: this.store.stripAtendimento(parent),
      child: this.store.stripAtendimento(child),
    };
  }

  async updateRiskClassification(
    id: string,
    risk: ClassificacaoRisco | null,
  ): Promise<Atendimento> {
    await Promise.resolve();
    const item = this.store.atendimentos.get(id)!;
    item.riskClassification = risk;
    item.updatedAt = new Date();
    this.store.markDirty();
    return this.store.stripAtendimento(item);
  }

  private toFila(item: MemoryAtendimento, now: Date): AtendimentoFilaItem {
    return {
      ...item,
      tempoEsperaSegundos: Math.max(
        0,
        Math.floor((now.getTime() - item.queuedAt.getTime()) / 1000),
      ),
    };
  }
}
