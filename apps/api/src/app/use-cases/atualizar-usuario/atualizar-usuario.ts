import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { UserRole } from '@/entities/user-role';
import { toUsuarioPublico, UsuarioPublico } from '@/entities/usuario';
import { NotFoundError } from '@/entities/errors/domain-error';

export type AtualizarUsuarioInput = {
  role?: UserRole;
  active?: boolean;
};

@Injectable()
export class AtualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
  ) {}

  async execute(
    id: string,
    input: AtualizarUsuarioInput,
  ): Promise<UsuarioPublico> {
    const existing = await this.usuarios.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const updated = await this.usuarios.update(id, {
      role: input.role,
      active: input.active,
    });

    return toUsuarioPublico(updated);
  }
}
