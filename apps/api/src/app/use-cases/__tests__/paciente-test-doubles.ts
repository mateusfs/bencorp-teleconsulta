import {
  ListarPacientesFilters,
  PacienteRepository,
} from '@/app/contracts/paciente.repository';
import { Atendimento } from '@/entities/atendimento';
import { Paciente } from '@/entities/paciente';
import { Prontuario } from '@/entities/prontuario';
import { normalizeCpf } from '@/entities/periodo-fila';

export class InMemoryPacienteRepository implements PacienteRepository {
  private readonly patients = new Map<string, Paciente>();
  private readonly atendimentos: Atendimento[] = [];
  private readonly prontuarios: Prontuario[] = [];

  seedPatient(paciente: Paciente): void {
    this.patients.set(paciente.id, { ...paciente });
  }

  seedHistorico(input: {
    atendimentos?: Atendimento[];
    prontuarios?: Prontuario[];
  }): void {
    if (input.atendimentos) {
      this.atendimentos.push(...input.atendimentos.map((a) => ({ ...a })));
    }
    if (input.prontuarios) {
      this.prontuarios.push(
        ...input.prontuarios.map((p) => ({
          ...p,
          adendos: p.adendos.map((a) => ({ ...a })),
        })),
      );
    }
  }

  list(filters: ListarPacientesFilters): Promise<Paciente[]> {
    let rows = [...this.patients.values()];
    const q = filters.q?.trim();
    if (q) {
      const lower = q.toLowerCase();
      const cpf = normalizeCpf(q);
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (cpf.length > 0 && p.cpf === cpf),
      );
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(rows.map((p) => ({ ...p })));
  }

  findById(id: string): Promise<Paciente | null> {
    const row = this.patients.get(id);
    return Promise.resolve(row ? { ...row } : null);
  }

  findHistoricoByPatientId(patientId: string): Promise<{
    atendimentos: Atendimento[];
    prontuarios: Prontuario[];
  }> {
    const atendimentos = this.atendimentos
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => b.queuedAt.getTime() - a.queuedAt.getTime())
      .map((a) => ({ ...a }));
    const prontuarios = this.prontuarios
      .filter((p) => p.patientId === patientId)
      .map((p) => ({
        ...p,
        adendos: p.adendos.map((a) => ({ ...a })),
      }));
    return Promise.resolve({ atendimentos, prontuarios });
  }
}

export function buildPaciente(
  overrides: Partial<Paciente> & Pick<Paciente, 'id' | 'name' | 'cpf'>,
): Paciente {
  const now = new Date('2026-08-01T12:00:00.000Z');
  return {
    contact: '11999990000',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
