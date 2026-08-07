import { Injectable } from '@nestjs/common';
import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '@/entities/user-role';
import { Usuario } from '@/entities/usuario';
import {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { PrismaService } from './prisma.service';

function mapRole(role: PrismaUserRole): UserRole {
  return UserRole[role];
}

function toDomain(user: PrismaUser): Usuario {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    role: mapRole(user.role),
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? toDomain(user) : null;
  }

  async findById(id: string): Promise<Usuario | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toDomain(user) : null;
  }

  async list(): Promise<Usuario[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { email: 'asc' },
    });
    return users.map(toDomain);
  }

  async create(input: CreateUsuarioInput): Promise<Usuario> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        active: input.active ?? true,
      },
    });
    return toDomain(user);
  }

  async update(id: string, input: UpdateUsuarioInput): Promise<Usuario> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        role: input.role,
        active: input.active,
        passwordHash: input.passwordHash,
      },
    });
    return toDomain(user);
  }
}
