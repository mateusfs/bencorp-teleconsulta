import { Inject, Injectable } from '@nestjs/common';
import {
  PACIENTE_REPOSITORY,
  PacienteRepository,
} from '@/app/contracts/paciente.repository';
import { Paciente } from '@/entities/paciente';
import { ForbiddenError } from '@/entities/errors/domain-error';
import { isClinicalRole, UserRole } from '@/entities/user-role';

@Injectable()
export class ListarPacientesUseCase {
  constructor(
    @Inject(PACIENTE_REPOSITORY)
    private readonly pacientes: PacienteRepository,
  ) {}

  async execute(role: UserRole, filters: { q?: string }): Promise<Paciente[]> {
    if (!isClinicalRole(role)) {
      throw new ForbiddenError('Perfil sem acesso à listagem de pacientes');
    }
    return this.pacientes.list({ q: filters.q });
  }
}
