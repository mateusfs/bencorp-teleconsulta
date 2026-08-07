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
import { NotFoundError } from '@/entities/errors/domain-error';

@Injectable()
export class CancelarAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
  ) {}

  async execute(atendimentoId: string): Promise<Atendimento> {
    const existing = await this.atendimentos.findById(atendimentoId);
    if (!existing) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    assertTransition(existing.status, AtendimentoStatus.CANCELADO);
    return this.atendimentos.cancel(atendimentoId);
  }
}
