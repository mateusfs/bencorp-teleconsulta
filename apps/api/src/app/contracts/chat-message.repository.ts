import { ChatAuthorKind, ChatMessage } from '@/entities/sala';

export const CHAT_MESSAGE_REPOSITORY = Symbol('CHAT_MESSAGE_REPOSITORY');

export type CreateChatMessageInput = {
  atendimentoId: string;
  authorKind: ChatAuthorKind;
  authorUserId: string | null;
  body: string;
};

export interface ChatMessageRepository {
  create(input: CreateChatMessageInput): Promise<ChatMessage>;
  listByAtendimento(atendimentoId: string): Promise<ChatMessage[]>;
}
