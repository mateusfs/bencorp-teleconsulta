import { Usuario } from '@/entities/usuario';
import {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { PasswordHasher } from '@/app/contracts/password-hasher';
import { TokenService } from '@/app/contracts/token-service';
import { randomUUID } from 'crypto';

export class InMemoryUsuarioRepository implements UsuarioRepository {
  private readonly users = new Map<string, Usuario>();

  seed(usuario: Usuario): void {
    this.users.set(usuario.id, usuario);
  }

  findByEmail(email: string): Promise<Usuario | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<Usuario | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  list(): Promise<Usuario[]> {
    return Promise.resolve(
      [...this.users.values()].sort((a, b) => a.email.localeCompare(b.email)),
    );
  }

  create(input: CreateUsuarioInput): Promise<Usuario> {
    const now = new Date();
    const usuario: Usuario = {
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(usuario.id, usuario);
    return Promise.resolve(usuario);
  }

  update(id: string, input: UpdateUsuarioInput): Promise<Usuario> {
    const current = this.users.get(id);
    if (!current) {
      return Promise.reject(new Error('not found'));
    }
    const updated: Usuario = {
      ...current,
      role: input.role ?? current.role,
      active: input.active ?? current.active,
      passwordHash: input.passwordHash ?? current.passwordHash,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }
}

export function buildUsuario(
  overrides: Partial<Usuario> & Pick<Usuario, 'email' | 'role'>,
): Usuario {
  const now = new Date();
  return {
    id: overrides.id ?? randomUUID(),
    email: overrides.email,
    passwordHash: overrides.passwordHash ?? 'hash',
    role: overrides.role,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export const alwaysHasher: PasswordHasher = {
  hash: (plain: string) => Promise.resolve(`hashed:${plain}`),
  compare: (plain: string, hash: string) =>
    Promise.resolve(hash === `hashed:${plain}`),
};

export const fixedTokenService: TokenService = {
  sign: () =>
    Promise.resolve({
      accessToken: 'token-test',
      expiresIn: '8h',
    }),
  signPatient: () =>
    Promise.resolve({
      accessToken: 'patient-token-test',
      expiresIn: '900s',
    }),
};
