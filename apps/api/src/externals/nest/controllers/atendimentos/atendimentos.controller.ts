import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CancelarAtendimentoUseCase } from '@/app/use-cases/cancelar-atendimento';
import { CriarSolicitacaoAtendimentoUseCase } from '@/app/use-cases/criar-solicitacao-atendimento';
import { EncaminharAtendimentoMedicoUseCase } from '@/app/use-cases/encaminhar-atendimento-medico';
import { EncerrarAtendimentoUseCase } from '@/app/use-cases/encerrar-atendimento';
import { IniciarAtendimentoUseCase } from '@/app/use-cases/iniciar-atendimento';
import { ListarFilaAtendimentoUseCase } from '@/app/use-cases/listar-fila-atendimento';
import { ObterAtendimentoUseCase } from '@/app/use-cases/obter-atendimento';
import { UserRole } from '@/entities/user-role';
import {
  CriarSolicitacaoDto,
  ListarFilaQueryDto,
} from '@/externals/nest/pipes/atendimentos/atendimento.dto';
import { AuthenticatedUser } from '@/externals/nest/security/authenticated-user';
import { CurrentUser } from '@/externals/nest/security/current-user.decorator';
import { JwtAuthGuard } from '@/externals/nest/security/jwt-auth.guard';
import { Roles } from '@/externals/nest/security/roles.decorator';
import { RolesGuard } from '@/externals/nest/security/roles.guard';

@Controller('atendimentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AtendimentosController {
  constructor(
    private readonly listarFila: ListarFilaAtendimentoUseCase,
    private readonly criarSolicitacao: CriarSolicitacaoAtendimentoUseCase,
    private readonly obterAtendimento: ObterAtendimentoUseCase,
    private readonly iniciarAtendimento: IniciarAtendimentoUseCase,
    private readonly cancelarAtendimento: CancelarAtendimentoUseCase,
    private readonly encerrarAtendimento: EncerrarAtendimentoUseCase,
    private readonly encaminharAtendimento: EncaminharAtendimentoMedicoUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListarFilaQueryDto,
  ) {
    return this.listarFila.execute(user.role, {
      q: query.q,
      status: query.status,
      periodo: query.periodo ?? 'TODOS',
      encaminhadosOnly: query.encaminhadosOnly === 'true',
      omitPatientPii: query.slim === 'true',
    });
  }

  @Post()
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO, UserRole.ADMIN)
  create(@Body() body: CriarSolicitacaoDto) {
    return this.criarSolicitacao.execute(body);
  }

  @Get(':id')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.obterAtendimento.execute(id);
  }

  @Post(':id/iniciar')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  iniciar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.iniciarAtendimento.execute(id, user.userId);
  }

  @Post(':id/cancelar')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.cancelarAtendimento.execute(id);
  }

  @Post(':id/encerrar')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  encerrar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.encerrarAtendimento.execute(id, user.userId);
  }

  @Post(':id/encaminhar')
  @Roles(UserRole.ENFERMEIRO, UserRole.MEDICO)
  encaminhar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.encaminharAtendimento.execute(id, user.userId);
  }
}
