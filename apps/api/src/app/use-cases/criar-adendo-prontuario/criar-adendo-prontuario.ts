import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  PRONTUARIO_REPOSITORY,
  ProntuarioRepository,
} from '@/app/contracts/prontuario.repository';
import { AtendimentoStatus } from '@/entities/atendimento';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableStateError,
  ValidationError,
} from '@/entities/errors/domain-error';
import { ProntuarioAdendo } from '@/entities/prontuario';
import { isClinicalRole, UserRole } from '@/entities/user-role';

@Injectable()
export class CriarAdendoProntuarioUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(PRONTUARIO_REPOSITORY)
    private readonly prontuarios: ProntuarioRepository,
  ) {}

  async execute(input: {
    atendimentoId: string;
    userId: string;
    role: UserRole;
    texto: string;
  }): Promise<ProntuarioAdendo> {
    if (!isClinicalRole(input.role)) {
      throw new ForbiddenError('Perfil sem acesso a prontuário clínico');
    }

    const texto = input.texto.trim();
    if (!texto) {
      throw new ValidationError('Texto do adendo é obrigatório');
    }

    const atendimento = await this.atendimentos.findById(input.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    if (atendimento.status !== AtendimentoStatus.FINALIZADO) {
      throw new UnprocessableStateError(
        'Adendo só é permitido após finalização do atendimento',
      );
    }

    const prontuario = await this.prontuarios.findByAtendimentoId(
      input.atendimentoId,
    );
    if (!prontuario) {
      throw new NotFoundError('Prontuário não encontrado');
    }

    return this.prontuarios.addAdendo(prontuario.id, input.userId, texto);
  }
}
