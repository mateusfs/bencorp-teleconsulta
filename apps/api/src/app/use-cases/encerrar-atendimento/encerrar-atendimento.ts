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
  DesfechoAtendimento,
  assertTransition,
} from '@/entities/atendimento';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';

@Injectable()
export class EncerrarAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(ROOM_TOKEN_REVOKER)
    private readonly roomTokenRevoker: RoomTokenRevoker,
  ) {}

  async execute(
    atendimentoId: string,
    professionalId: string,
  ): Promise<Atendimento> {
    const existing = await this.atendimentos.findById(atendimentoId);
    if (!existing) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertTransition(existing.status, AtendimentoStatus.FINALIZADO);

    if (existing.professionalId !== professionalId) {
      throw new ForbiddenError(
        'Somente o profissional responsável pode encerrar',
      );
    }

    const finalized = await this.atendimentos.finalize({
      id: atendimentoId,
      desfecho: DesfechoAtendimento.ENCERRADO,
      finishedAt: new Date(),
    });

    await this.roomTokenRevoker.revokeAllForAtendimento(atendimentoId);
    return finalized;
  }
}
