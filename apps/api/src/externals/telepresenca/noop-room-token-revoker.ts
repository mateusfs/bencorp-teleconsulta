import { Injectable } from '@nestjs/common';
import { RoomTokenRevoker } from '@/app/contracts/room-token-revoker';

@Injectable()
export class NoopRoomTokenRevoker implements RoomTokenRevoker {
  revokeAllForAtendimento(atendimentoId: string): Promise<void> {
    void atendimentoId;
    return Promise.resolve();
  }
}
