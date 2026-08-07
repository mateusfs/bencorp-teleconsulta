import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  Atendimento,
  AtendimentoStatus,
  assertTransition,
} from '@/entities/atendimento';
import { ConflictError, NotFoundError } from '@/entities/errors/domain-error';

@Injectable()
export class IniciarAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
  ) {}

  async execute(
    atendimentoId: string,
    professionalId: string,
  ): Promise<Atendimento> {
    const existing = await this.atendimentos.findById(atendimentoId);
    if (!existing) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertTransition(existing.status, AtendimentoStatus.EM_ANDAMENTO);

    const emAndamento =
      await this.atendimentos.findEmAndamentoByProfessional(professionalId);
    if (emAndamento) {
      throw new ConflictError(
        'Profissional já possui atendimento em andamento',
      );
    }

    const claimed = await this.atendimentos.claimAtomic(
      atendimentoId,
      professionalId,
      new Date(),
    );

    if (!claimed) {
      throw new ConflictError('Atendimento já iniciado por outro profissional');
    }

    return claimed;
  }
}
