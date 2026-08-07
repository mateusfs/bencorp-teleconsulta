import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import { AtendimentoFilaItem } from '@/entities/atendimento';
import { NotFoundError } from '@/entities/errors/domain-error';

@Injectable()
export class ObterAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
  ) {}

  async execute(atendimentoId: string): Promise<AtendimentoFilaItem> {
    const item = await this.atendimentos.findByIdWithPatient(atendimentoId);
    if (!item) {
      throw new NotFoundError('Atendimento não encontrado');
    }
    return item;
  }
}
