import { Paciente } from '@/entities/paciente';
import { Atendimento, ClassificacaoRisco } from '@/entities/atendimento';
import { Prontuario } from '@/entities/prontuario';

export const PACIENTE_REPOSITORY = Symbol('PACIENTE_REPOSITORY');

export type ListarPacientesFilters = {
  q?: string;
  limit?: number;
};

export type ProntuarioHistoricoResumo = {
  id: string;
  atendimentoId: string;
  patientId: string;
  queixa: string;
  paSistolica: number | null;
  paDiastolica: number | null;
  fc: number | null;
  temperatura: number | null;
  spo2: number | null;
  riskClassification: ClassificacaoRisco | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PacienteComHistorico = {
  paciente: Paciente;
  atendimentos: Atendimento[];
  prontuarios: ProntuarioHistoricoResumo[];
};

export function toProntuarioHistoricoResumo(
  prontuario: Prontuario,
): ProntuarioHistoricoResumo {
  return {
    id: prontuario.id,
    atendimentoId: prontuario.atendimentoId,
    patientId: prontuario.patientId,
    queixa: prontuario.queixa,
    paSistolica: prontuario.paSistolica,
    paDiastolica: prontuario.paDiastolica,
    fc: prontuario.fc,
    temperatura: prontuario.temperatura,
    spo2: prontuario.spo2,
    riskClassification: prontuario.riskClassification,
    createdAt: prontuario.createdAt,
    updatedAt: prontuario.updatedAt,
  };
}

export interface PacienteRepository {
  list(filters: ListarPacientesFilters): Promise<Paciente[]>;
  findById(id: string): Promise<Paciente | null>;
  findHistoricoByPatientId(patientId: string): Promise<{
    atendimentos: Atendimento[];
    prontuarios: Prontuario[];
  }>;
}
