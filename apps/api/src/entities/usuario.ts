import { UserRole } from './user-role';

export type Usuario = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

export function toUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    email: usuario.email,
    role: usuario.role,
    active: usuario.active,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
}
