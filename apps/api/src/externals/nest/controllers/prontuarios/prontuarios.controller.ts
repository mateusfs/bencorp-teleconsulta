import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AtualizarProntuarioUseCase } from '@/app/use-cases/atualizar-prontuario';
import { CriarAdendoProntuarioUseCase } from '@/app/use-cases/criar-adendo-prontuario';
import { ObterProntuarioPorAtendimentoUseCase } from '@/app/use-cases/obter-prontuario-por-atendimento';
import { ObterProntuarioPorIdUseCase } from '@/app/use-cases/obter-prontuario-por-id';
import { UserRole } from '@/entities/user-role';
import {
  AtualizarProntuarioDto,
  CriarAdendoDto,
} from '@/externals/nest/pipes/prontuarios/prontuario.dto';
import { AuthenticatedUser } from '@/externals/nest/security/authenticated-user';
import { CurrentUser } from '@/externals/nest/security/current-user.decorator';
import { JwtAuthGuard } from '@/externals/nest/security/jwt-auth.guard';
import { Roles } from '@/externals/nest/security/roles.decorator';
import { RolesGuard } from '@/externals/nest/security/roles.guard';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProntuariosController {
  constructor(
    private readonly obterPorAtendimento: ObterProntuarioPorAtendimentoUseCase,
    private readonly obterPorId: ObterProntuarioPorIdUseCase,
    private readonly atualizar: AtualizarProntuarioUseCase,
    private readonly criarAdendo: CriarAdendoProntuarioUseCase,
  ) {}

  @Get('atendimentos/:atendimentoId/prontuario')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  getByAtendimento(
    @Param('atendimentoId', ParseUUIDPipe) atendimentoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.obterPorAtendimento.execute({
      atendimentoId,
      userId: user.userId,
      role: user.role,
      endpoint: req.originalUrl,
    });
  }

  @Put('atendimentos/:atendimentoId/prontuario')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  update(
    @Param('atendimentoId', ParseUUIDPipe) atendimentoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AtualizarProntuarioDto,
  ) {
    return this.atualizar.execute({
      atendimentoId,
      userId: user.userId,
      role: user.role,
      data: body,
    });
  }

  @Post('atendimentos/:atendimentoId/prontuario/adendos')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  adendo(
    @Param('atendimentoId', ParseUUIDPipe) atendimentoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CriarAdendoDto,
  ) {
    return this.criarAdendo.execute({
      atendimentoId,
      userId: user.userId,
      role: user.role,
      texto: body.texto,
    });
  }

  @Get('prontuarios/:id')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.obterPorId.execute({
      prontuarioId: id,
      userId: user.userId,
      role: user.role,
      endpoint: req.originalUrl,
    });
  }
}
