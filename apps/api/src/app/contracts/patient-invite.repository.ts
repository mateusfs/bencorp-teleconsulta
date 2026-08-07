import { PatientInviteLink } from '@/entities/sala';

export const PATIENT_INVITE_REPOSITORY = Symbol('PATIENT_INVITE_REPOSITORY');

export type CreatePatientInviteInput = {
  atendimentoId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByUserId: string;
};

export interface PatientInviteRepository {
  create(input: CreatePatientInviteInput): Promise<PatientInviteLink>;
  findByTokenHash(tokenHash: string): Promise<PatientInviteLink | null>;
  markUsed(id: string, usedAt: Date): Promise<PatientInviteLink | null>;
  revokeAllForAtendimento(
    atendimentoId: string,
    revokedAt: Date,
  ): Promise<number>;
}
