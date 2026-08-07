import {
  AtualizarProntuarioInput,
  Prontuario,
  ProntuarioAdendo,
} from '@/entities/prontuario';
import { ClassificacaoRisco } from '@/entities/atendimento';

export const PRONTUARIO_REPOSITORY = Symbol('PRONTUARIO_REPOSITORY');

export type CreateProntuarioInput = {
  atendimentoId: string;
  patientId: string;
  riskClassification?: ClassificacaoRisco | null;
};

export interface ProntuarioRepository {
  findById(id: string): Promise<Prontuario | null>;
  findByAtendimentoId(atendimentoId: string): Promise<Prontuario | null>;
  create(input: CreateProntuarioInput): Promise<Prontuario>;
  update(id: string, input: AtualizarProntuarioInput): Promise<Prontuario>;
  addAdendo(
    prontuarioId: string,
    authorId: string,
    texto: string,
  ): Promise<ProntuarioAdendo>;
}
