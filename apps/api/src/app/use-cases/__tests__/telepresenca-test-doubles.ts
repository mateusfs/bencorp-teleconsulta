import { createHash, randomUUID } from 'node:crypto';
import {
  CreatePatientInviteInput,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import {
  ChatMessageRepository,
  CreateChatMessageInput,
} from '@/app/contracts/chat-message.repository';
import {
  CreateVideoAccessTokenInput,
  VideoAccessToken,
  VideoRoomProvider,
} from '@/app/contracts/video-room.provider';
import { ChatMessage, PatientInviteLink } from '@/entities/sala';

export class InMemoryPatientInviteRepository implements PatientInviteRepository {
  readonly items = new Map<string, PatientInviteLink>();

  async create(input: CreatePatientInviteInput): Promise<PatientInviteLink> {
    await Promise.resolve();
    const row: PatientInviteLink = {
      id: randomUUID(),
      atendimentoId: input.atendimentoId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      revokedAt: null,
      createdByUserId: input.createdByUserId,
      createdAt: new Date(),
    };
    this.items.set(row.id, row);
    return row;
  }

  async findByTokenHash(tokenHash: string): Promise<PatientInviteLink | null> {
    await Promise.resolve();
    return (
      [...this.items.values()].find((i) => i.tokenHash === tokenHash) ?? null
    );
  }

  async markUsed(id: string, usedAt: Date): Promise<PatientInviteLink | null> {
    await Promise.resolve();
    const row = this.items.get(id);
    if (!row || row.usedAt || row.revokedAt) {
      return null;
    }
    row.usedAt = usedAt;
    return row;
  }

  async revokeAllForAtendimento(
    atendimentoId: string,
    revokedAt: Date,
  ): Promise<number> {
    await Promise.resolve();
    let count = 0;
    for (const row of this.items.values()) {
      if (row.atendimentoId === atendimentoId && !row.revokedAt) {
        row.revokedAt = revokedAt;
        count += 1;
      }
    }
    return count;
  }
}

export class InMemoryChatMessageRepository implements ChatMessageRepository {
  readonly items: ChatMessage[] = [];

  async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    await Promise.resolve();
    const row: ChatMessage = {
      id: randomUUID(),
      atendimentoId: input.atendimentoId,
      authorKind: input.authorKind,
      authorUserId: input.authorUserId,
      body: input.body,
      createdAt: new Date(),
    };
    this.items.push(row);
    return row;
  }

  async listByAtendimento(atendimentoId: string): Promise<ChatMessage[]> {
    await Promise.resolve();
    return this.items.filter((m) => m.atendimentoId === atendimentoId);
  }
}

export class FakeVideoRoomProvider implements VideoRoomProvider {
  readonly deletedRooms: string[] = [];
  tokens = 0;

  createAccessToken(
    input: CreateVideoAccessTokenInput,
  ): Promise<VideoAccessToken> {
    this.tokens += 1;
    return Promise.resolve({
      token: `lk-${input.identity}-${input.roomName}`,
      url: 'ws://localhost:7880',
      expiresInSeconds: input.ttlSeconds,
    });
  }

  deleteRoom(roomName: string): Promise<void> {
    this.deletedRooms.push(roomName);
    return Promise.resolve();
  }
}

export function hashInviteToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
