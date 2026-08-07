import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '@/app/contracts/atendimento.repository';
import {
  AUDITORIA_LEITURA_REPOSITORY,
  AuditoriaLeituraRepository,
} from '@/app/contracts/auditoria-leitura.repository';
import {
  PRONTUARIO_REPOSITORY,
  ProntuarioRepository,
} from '@/app/contracts/prontuario.repository';
import { AtendimentoStatus } from '@/entities/atendimento';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';
import { Prontuario } from '@/entities/prontuario';
import { isClinicalRole, UserRole } from '@/entities/user-role';

@Injectable()
export class ObterProntuarioPorAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
    @Inject(PRONTUARIO_REPOSITORY)
    private readonly prontuarios: ProntuarioRepository,
    @Inject(AUDITORIA_LEITURA_REPOSITORY)
    private readonly auditorias: AuditoriaLeituraRepository,
  ) {}

  async execute(input: {
    atendimentoId: string;
    userId: string;
    role: UserRole;
    endpoint: string;
  }): Promise<Prontuario> {
    if (!isClinicalRole(input.role)) {
      throw new ForbiddenError('Perfil sem acesso a prontuário clínico');
    }

    const atendimento = await this.atendimentos.findById(input.atendimentoId);
    if (!atendimento) {
      throw new NotFoundError('Atendimento não encontrado');
    }

    let prontuario = await this.prontuarios.findByAtendimentoId(
      input.atendimentoId,
    );

    if (!prontuario) {
      if (atendimento.status !== AtendimentoStatus.EM_ANDAMENTO) {
        throw new NotFoundError('Prontuário não encontrado');
      }
      prontuario = await this.prontuarios.create({
        atendimentoId: input.atendimentoId,
        patientId: atendimento.patientId,
        riskClassification: atendimento.riskClassification,
      });
    }

    await this.auditorias.register({
      prontuarioId: prontuario.id,
      patientId: atendimento.patientId,
      userId: input.userId,
      endpoint: input.endpoint,
    });

    return prontuario;
  }
}
