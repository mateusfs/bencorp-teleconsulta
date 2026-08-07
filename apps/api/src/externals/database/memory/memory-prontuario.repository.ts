import { Injectable } from '@nestjs/common';
import {
  CreateProntuarioInput,
  ProntuarioRepository,
} from '@/app/contracts/prontuario.repository';
import {
  AtualizarProntuarioInput,
  Prontuario,
  ProntuarioAdendo,
} from '@/entities/prontuario';
import { MemoryStore } from './memory-store';

@Injectable()
export class MemoryProntuarioRepository implements ProntuarioRepository {
  constructor(private readonly store: MemoryStore) {}

  findById(id: string): Promise<Prontuario | null> {
    const item = this.store.prontuarios.get(id);
    return Promise.resolve(item ? this.clone(item) : null);
  }

  findByAtendimentoId(atendimentoId: string): Promise<Prontuario | null> {
    const id = this.store.prontuarioByAtendimento.get(atendimentoId);
    if (!id) return Promise.resolve(null);
    return this.findById(id);
  }

  create(input: CreateProntuarioInput): Promise<Prontuario> {
    const now = new Date();
    const prontuario: Prontuario = {
      id: this.store.newId(),
      atendimentoId: input.atendimentoId,
      patientId: input.patientId,
      queixa: '',
      anamnese: '',
      conduta: '',
      prescricao: '',
      complementoMedico: '',
      paSistolica: null,
      paDiastolica: null,
      fc: null,
      temperatura: null,
      spo2: null,
      riskClassification: input.riskClassification ?? null,
      createdAt: now,
      updatedAt: now,
      adendos: [],
    };
    this.store.prontuarios.set(prontuario.id, prontuario);
    this.store.prontuarioByAtendimento.set(input.atendimentoId, prontuario.id);
    this.store.markDirty();
    return Promise.resolve(this.clone(prontuario));
  }

  update(id: string, input: AtualizarProntuarioInput): Promise<Prontuario> {
    const item = this.store.prontuarios.get(id)!;
    Object.assign(item, input, { updatedAt: new Date() });
    this.store.markDirty();
    return Promise.resolve(this.clone(item));
  }

  addAdendo(
    prontuarioId: string,
    authorId: string,
    texto: string,
  ): Promise<ProntuarioAdendo> {
    const item = this.store.prontuarios.get(prontuarioId)!;
    const adendo: ProntuarioAdendo = {
      id: this.store.newId(),
      prontuarioId,
      authorId,
      texto,
      createdAt: new Date(),
    };
    item.adendos.push(adendo);
    this.store.markDirty();
    return Promise.resolve({ ...adendo });
  }

  private clone(item: Prontuario): Prontuario {
    return { ...item, adendos: item.adendos.map((a) => ({ ...a })) };
  }
}
