import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  PATIENT_INVITE_REPOSITORY,
  PatientInviteRepository,
} from '@/app/contracts/patient-invite.repository';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';
import { assertRoomActive, PATIENT_INVITE_TTL_SECONDS } from '@/entities/sala';
import { isClinicalRole, UserRole } from '@/entities/user-role';

export type CriarLinkPacienteResult = {
  inviteUrl: string;
  expiresAt: Date;
};

@Injectable()
export class CriarLinkPacienteUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(PATIENT_INVITE_REPOSITORY)
    private readonly invites: PatientInviteRepository,
  ) {}

  async execute(input: {
    atendimentoId: string;
    userId: string;
    role: UserRole;
  }): Promise<CriarLinkPacienteResult> {
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
        'Somente o profissional responsável pode gerar link do paciente',
      );
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + PATIENT_INVITE_TTL_SECONDS * 1000);

    await this.invites.create({
      atendimentoId: input.atendimentoId,
      tokenHash,
      expiresAt,
      createdByUserId: input.userId,
    });

    const webBase = process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173';
    const inviteUrl = `${webBase.replace(/\/$/, '')}/paciente/sala/${rawToken}`;

    return { inviteUrl, expiresAt };
  }
}
