import { Inject, Injectable } from '@nestjs/common';
import {
  AUDITORIA_LEITURA_REPOSITORY,
  AuditoriaLeituraRepository,
} from '@/app/contracts/auditoria-leitura.repository';
import {
  PACIENTE_REPOSITORY,
  PacienteComHistorico,
  PacienteRepository,
} from '@/app/contracts/paciente.repository';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';
import { isClinicalRole, UserRole } from '@/entities/user-role';

@Injectable()
export class ObterPacienteDetalheUseCase {
  constructor(
    @Inject(PACIENTE_REPOSITORY)
    private readonly pacientes: PacienteRepository,
    @Inject(AUDITORIA_LEITURA_REPOSITORY)
    private readonly auditorias: AuditoriaLeituraRepository,
  ) {}

  async execute(input: {
    patientId: string;
    userId: string;
    role: UserRole;
    endpoint: string;
  }): Promise<PacienteComHistorico> {
    if (!isClinicalRole(input.role)) {
      throw new ForbiddenError('Perfil sem acesso ao detalhe do paciente');
    }

    const paciente = await this.pacientes.findById(input.patientId);
    if (!paciente) {
      throw new NotFoundError('Paciente não encontrado');
    }

    const historico = await this.pacientes.findHistoricoByPatientId(
      input.patientId,
    );

    for (const prontuario of historico.prontuarios) {
      await this.auditorias.register({
        prontuarioId: prontuario.id,
        patientId: paciente.id,
        userId: input.userId,
        endpoint: input.endpoint,
      });
    }

    return {
      paciente,
      atendimentos: historico.atendimentos,
      prontuarios: historico.prontuarios,
    };
  }
}
