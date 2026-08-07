import { Injectable } from '@nestjs/common';
import {
  ChatMessageRepository,
  CreateChatMessageInput,
} from '@/app/contracts/chat-message.repository';
import { ChatMessage } from '@/entities/sala';
import { PrismaService } from '@/externals/database/prisma/prisma.service';

@Injectable()
export class PrismaChatMessageRepository implements ChatMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data: {
        atendimentoId: input.atendimentoId,
        authorKind: input.authorKind,
        authorUserId: input.authorUserId,
        body: input.body,
      },
    });
  }

  async listByAtendimento(atendimentoId: string): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { atendimentoId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
