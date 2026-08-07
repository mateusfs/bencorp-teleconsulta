import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AtualizarUsuarioUseCase } from '@/app/use-cases/atualizar-usuario/atualizar-usuario';
import { CriarUsuarioUseCase } from '@/app/use-cases/criar-usuario/criar-usuario';
import { ListarUsuariosUseCase } from '@/app/use-cases/listar-usuarios/listar-usuarios';
import { UserRole } from '@/entities/user-role';
import { JwtAuthGuard } from '@/externals/nest/security/jwt-auth.guard';
import { Roles } from '@/externals/nest/security/roles.decorator';
import { RolesGuard } from '@/externals/nest/security/roles.guard';
import {
  CreateUserDto,
  UpdateUserDto,
} from '@/externals/nest/pipes/users/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly listarUsuarios: ListarUsuariosUseCase,
    private readonly criarUsuario: CriarUsuarioUseCase,
    private readonly atualizarUsuario: AtualizarUsuarioUseCase,
  ) {}

  @Get()
  list() {
    return this.listarUsuarios.execute();
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.criarUsuario.execute(body);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateUserDto) {
    return this.atualizarUsuario.execute(id, body);
  }
}
