import { Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_INVITE_REPOSITORY,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import { RoomTokenRevoker } from '@/app/contracts/room-token-revoker';

@Injectable()
export class MemoryRoomTokenRevoker implements RoomTokenRevoker {
  constructor(
    @Inject(PATIENT_INVITE_REPOSITORY)
    private readonly invites: PatientInviteRepository,
  ) {}

  async revokeAllForAtendimento(atendimentoId: string): Promise<void> {
    await this.invites.revokeAllForAtendimento(atendimentoId, new Date());
  }
}
