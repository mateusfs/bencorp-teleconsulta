import { Injectable } from '@nestjs/common';
import {
  ListarPacientesFilters,
  PacienteRepository,
} from '@/app/contracts/paciente.repository';
import { Atendimento } from '@/entities/atendimento';
import { Paciente } from '@/entities/paciente';
import { Prontuario } from '@/entities/prontuario';
import { normalizeCpf } from '@/entities/periodo-fila';
import { MemoryStore } from './memory-store';

@Injectable()
export class MemoryPacienteRepository implements PacienteRepository {
  constructor(private readonly store: MemoryStore) {}

  list(filters: ListarPacientesFilters): Promise<Paciente[]> {
    let rows = [...this.store.patients.values()];
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
    const row = this.store.patients.get(id);
    return Promise.resolve(row ? { ...row } : null);
  }

  findHistoricoByPatientId(patientId: string): Promise<{
    atendimentos: Atendimento[];
    prontuarios: Prontuario[];
  }> {
    const atendimentos = [...this.store.atendimentos.values()]
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => b.queuedAt.getTime() - a.queuedAt.getTime())
      .map((a) => this.store.stripAtendimento(a));

    const prontuarios = [...this.store.prontuarios.values()]
      .filter((p) => p.patientId === patientId)
      .map((p) => ({
        ...p,
        adendos: p.adendos.map((a) => ({ ...a })),
      }));

    return Promise.resolve({ atendimentos, prontuarios });
  }
}
