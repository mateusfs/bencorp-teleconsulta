import { Injectable } from '@nestjs/common';
import {
  CreatePatientInviteInput,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import { PatientInviteLink } from '@/entities/sala';
import { MemoryStore } from './memory-store';

@Injectable()
export class MemoryPatientInviteRepository implements PatientInviteRepository {
  constructor(private readonly store: MemoryStore) {}

  create(input: CreatePatientInviteInput): Promise<PatientInviteLink> {
    const row: PatientInviteLink = {
      id: this.store.newId(),
      atendimentoId: input.atendimentoId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      revokedAt: null,
      createdByUserId: input.createdByUserId,
      createdAt: new Date(),
    };
    this.store.invites.set(row.id, row);
    this.store.markDirty();
    return Promise.resolve({ ...row });
  }

  findByTokenHash(tokenHash: string): Promise<PatientInviteLink | null> {
    const found = [...this.store.invites.values()].find(
      (i) => i.tokenHash === tokenHash,
    );
    return Promise.resolve(found ? { ...found } : null);
  }

  markUsed(id: string, usedAt: Date): Promise<PatientInviteLink | null> {
    const row = this.store.invites.get(id);
    if (!row || row.usedAt || row.revokedAt) {
      return Promise.resolve(null);
    }
    row.usedAt = usedAt;
    this.store.markDirty();
    return Promise.resolve({ ...row });
  }

  revokeAllForAtendimento(
    atendimentoId: string,
    revokedAt: Date,
  ): Promise<number> {
    let count = 0;
    for (const row of this.store.invites.values()) {
      if (row.atendimentoId === atendimentoId && !row.revokedAt) {
        row.revokedAt = revokedAt;
        count += 1;
      }
    }
    if (count > 0) {
      this.store.markDirty();
    }
    return Promise.resolve(count);
  }
}
