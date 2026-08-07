export const VIDEO_ROOM_PROVIDER = Symbol('VIDEO_ROOM_PROVIDER');

export type CreateVideoAccessTokenInput = {
  roomName: string;
  identity: string;
  ttlSeconds: number;
  metadata?: string;
};

export type VideoAccessToken = {
  token: string;
  url: string;
  expiresInSeconds: number;
};

export interface VideoRoomProvider {
  createAccessToken(
    input: CreateVideoAccessTokenInput,
  ): Promise<VideoAccessToken>;
  deleteRoom(roomName: string): Promise<void>;
}
