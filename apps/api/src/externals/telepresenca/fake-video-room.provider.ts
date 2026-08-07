import { Injectable } from '@nestjs/common';
import {
  CreateVideoAccessTokenInput,
  VideoAccessToken,
  VideoRoomProvider,
} from '@/app/contracts/video-room.provider';

@Injectable()
export class FakeVideoRoomProvider implements VideoRoomProvider {
  createAccessToken(
    input: CreateVideoAccessTokenInput,
  ): Promise<VideoAccessToken> {
    return Promise.resolve({
      token: `fake-${input.identity}-${input.roomName}`,
      url: 'ws://localhost:7880',
      expiresInSeconds: input.ttlSeconds,
    });
  }

  deleteRoom(roomName: string): Promise<void> {
    void roomName;
    return Promise.resolve();
  }
}
