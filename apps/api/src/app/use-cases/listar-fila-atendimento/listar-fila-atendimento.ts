import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
  ListarFilaFilters,
} from '@/app/contracts/atendimento.repository';
import { AtendimentoFilaItem } from '@/entities/atendimento';
import { ForbiddenError } from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';

@Injectable()
export class ListarFilaAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
  ) {}

  async execute(
    role: UserRole,
    filters: ListarFilaFilters,
  ): Promise<AtendimentoFilaItem[]> {
    if (filters.encaminhadosOnly && role !== UserRole.MEDICO) {
      throw new ForbiddenError(
        'Somente MEDICO pode filtrar atendimentos encaminhados',
      );
    }

    return this.atendimentos.listFila(filters);
  }
}
