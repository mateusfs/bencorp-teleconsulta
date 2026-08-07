import { CriarUsuarioUseCase } from '../criar-usuario/criar-usuario';
import { ListarUsuariosUseCase } from '../listar-usuarios/listar-usuarios';
import { AtualizarUsuarioUseCase } from '../atualizar-usuario/atualizar-usuario';
import { UserRole } from '@/entities/user-role';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/entities/errors/domain-error';
import {
  alwaysHasher,
  buildUsuario,
  InMemoryUsuarioRepository,
} from './test-doubles';

describe('Usuários admin use cases', () => {
  it('lista usuários sem passwordHash', async () => {
    const repo = new InMemoryUsuarioRepository();
    repo.seed(
      buildUsuario({
        email: 'a@bencorp.local',
        role: UserRole.ADMIN,
        passwordHash: 'hashed:x',
      }),
    );
    const listar = new ListarUsuariosUseCase(repo);
    const result = await listar.execute();
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('passwordHash');
  });

  it('cria usuário e impede e-mail duplicado', async () => {
    const repo = new InMemoryUsuarioRepository();
    const criar = new CriarUsuarioUseCase(repo, alwaysHasher);

    const created = await criar.execute({
      email: 'novo@bencorp.local',
      password: 'Senha@123',
      role: UserRole.ENFERMEIRO,
    });
    expect(created.role).toBe(UserRole.ENFERMEIRO);

    await expect(
      criar.execute({
        email: 'novo@bencorp.local',
        password: 'Senha@123',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('valida senha mínima ao criar', async () => {
    const repo = new InMemoryUsuarioRepository();
    const criar = new CriarUsuarioUseCase(repo, alwaysHasher);
    await expect(
      criar.execute({
        email: 'x@bencorp.local',
        password: 'curta',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('atualiza papel e status', async () => {
    const repo = new InMemoryUsuarioRepository();
    const user = buildUsuario({
      email: 'medico@bencorp.local',
      role: UserRole.MEDICO,
    });
    repo.seed(user);
    const atualizar = new AtualizarUsuarioUseCase(repo);

    const updated = await atualizar.execute(user.id, {
      role: UserRole.ENFERMEIRO,
      active: false,
    });
    expect(updated.role).toBe(UserRole.ENFERMEIRO);
    expect(updated.active).toBe(false);
  });

  it('falha ao atualizar usuário inexistente', async () => {
    const repo = new InMemoryUsuarioRepository();
    const atualizar = new AtualizarUsuarioUseCase(repo);
    await expect(
      atualizar.execute('00000000-0000-0000-0000-000000000099', {
        active: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
