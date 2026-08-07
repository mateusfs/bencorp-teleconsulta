import { Injectable } from '@nestjs/common';
import {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { NotFoundError } from '@/entities/errors/domain-error';
import { Usuario } from '@/entities/usuario';
import { MemoryStore } from './memory-store';

@Injectable()
export class MemoryUsuarioRepository implements UsuarioRepository {
  constructor(private readonly store: MemoryStore) {}

  findByEmail(email: string): Promise<Usuario | null> {
    for (const user of this.store.users.values()) {
      if (user.email === email) {
        return Promise.resolve({ ...user });
      }
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<Usuario | null> {
    const user = this.store.users.get(id);
    return Promise.resolve(user ? { ...user } : null);
  }

  list(): Promise<Usuario[]> {
    return Promise.resolve(
      [...this.store.users.values()]
        .map((u) => ({ ...u }))
        .sort((a, b) => a.email.localeCompare(b.email)),
    );
  }

  create(input: CreateUsuarioInput): Promise<Usuario> {
    const now = new Date();
    const usuario: Usuario = {
      id: this.store.newId(),
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.store.users.set(usuario.id, usuario);
    this.store.markDirty();
    return Promise.resolve({ ...usuario });
  }

  update(id: string, input: UpdateUsuarioInput): Promise<Usuario> {
    const current = this.store.users.get(id);
    if (!current) {
      return Promise.reject(new NotFoundError('Usuário não encontrado'));
    }
    const updated: Usuario = {
      ...current,
      role: input.role ?? current.role,
      active: input.active ?? current.active,
      passwordHash: input.passwordHash ?? current.passwordHash,
      updatedAt: new Date(),
    };
    this.store.users.set(id, updated);
    this.store.markDirty();
    return Promise.resolve({ ...updated });
  }
}
