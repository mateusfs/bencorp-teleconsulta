import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '@/app/contracts/password-hasher';
import { TOKEN_SERVICE, TokenService } from '@/app/contracts/token-service';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { toUsuarioPublico, UsuarioPublico } from '@/entities/usuario';
import { UnauthorizedError } from '@/entities/errors/domain-error';

export type LoginResult = {
  accessToken: string;
  expiresIn: string;
  user: UsuarioPublico;
};

@Injectable()
export class LoginUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const usuario = await this.usuarios.findByEmail(email.toLowerCase().trim());
    if (!usuario || !usuario.active) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const valid = await this.passwordHasher.compare(
      password,
      usuario.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const token = await this.tokenService.sign({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    return {
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      user: toUsuarioPublico(usuario),
    };
  }
}
