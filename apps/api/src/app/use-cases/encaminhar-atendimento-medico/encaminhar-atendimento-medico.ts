import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  ROOM_TOKEN_REVOKER,
  RoomTokenRevoker,
} from '@/app/contracts/room-token-revoker';
import {
  Atendimento,
  AtendimentoStatus,
  assertTransition,
} from '@/entities/atendimento';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';

export type EncaminharResult = {
  parent: Atendimento;
  child: Atendimento;
};

@Injectable()
export class EncaminharAtendimentoMedicoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(ROOM_TOKEN_REVOKER)
    private readonly roomTokenRevoker: RoomTokenRevoker,
  ) {}

  async execute(
    atendimentoId: string,
    professionalId: string,
  ): Promise<EncaminharResult> {
    const existing = await this.atendimentos.findById(atendimentoId);
    if (!existing) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertTransition(existing.status, AtendimentoStatus.FINALIZADO);

    if (existing.professionalId !== professionalId) {
      throw new ForbiddenError(
        'Somente o profissional responsável pode encaminhar',
      );
    }

    const result = await this.atendimentos.finalizeAndCreateEncaminhado({
      from: existing,
      finishedAt: new Date(),
    });

    await this.roomTokenRevoker.revokeAllForAtendimento(atendimentoId);
    return result;
  }
}
