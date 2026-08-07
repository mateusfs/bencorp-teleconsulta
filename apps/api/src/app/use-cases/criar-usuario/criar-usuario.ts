import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '@/app/contracts/password-hasher';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { UserRole } from '@/entities/user-role';
import { toUsuarioPublico, UsuarioPublico } from '@/entities/usuario';
import { ConflictError, ValidationError } from '@/entities/errors/domain-error';

export type CriarUsuarioInput = {
  email: string;
  password: string;
  role: UserRole;
};

@Injectable()
export class CriarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CriarUsuarioInput): Promise<UsuarioPublico> {
    const email = input.email.toLowerCase().trim();
    if (!email || !input.password || input.password.length < 8) {
      throw new ValidationError('E-mail e senha (mín. 8) são obrigatórios');
    }

    const existing = await this.usuarios.findByEmail(email);
    if (existing) {
      throw new ConflictError('E-mail já cadastrado');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const created = await this.usuarios.create({
      email,
      passwordHash,
      role: input.role,
      active: true,
    });

    return toUsuarioPublico(created);
  }
}
