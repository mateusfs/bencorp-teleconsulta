import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  VIDEO_ROOM_PROVIDER,
  VideoAccessToken,
  VideoRoomProvider,
} from '@/app/contracts/video-room.provider';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';
import {
  assertRoomActive,
  ROOM_TOKEN_TTL_SECONDS,
  roomNameForAtendimento,
} from '@/entities/sala';
import { isClinicalRole, UserRole } from '@/entities/user-role';

@Injectable()
export class EmitirTokenSalaUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(VIDEO_ROOM_PROVIDER)
    private readonly video: VideoRoomProvider,
  ) {}

  async execute(input: {
    atendimentoId: string;
    userId: string;
    role: UserRole;
  }): Promise<VideoAccessToken> {
    if (!isClinicalRole(input.role)) {
      throw new ForbiddenError('Perfil sem acesso à sala');
    }

    const atendimento = await this.atendimentos.findById(input.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertRoomActive(atendimento.status);

    if (atendimento.professionalId !== input.userId) {
      throw new ForbiddenError(
        'Somente o profissional responsável pode obter token da sala',
      );
    }

    return this.video.createAccessToken({
      roomName: roomNameForAtendimento(input.atendimentoId),
      identity: `profissional-${input.userId}`,
      ttlSeconds: ROOM_TOKEN_TTL_SECONDS,
      metadata: JSON.stringify({
        atendimentoId: input.atendimentoId,
        participant: 'profissional',
      }),
    });
  }
}
