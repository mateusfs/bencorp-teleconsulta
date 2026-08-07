import { LoginUsuarioUseCase } from './login-usuario';
import { UserRole } from '@/entities/user-role';
import { UnauthorizedError } from '@/entities/errors/domain-error';
import {
  alwaysHasher,
  buildUsuario,
  fixedTokenService,
  InMemoryUsuarioRepository,
} from '../__tests__/test-doubles';

describe('LoginUsuarioUseCase', () => {
  it('autentica usuário ativo e retorna token', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.seed(
      buildUsuario({
        email: 'admin@bencorp.local',
        role: UserRole.ADMIN,
        passwordHash: 'hashed:Senha@123',
      }),
    );
    const useCase = new LoginUsuarioUseCase(
      repo,
      alwaysHasher,
      fixedTokenService,
    );

    const result = await useCase.execute('admin@bencorp.local', 'Senha@123');

    expect(result.accessToken).toBe('token-test');
    expect(result.user.email).toBe('admin@bencorp.local');
    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejeita credenciais inválidas', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.seed(
      buildUsuario({
        email: 'admin@bencorp.local',
        role: UserRole.ADMIN,
        passwordHash: 'hashed:Senha@123',
      }),
    );
    const useCase = new LoginUsuarioUseCase(
      repo,
      alwaysHasher,
      fixedTokenService,
    );

    await expect(
      useCase.execute('admin@bencorp.local', 'errada'),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejeita usuário inativo', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.seed(
      buildUsuario({
        email: 'admin@bencorp.local',
        role: UserRole.ADMIN,
        passwordHash: 'hashed:Senha@123',
        active: false,
      }),
    );
    const useCase = new LoginUsuarioUseCase(
      repo,
      alwaysHasher,
      fixedTokenService,
    );

    await expect(
      useCase.execute('admin@bencorp.local', 'Senha@123'),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
