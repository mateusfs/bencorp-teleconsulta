import { Paciente } from '@/entities/paciente';
import { Atendimento } from '@/entities/atendimento';
import { Prontuario } from '@/entities/prontuario';

export const PACIENTE_REPOSITORY = Symbol('PACIENTE_REPOSITORY');

export type ListarPacientesFilters = {
  q?: string;
};

export type PacienteComHistorico = {
  paciente: Paciente;
  atendimentos: Atendimento[];
  prontuarios: Prontuario[];
};

export interface PacienteRepository {
  list(filters: ListarPacientesFilters): Promise<Paciente[]>;
  findById(id: string): Promise<Paciente | null>;
  findHistoricoByPatientId(patientId: string): Promise<{
    atendimentos: Atendimento[];
    prontuarios: Prontuario[];
  }>;
}
