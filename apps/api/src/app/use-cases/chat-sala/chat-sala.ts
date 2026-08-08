import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  CHAT_MESSAGE_REPOSITORY,
  ChatMessageRepository,
} from '@/app/contracts/chat-message.repository';
import { Atendimento } from '@/entities/atendimento';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/entities/errors/domain-error';
import {
  assertRoomActive,
  CHAT_MESSAGE_MAX_LENGTH,
  ChatMessage,
} from '@/entities/sala';
import { isClinicalRole, UserRole } from '@/entities/user-role';

function assertProfessionalOwnsChat(
  atendimento: Atendimento,
  professionalUserId: string | undefined,
): void {
  if (
    !professionalUserId ||
    atendimento.professionalId !== professionalUserId
  ) {
    throw new ForbiddenError(
      'Somente o profissional responsável acessa o chat desta sala',
    );
  }
}

function assertChatBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new ValidationError('Mensagem vazia');
  }
  if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new ValidationError(
      `Mensagem deve ter no máximo ${CHAT_MESSAGE_MAX_LENGTH} caracteres`,
    );
  }
  return trimmed;
}

@Injectable()
export class ListarMensagensChatUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY)
    private readonly messages: ChatMessageRepository,
  ) {}

  async execute(input: {
    atendimentoId: string;
    role?: UserRole;
    professionalUserId?: string;
    patientAtendimentoId?: string;
  }): Promise<ChatMessage[]> {
    if (input.patientAtendimentoId) {
      if (input.patientAtendimentoId !== input.atendimentoId) {
        throw new ForbiddenError('Link não pertence a este atendimento');
      }
    } else if (!input.role || !isClinicalRole(input.role)) {
      throw new ForbiddenError('Perfil sem acesso ao chat');
    }

    const atendimento = await this.atendimentos.findById(input.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertRoomActive(atendimento.status);

    if (!input.patientAtendimentoId) {
      assertProfessionalOwnsChat(atendimento, input.professionalUserId);
    }

    return this.messages.listByAtendimento(input.atendimentoId);
  }
}

@Injectable()
export class EnviarMensagemChatUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY)
    private readonly messages: ChatMessageRepository,
  ) {}

  async execute(input: {
    atendimentoId: string;
    body: string;
    professionalUserId?: string;
    role?: UserRole;
    patientAtendimentoId?: string;
  }): Promise<ChatMessage> {
    const body = assertChatBody(input.body);

    if (input.patientAtendimentoId) {
      if (input.patientAtendimentoId !== input.atendimentoId) {
        throw new ForbiddenError('Link não pertence a este atendimento');
      }
    } else if (
      !input.professionalUserId ||
      !input.role ||
      !isClinicalRole(input.role)
    ) {
      throw new ForbiddenError('Perfil sem acesso ao chat');
    }

    const atendimento = await this.atendimentos.findById(input.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertRoomActive(atendimento.status);

    if (input.patientAtendimentoId) {
      return this.messages.create({
        atendimentoId: input.atendimentoId,
        authorKind: 'PACIENTE',
        authorUserId: null,
        body,
      });
    }

    assertProfessionalOwnsChat(atendimento, input.professionalUserId);

    return this.messages.create({
      atendimentoId: input.atendimentoId,
      authorKind: 'PROFISSIONAL',
      authorUserId: input.professionalUserId ?? null,
      body,
    });
  }
}
