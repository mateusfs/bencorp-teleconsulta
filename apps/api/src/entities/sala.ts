import { UnprocessableStateError } from '@/entities/errors/domain-error';

export const ROOM_TOKEN_TTL_SECONDS = 15 * 60;
export const PATIENT_INVITE_TTL_SECONDS = 60 * 60;

export function roomNameForAtendimento(atendimentoId: string): string {
  return `atendimento-${atendimentoId}`;
}

export type ChatAuthorKind = 'PROFISSIONAL' | 'PACIENTE';

export type PatientInviteLink = {
  id: string;
  atendimentoId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
};

export type ChatMessage = {
  id: string;
  atendimentoId: string;
  authorKind: ChatAuthorKind;
  authorUserId: string | null;
  body: string;
  createdAt: Date;
};

export function assertRoomActive(status: string): void {
  if (status !== 'EM_ANDAMENTO') {
    throw new UnprocessableStateError(
      'Sala disponível somente com atendimento em andamento',
    );
  }
}
