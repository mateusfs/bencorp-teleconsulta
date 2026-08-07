import { Injectable } from '@nestjs/common';
import {
  AuditoriaLeitura,
  AuditoriaLeituraRepository,
  RegistrarLeituraInput,
} from '@/app/contracts/auditoria-leitura.repository';
import { MemoryStore } from './memory-store';

@Injectable()
export class MemoryAuditoriaLeituraRepository implements AuditoriaLeituraRepository {
  constructor(private readonly store: MemoryStore) {}

  register(input: RegistrarLeituraInput): Promise<AuditoriaLeitura> {
    const row: AuditoriaLeitura = {
      id: this.store.newId(),
      ...input,
      createdAt: new Date(),
    };
    this.store.auditorias.push(row);
    this.store.markDirty();
    return Promise.resolve({ ...row });
  }

  listByProntuario(prontuarioId: string): Promise<AuditoriaLeitura[]> {
    return Promise.resolve(
      this.store.auditorias
        .filter((row) => row.prontuarioId === prontuarioId)
        .map((row) => ({ ...row })),
    );
  }
}
