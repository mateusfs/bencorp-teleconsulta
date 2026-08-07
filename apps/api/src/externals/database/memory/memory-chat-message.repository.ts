import { Injectable } from '@nestjs/common';
import {
  ChatMessageRepository,
  CreateChatMessageInput,
} from '@/app/contracts/chat-message.repository';
import { ChatMessage } from '@/entities/sala';
import { MemoryStore } from './memory-store';

@Injectable()
export class MemoryChatMessageRepository implements ChatMessageRepository {
  constructor(private readonly store: MemoryStore) {}

  create(input: CreateChatMessageInput): Promise<ChatMessage> {
    const row: ChatMessage = {
      id: this.store.newId(),
      atendimentoId: input.atendimentoId,
      authorKind: input.authorKind,
      authorUserId: input.authorUserId,
      body: input.body,
      createdAt: new Date(),
    };
    this.store.chatMessages.push(row);
    this.store.markDirty();
    return Promise.resolve({ ...row });
  }

  listByAtendimento(atendimentoId: string): Promise<ChatMessage[]> {
    return Promise.resolve(
      this.store.chatMessages
        .filter((m) => m.atendimentoId === atendimentoId)
        .map((m) => ({ ...m })),
    );
  }
}
