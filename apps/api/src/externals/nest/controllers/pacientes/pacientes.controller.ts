import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ListarPacientesUseCase } from '@/app/use-cases/listar-pacientes';
import { ObterPacienteDetalheUseCase } from '@/app/use-cases/obter-paciente-detalhe';
import { UserRole } from '@/entities/user-role';
import { ListarPacientesQueryDto } from '@/externals/nest/pipes/pacientes/paciente.dto';
import { AuthenticatedUser } from '@/externals/nest/security/authenticated-user';
import { CurrentUser } from '@/externals/nest/security/current-user.decorator';
import { JwtAuthGuard } from '@/externals/nest/security/jwt-auth.guard';
import { Roles } from '@/externals/nest/security/roles.decorator';
import { RolesGuard } from '@/externals/nest/security/roles.guard';

@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(
    private readonly listar: ListarPacientesUseCase,
    private readonly detalhe: ObterPacienteDetalheUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListarPacientesQueryDto,
  ) {
    return this.listar.execute(user.role, { q: query.q });
  }

  @Get(':id')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.detalhe.execute({
      patientId: id,
      userId: user.userId,
      role: user.role,
      endpoint: req.originalUrl,
    });
  }
}
