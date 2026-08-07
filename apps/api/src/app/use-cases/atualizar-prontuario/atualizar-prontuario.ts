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
} from '@/entities/errors/domain-error';
import { AtualizarProntuarioInput, Prontuario } from '@/entities/prontuario';
import { UserRole } from '@/entities/user-role';

@Injectable()
export class AtualizarProntuarioUseCase {
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
    data: AtualizarProntuarioInput;
  }): Promise<Prontuario> {
    const atendimento = await this.atendimentos.findById(input.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    if (atendimento.status !== AtendimentoStatus.EM_ANDAMENTO) {
      throw new UnprocessableStateError(
        'Prontuário imutável fora de atendimento em andamento',
      );
    }

    if (atendimento.professionalId !== input.userId) {
      throw new ForbiddenError(
        'Somente o profissional responsável pode editar o prontuário',
      );
    }

    const wantsPrescricao =
      input.data.prescricao !== undefined ||
      input.data.complementoMedico !== undefined;

    if (wantsPrescricao && input.role !== UserRole.MEDICO) {
      throw new ForbiddenError(
        'Somente MEDICO pode registrar prescrição/complemento',
      );
    }

    let prontuario = await this.prontuarios.findByAtendimentoId(
      input.atendimentoId,
    );
    if (!prontuario) {
      prontuario = await this.prontuarios.create({
        atendimentoId: input.atendimentoId,
        patientId: atendimento.patientId,
        riskClassification: atendimento.riskClassification,
      });
    }

    const updated = await this.prontuarios.update(prontuario.id, input.data);

    if (input.data.riskClassification !== undefined) {
      await this.atendimentos.updateRiskClassification(
        input.atendimentoId,
        input.data.riskClassification,
      );
    }

    return updated;
  }
}
