import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ATENDIMENTO_REPOSITORY } from '@/app/contracts/atendimento.repository';
import { AUDITORIA_LEITURA_REPOSITORY } from '@/app/contracts/auditoria-leitura.repository';
import { PASSWORD_HASHER } from '@/app/contracts/password-hasher';
import { PRONTUARIO_REPOSITORY } from '@/app/contracts/prontuario.repository';
import { ROOM_TOKEN_REVOKER } from '@/app/contracts/room-token-revoker';
import { TOKEN_SERVICE } from '@/app/contracts/token-service';
import { USUARIO_REPOSITORY } from '@/app/contracts/usuario.repository';
import { AtualizarProntuarioUseCase } from '@/app/use-cases/atualizar-prontuario';
import { AtualizarUsuarioUseCase } from '@/app/use-cases/atualizar-usuario/atualizar-usuario';
import { CancelarAtendimentoUseCase } from '@/app/use-cases/cancelar-atendimento';
import { CriarAdendoProntuarioUseCase } from '@/app/use-cases/criar-adendo-prontuario';
import { CriarSolicitacaoAtendimentoUseCase } from '@/app/use-cases/criar-solicitacao-atendimento';
import { CriarUsuarioUseCase } from '@/app/use-cases/criar-usuario/criar-usuario';
import { EncaminharAtendimentoMedicoUseCase } from '@/app/use-cases/encaminhar-atendimento-medico';
import { EncerrarAtendimentoUseCase } from '@/app/use-cases/encerrar-atendimento';
import { IniciarAtendimentoUseCase } from '@/app/use-cases/iniciar-atendimento';
import { ListarFilaAtendimentoUseCase } from '@/app/use-cases/listar-fila-atendimento';
import { ListarUsuariosUseCase } from '@/app/use-cases/listar-usuarios/listar-usuarios';
import { LoginUsuarioUseCase } from '@/app/use-cases/login-usuario/login-usuario';
import { ObterAtendimentoUseCase } from '@/app/use-cases/obter-atendimento';
import { ObterProntuarioPorAtendimentoUseCase } from '@/app/use-cases/obter-prontuario-por-atendimento';
import { ObterProntuarioPorIdUseCase } from '@/app/use-cases/obter-prontuario-por-id';
import { BcryptPasswordHasher } from '@/externals/cryptography/bcrypt-password-hasher';
import { JwtTokenService } from '@/externals/cryptography/jwt-token.service';
import { PrismaAtendimentoRepository } from '@/externals/database/prisma/prisma-atendimento.repository';
import { PrismaAuditoriaLeituraRepository } from '@/externals/database/prisma/prisma-auditoria-leitura.repository';
import { PrismaProntuarioRepository } from '@/externals/database/prisma/prisma-prontuario.repository';
import { PrismaUsuarioRepository } from '@/externals/database/prisma/prisma-usuario.repository';
import { PrismaService } from '@/externals/database/prisma/prisma.service';
import { RequestLoggingInterceptor } from '@/externals/logging/request-logging.interceptor';
import { AtendimentosController } from '@/externals/nest/controllers/atendimentos/atendimentos.controller';
import { AuthController } from '@/externals/nest/controllers/auth/auth.controller';
import { HealthController } from '@/externals/nest/controllers/health/health.controller';
import { ProntuariosController } from '@/externals/nest/controllers/prontuarios/prontuarios.controller';
import { UsersController } from '@/externals/nest/controllers/users/users.controller';
import { DomainExceptionFilter } from '@/externals/nest/filters/domain-exception.filter';
import { JwtStrategy } from '@/externals/nest/security/jwt.strategy';
import { NoopRoomTokenRevoker } from '@/externals/telepresenca/noop-room-token-revoker';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    UsersController,
    AtendimentosController,
    ProntuariosController,
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    LoginUsuarioUseCase,
    ListarUsuariosUseCase,
    CriarUsuarioUseCase,
    AtualizarUsuarioUseCase,
    ListarFilaAtendimentoUseCase,
    CriarSolicitacaoAtendimentoUseCase,
    ObterAtendimentoUseCase,
    IniciarAtendimentoUseCase,
    CancelarAtendimentoUseCase,
    EncerrarAtendimentoUseCase,
    EncaminharAtendimentoMedicoUseCase,
    ObterProntuarioPorAtendimentoUseCase,
    ObterProntuarioPorIdUseCase,
    AtualizarProntuarioUseCase,
    CriarAdendoProntuarioUseCase,
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: ATENDIMENTO_REPOSITORY, useClass: PrismaAtendimentoRepository },
    { provide: PRONTUARIO_REPOSITORY, useClass: PrismaProntuarioRepository },
    {
      provide: AUDITORIA_LEITURA_REPOSITORY,
      useClass: PrismaAuditoriaLeituraRepository,
    },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: ROOM_TOKEN_REVOKER, useClass: NoopRoomTokenRevoker },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule {}
