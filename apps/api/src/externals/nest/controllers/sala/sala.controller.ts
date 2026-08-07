import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CriarLinkPacienteUseCase } from '@/app/use-cases/criar-link-paciente';
import { EmitirTokenSalaUseCase } from '@/app/use-cases/emitir-token-sala';
import { ListarMensagensChatUseCase } from '@/app/use-cases/chat-sala';
import { ResgatarLinkPacienteUseCase } from '@/app/use-cases/resgatar-link-paciente';
import { UserRole } from '@/entities/user-role';
import { AuthenticatedUser } from '@/externals/nest/security/authenticated-user';
import { CurrentUser } from '@/externals/nest/security/current-user.decorator';
import { JwtAuthGuard } from '@/externals/nest/security/jwt-auth.guard';
import { Roles } from '@/externals/nest/security/roles.decorator';
import { RolesGuard } from '@/externals/nest/security/roles.guard';

@Controller()
export class SalaController {
  constructor(
    private readonly emitirToken: EmitirTokenSalaUseCase,
    private readonly criarLink: CriarLinkPacienteUseCase,
    private readonly resgatarLink: ResgatarLinkPacienteUseCase,
    private readonly listarChat: ListarMensagensChatUseCase,
  ) {}

  @Post('atendimentos/:id/sala/token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  emitir(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emitirToken.execute({
      atendimentoId: id,
      userId: user.userId,
      role: user.role,
    });
  }

  @Post('atendimentos/:id/sala/link-paciente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  criarLinkPaciente(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.criarLink.execute({
      atendimentoId: id,
      userId: user.userId,
      role: user.role,
    });
  }

  @Post('sala/links/:token/resgatar')
  resgatar(
    @Param('token') token: string,
    @Body() body?: { atendimentoId?: string },
  ) {
    return this.resgatarLink.execute({
      rawToken: token,
      expectedAtendimentoId: body?.atendimentoId,
    });
  }

  @Get('atendimentos/:id/sala/chat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  listarMensagens(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listarChat.execute({
      atendimentoId: id,
      role: user.role,
    });
  }
}
