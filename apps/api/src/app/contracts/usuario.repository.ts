import { Usuario } from '@/entities/usuario';
import { UserRole } from '@/entities/user-role';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export type CreateUsuarioInput = {
  email: string;
  passwordHash: string;
  role: UserRole;
  active?: boolean;
};

export type UpdateUsuarioInput = {
  role?: UserRole;
  active?: boolean;
  passwordHash?: string;
};

export interface UsuarioRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  list(): Promise<Usuario[]>;
  create(input: CreateUsuarioInput): Promise<Usuario>;
  update(id: string, input: UpdateUsuarioInput): Promise<Usuario>;
}
