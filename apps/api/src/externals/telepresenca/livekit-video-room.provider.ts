import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import {
  CreateVideoAccessTokenInput,
  VideoAccessToken,
  VideoRoomProvider,
} from '@/app/contracts/video-room.provider';

@Injectable()
export class LiveKitVideoRoomProvider implements VideoRoomProvider {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly wsUrl: string;
  private readonly httpHost: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('LIVEKIT_API_KEY');
    this.apiSecret = config.getOrThrow<string>('LIVEKIT_API_SECRET');
    this.wsUrl =
      config.get<string>('LIVEKIT_PUBLIC_URL') ??
      config.getOrThrow<string>('LIVEKIT_URL');
    const internal = config.get<string>('LIVEKIT_URL') ?? this.wsUrl;
    this.httpHost = this.toHttpHost(internal);
  }

  async createAccessToken(
    input: CreateVideoAccessTokenInput,
  ): Promise<VideoAccessToken> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: input.identity,
      ttl: input.ttlSeconds,
      metadata: input.metadata,
    });
    token.addGrant({
      roomJoin: true,
      room: input.roomName,
      canPublish: true,
      canSubscribe: true,
    });
    const jwt = await token.toJwt();
    return {
      token: jwt,
      url: this.wsUrl,
      expiresInSeconds: input.ttlSeconds,
    };
  }

  async deleteRoom(roomName: string): Promise<void> {
    const client = new RoomServiceClient(
      this.httpHost,
      this.apiKey,
      this.apiSecret,
    );
    try {
      await client.deleteRoom(roomName);
    } catch {
      return;
    }
  }

  private toHttpHost(wsUrl: string): string {
    if (wsUrl.startsWith('ws://')) {
      return `http://${wsUrl.slice('ws://'.length)}`;
    }
    if (wsUrl.startsWith('wss://')) {
      return `https://${wsUrl.slice('wss://'.length)}`;
    }
    return wsUrl;
  }
}
