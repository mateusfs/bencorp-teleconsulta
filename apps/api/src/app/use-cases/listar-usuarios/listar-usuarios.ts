import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '@/app/contracts/usuario.repository';
import { toUsuarioPublico, UsuarioPublico } from '@/entities/usuario';

@Injectable()
export class ListarUsuariosUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
  ) {}

  async execute(): Promise<UsuarioPublico[]> {
    const list = await this.usuarios.list();
    return list.map(toUsuarioPublico);
  }
}
