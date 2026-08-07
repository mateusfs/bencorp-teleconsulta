import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  PATIENT_INVITE_REPOSITORY,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import { TOKEN_SERVICE, TokenService } from '@/app/contracts/token-service';
import {
  VIDEO_ROOM_PROVIDER,
  VideoAccessToken,
  VideoRoomProvider,
} from '@/app/contracts/video-room.provider';
import {
  ForbiddenError,
  GoneError,
  NotFoundError,
} from '@/entities/errors/domain-error';
import {
  assertRoomActive,
  ROOM_TOKEN_TTL_SECONDS,
  roomNameForAtendimento,
} from '@/entities/sala';

export type ResgatarLinkPacienteResult = {
  patientAccessToken: string;
  expiresIn: string;
  atendimentoId: string;
  video: VideoAccessToken;
};

@Injectable()
export class ResgatarLinkPacienteUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(PATIENT_INVITE_REPOSITORY)
    private readonly invites: PatientInviteRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenService,
    @Inject(VIDEO_ROOM_PROVIDER)
    private readonly video: VideoRoomProvider,
  ) {}

  async execute(input: {
    rawToken: string;
    expectedAtendimentoId?: string;
  }): Promise<ResgatarLinkPacienteResult> {
    const tokenHash = createHash('sha256').update(input.rawToken).digest('hex');
    const invite = await this.invites.findByTokenHash(tokenHash);
    if (!invite) {
      throw new NotFoundError('Link inválido');
    }

    if (
      input.expectedAtendimentoId &&
      invite.atendimentoId !== input.expectedAtendimentoId
    ) {
      throw new ForbiddenError('Link não pertence a este atendimento');
    }

    if (invite.revokedAt) {
      throw new GoneError('Link revogado');
    }
    if (invite.usedAt) {
      throw new GoneError('Link já utilizado');
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new GoneError('Link expirado');
    }

    const atendimento = await this.atendimentos.findById(invite.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    try {
      assertRoomActive(atendimento.status);
    } catch {
      throw new GoneError('Atendimento não está mais em andamento');
    }

    const claimed = await this.invites.markUsed(invite.id, new Date());
    if (!claimed) {
      throw new GoneError('Link já utilizado');
    }

    const patientToken = await this.tokens.signPatient(
      {
        sub: atendimento.patientId,
        atendimentoId: atendimento.id,
      },
      ROOM_TOKEN_TTL_SECONDS,
    );

    const video = await this.video.createAccessToken({
      roomName: roomNameForAtendimento(atendimento.id),
      identity: `paciente-${atendimento.patientId}`,
      ttlSeconds: ROOM_TOKEN_TTL_SECONDS,
      metadata: JSON.stringify({
        atendimentoId: atendimento.id,
        participant: 'paciente',
      }),
    });

    return {
      patientAccessToken: patientToken.accessToken,
      expiresIn: patientToken.expiresIn,
      atendimentoId: atendimento.id,
      video,
    };
  }
}
