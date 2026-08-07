import {
  Atendimento,
  AtendimentoFilaItem,
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import { PeriodoFila } from '@/entities/periodo-fila';

export const ATENDIMENTO_REPOSITORY = Symbol('ATENDIMENTO_REPOSITORY');

export type ListarFilaFilters = {
  q?: string;
  status?: AtendimentoStatus;
  periodo?: PeriodoFila;
  encaminhadosOnly?: boolean;
  now?: Date;
  limit?: number;
};

export type CreateAtendimentoInput = {
  patientName: string;
  patientCpf: string;
  patientContact: string;
  riskClassification?: ClassificacaoRisco;
};

export type FinalizeAtendimentoInput = {
  id: string;
  desfecho: DesfechoAtendimento;
  finishedAt: Date;
};

export type CreateEncaminhadoInput = {
  from: Atendimento;
  finishedAt: Date;
};

export interface AtendimentoRepository {
  listFila(filters: ListarFilaFilters): Promise<AtendimentoFilaItem[]>;
  findById(id: string): Promise<Atendimento | null>;
  findByIdWithPatient(id: string): Promise<AtendimentoFilaItem | null>;
  create(input: CreateAtendimentoInput): Promise<Atendimento>;
  findEmAndamentoByProfessional(
    professionalId: string,
  ): Promise<Atendimento | null>;
  claimAtomic(
    id: string,
    professionalId: string,
    startedAt: Date,
  ): Promise<Atendimento | null>;
  cancel(id: string): Promise<Atendimento>;
  finalize(input: FinalizeAtendimentoInput): Promise<Atendimento>;
  finalizeAndCreateEncaminhado(
    input: CreateEncaminhadoInput,
  ): Promise<{ parent: Atendimento; child: Atendimento }>;
  updateRiskClassification(
    id: string,
    risk: ClassificacaoRisco | null,
  ): Promise<Atendimento>;
}
