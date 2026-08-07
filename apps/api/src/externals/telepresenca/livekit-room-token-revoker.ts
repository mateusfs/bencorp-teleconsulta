import { Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_INVITE_REPOSITORY,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import { RoomTokenRevoker } from '@/app/contracts/room-token-revoker';
import {
  VIDEO_ROOM_PROVIDER,
  VideoRoomProvider,
} from '@/app/contracts/video-room.provider';
import { roomNameForAtendimento } from '@/entities/sala';

@Injectable()
export class LiveKitRoomTokenRevoker implements RoomTokenRevoker {
  constructor(
    @Inject(VIDEO_ROOM_PROVIDER)
    private readonly video: VideoRoomProvider,
    @Inject(PATIENT_INVITE_REPOSITORY)
    private readonly invites: PatientInviteRepository,
  ) {}

  async revokeAllForAtendimento(atendimentoId: string): Promise<void> {
    await this.invites.revokeAllForAtendimento(atendimentoId, new Date());
    await this.video.deleteRoom(roomNameForAtendimento(atendimentoId));
  }
}
