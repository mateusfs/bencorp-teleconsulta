import { Inject, Injectable } from '@nestjs/common';
import {
  AUDITORIA_LEITURA_REPOSITORY,
  AuditoriaLeituraRepository,
} from '@/app/contracts/auditoria-leitura.repository';
import {
  PRONTUARIO_REPOSITORY,
  ProntuarioRepository,
} from '@/app/contracts/prontuario.repository';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';
import { Prontuario } from '@/entities/prontuario';
import { isClinicalRole, UserRole } from '@/entities/user-role';

@Injectable()
export class ObterProntuarioPorIdUseCase {
  constructor(
    @Inject(PRONTUARIO_REPOSITORY)
    private readonly prontuarios: ProntuarioRepository,
    @Inject(AUDITORIA_LEITURA_REPOSITORY)
    private readonly auditorias: AuditoriaLeituraRepository,
  ) {}

  async execute(input: {
    prontuarioId: string;
    userId: string;
    role: UserRole;
    endpoint: string;
  }): Promise<Prontuario> {
    if (!isClinicalRole(input.role)) {
      throw new ForbiddenError('Perfil sem acesso a prontuário clínico');
    }

    const prontuario = await this.prontuarios.findById(input.prontuarioId);
    if (!prontuario) {
      throw new NotFoundError('Prontuário não encontrado');
    }

    await this.auditorias.register({
      prontuarioId: prontuario.id,
      patientId: prontuario.patientId,
      userId: input.userId,
      endpoint: input.endpoint,
    });

    return prontuario;
  }
}
