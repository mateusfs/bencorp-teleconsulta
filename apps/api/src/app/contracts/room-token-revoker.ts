export const ROOM_TOKEN_REVOKER = Symbol('ROOM_TOKEN_REVOKER');

export interface RoomTokenRevoker {
  revokeAllForAtendimento(atendimentoId: string): Promise<void>;
}
